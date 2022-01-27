---
title: "如何让 .NET 程序脱离系统安装的 .NET 运行时独立运行？除了 Self-Contained 之外还有更好方法！谈 dotnetCampus.AppHost 的工作原理"
date: 2022-01-27 18:37:55 +0800
categories: dotnet nuget
position: knowledge
coverImage: /static/posts/2022-01-27-18-19-22.png
---

从 .NET Core 3 开始，.NET 应用就支持独立部署自己的 .NET 运行时。可以不受系统全局安装的 .NET 运行时影响，特别适合国内这种爱优化精简系统的情况……鬼知道哪天就被优化精简了一个什么重要 .NET 运行时组件呢！然而，如果你的项目会生成多个 exe 程序，那么他们每个独立发布时，互相之间的运行时根本不互通。即便编译时使用完全相同的 .NET 框架（例如都设为 net6.0），最终也无法共用运行时文件。

而 [dotnetCampus.AppHost](https://www.nuget.org/packages/dotnetCampus.AppHost) 就可以帮助你完成多个 exe 共享独立部署的 .NET 环境的功能。其原理是允许你单独修改每个 exe 所查找的 .NET 运行时路径。那么本文带你详细了解其原理和实现。

---

<div id="toc"></div>

## 原代码解读

首先记得先把仓库拉下来：

- [dotnet/runtime: .NET is a cross-platform runtime for cloud, mobile, desktop, and IoT apps.](https://github.com/dotnet/runtime)

如果有产品化需求，记得切到对应的 Tag（例如 v6.0.1 等）。

.NET 的 AppHost 负责查找 .NET 运行时并将其运行起来，而 AppHost 相关的代码在 src\native\corehost 文件夹中。这些文件夹中的代码是以 CMakeList 方式管理的零散 C++ 文件（和头文件），可以使用 [CMake](https://cmake.org/download/) 里的 cmake-gui 工具来打开、管理和编译。不过我依然更喜欢使用 Visual Studio 来打开和编辑这些文件。Visual Studio 支持 CMake 工作区，详见 [CMake projects in Visual Studio](https://docs.microsoft.com/en-us/cpp/build/cmake-projects-in-visual-studio)。不过这些 CMakeList.txt 并没有针对 Visual Studio 做较好的适配，所以实际上个人认为最好的视图方式是 Visual Studio 的文件夹视图，或者 Visual Studio Code。

通过阅读 corehost 文件夹内各个 C++ 源代码文件，我们可以找到运行时寻找 .NET 运行时路径的功能在 fxr_resolver.cpp 文件中实现，具体是 `fxr_resolver::try_get_path` 函数。关键代码如下：

```cpp
// For apphost and libhost, root_path is expected to be a directory.
// For libhost, it may be empty if app-local search is not desired (e.g. com/ijw/winrt hosts, nethost when no assembly path is specified)
// If a hostfxr exists in root_path, then assume self-contained.
if (root_path.length() > 0 && library_exists_in_dir(root_path, LIBFXR_NAME, out_fxr_path))
{
    trace::info(_X("Resolved fxr [%s]..."), out_fxr_path->c_str());
    out_dotnet_root->assign(root_path);
    return true;
}

// For framework-dependent apps, use DOTNET_ROOT_<ARCH>
pal::string_t default_install_location;
pal::string_t dotnet_root_env_var_name;
if (get_dotnet_root_from_env(&dotnet_root_env_var_name, out_dotnet_root))
{
    trace::info(_X("Using environment variable %s=[%s] as runtime location."), dotnet_root_env_var_name.c_str(), out_dotnet_root->c_str());
}
else
{
    if (pal::get_dotnet_self_registered_dir(&default_install_location) || pal::get_default_installation_dir(&default_install_location))
    {
        trace::info(_X("Using global installation location [%s] as runtime location."), default_install_location.c_str());
        out_dotnet_root->assign(default_install_location);
    }
    else
    {
        trace::error(_X("A fatal error occurred, the default install location cannot be obtained."));
        return false;
    }
}
```

解读：

1. `root_path` 参数的含义为 .NET 程序的入口 dll 所在路径。一开始先判断一下 .NET 程序入口 dll 所在文件夹内有没有一个名为 hostfxr.dll 的文件，如果存在那么直接返回找到，就在应用程序所在文件夹；如果没有找到，就继续后续执行。
2. 试图从环境变量中找一个名为 `DOTNET_ROOT` 的变量并取得其值，然后将其转换为绝对路径。如果找到了这个变量并且路径存在，则使用此文件夹；如果没有定义或文件夹不存在，则继续后续执行。
3. 试图从全局安装的路径（`C:\Program Files\dotnet` 或 `C:\Program Files(x86)\dotnet` 路径下找 .NET 运行时，如果找到则使用此文件夹；如果没有找到，则返回错误，要求用户下载 .NET 运行时。

## 新代码修改

那么，我们的改动便可以从这里开始。

```diff
--  // For framework-dependent apps, use DOTNET_ROOT_<ARCH>
    pal::string_t default_install_location;
    pal::string_t dotnet_root_env_var_name;
++  if (is_dotnet_root_enabled_for_execution(out_dotnet_root))
++  {
++      // For apps that using dotnetCampus.AppHost, use the EMBED_DOTNET_ROOT placeholder.
++      trace::info(_X("Using embedded dotnet_root [%s] as runtime location."), out_dotnet_root->c_str());
++  }
--  if (get_dotnet_root_from_env(&dotnet_root_env_var_name, out_dotnet_root))
++  else if (get_dotnet_root_from_env(&dotnet_root_env_var_name, out_dotnet_root))
    {
++      // For framework-dependent apps, use DOTNET_ROOT_<ARCH>
        trace::info(_X("Using environment variable %s=[%s] as runtime location."), dotnet_root_env_var_name.c_str(), out_dotnet_root->c_str());
    }
    else
    {
        if (pal::get_dotnet_self_registered_dir(&default_install_location) || pal::get_default_installation_dir(&default_install_location))
        {
            trace::info(_X("Using global installation location [%s] as runtime location."), default_install_location.c_str());
            out_dotnet_root->assign(default_install_location);
        }
        else
        {
            trace::error(_X("A fatal error occurred, the default install location cannot be obtained."));
            return false;
        }
    }
```

解读：

1. 我添加了一个名为 `is_dotnet_root_enabled_for_execution` 的函数调用，试图找一下编译时确定的 .NET 运行时路径。如果发现编译时设过此路径，并且此文件夹在运行时存在，那么将此文件夹改为绝对路径后继续后续执行；如果没设过或路径不存在，则使用其他的方式来确定 .NET 运行时的路径。

而这个 `is_dotnet_root_enabled_for_execution` 函数，我的实现如下：

```cpp
#if defined(FEATURE_APPHOST) || defined(FEATURE_LIBHOST)
#define EMBED_DOTNET_ROOT_HI_PART_UTF8 "622e5d2d0f48bd3448f713291ed3f86d" // SHA-256 of "DOTNET_ROOT" in UTF-8
#define EMBED_DOTNET_ROOT_LO_PART_UTF8 "f2f05ca222e95084f222207c5c348eea"
#define EMBED_DOTNET_ROOT_FULL_UTF8    (EMBED_DOTNET_ROOT_HI_PART_UTF8 EMBED_DOTNET_ROOT_LO_PART_UTF8) // NUL terminated

bool is_dotnet_root_enabled_for_execution(pal::string_t* dotnet_root)
{
    constexpr int EMBED_SZ = sizeof(EMBED_DOTNET_ROOT_FULL_UTF8) / sizeof(EMBED_DOTNET_ROOT_FULL_UTF8[0]);
    constexpr int EMBED_MAX = (EMBED_SZ > 1025 ? EMBED_SZ : 1025); // 1024 DLL name length, 1 NUL

    // Contains the EMBED_DOTNET_ROOT_FULL_UTF8 value at compile time or the managed DLL name replaced by "dotnet build".
    // Must not be 'const' because std::string(&embed[0]) below would bind to a const string ctor plus length
    // where length is determined at compile time (=64) instead of the actual length of the string at runtime.
    static char embed[EMBED_MAX] = EMBED_DOTNET_ROOT_FULL_UTF8;     // series of NULs followed by embed hash string

    static const char hi_part[] = EMBED_DOTNET_ROOT_HI_PART_UTF8;
    static const char lo_part[] = EMBED_DOTNET_ROOT_LO_PART_UTF8;

    if (!pal::clr_palstring(embed, dotnet_root))
    {
        trace::error(_X("The dotnet_root value could not be retrieved from the executable image."));
        return false;
    }

    // Since the single static string is replaced by editing the executable, a reference string is needed to do the compare.
    // So use two parts of the string that will be unaffected by the edit.
    size_t hi_len = (sizeof(hi_part) / sizeof(hi_part[0])) - 1;
    size_t lo_len = (sizeof(lo_part) / sizeof(lo_part[0])) - 1;

    std::string binding(&embed[0]);
    if ((binding.size() >= (hi_len + lo_len)) &&
        binding.compare(0, hi_len, &hi_part[0]) == 0 &&
        binding.compare(hi_len, lo_len, &lo_part[0]) == 0)
    {
        trace::info(_X("This executable does not binding to dotnet_root yet. The binding value is: '%s'"), dotnet_root->c_str());
        return false;
    }

    trace::info(_X("The dotnet_root binding to this executable is: '%s'"), dotnet_root->c_str());
    if (pal::realpath(dotnet_root))
    {
        return true;
    }
    trace::info(_X("Did not find binded dotnet_root directory: '%s'"), dotnet_root->c_str());
    return false;
}
#endif // FEATURE_APPHOST
```

解读：

1. 随便生成了一段字符串 `622e5d2d0f48bd3448f713291ed3f86df2f05ca222e95084f222207c5c348eea`，然后定义三个宏，一个是前一半，一个是后一半，一个是整个字符串。
    - 这个字符串是一个占位符，将来在编译最终 exe 时，会在 exe 的二进制文件中搜索这一字符串，将其替换为我们需要的 .NET 运行时路径（如[在这篇文章中](http://blog.walterlv.com/post/share-self-deployed-dotnet-runtime-among-multiple-exes)我们设置成的 `runtime\6.0.1`）。
    - 这是一段随便生成的字符串，是通过将字符串 `DOTNET_ROOT` 进行 UTF-8 编码后 SHA-256 哈希得到的，你也可以用其他任何方法得到，只要避免整个 exe 不会碰巧遇到一模一样的字节序列就好。
    - 我们分成了前一半后一半和整条，是因为我们未来编译时只替换整条的，一半的不会被替换。于是可以通过在运行时比较整条的是否刚好等于两个半条的拼接来判定是否在编译时设置过 .NET 运行时路径。
2. 我们使用 `pal::clr_palstring` 将被替换的字符串进行 UTF-8 到 Unicode 的转码，这样就可以在运行时直接使用了。
3. 随后，我们比较一下前面第 1 条所说的是否设置过 .NET 运行时路径，只有设置过才会用，否则使用默认的运行时查找逻辑。
4. 最后，检查一下路径是否存在，将相对路径转换为绝对路径。（这个步骤是通过实测发现有问题才加的，如果只是相对路径，会有一部分逻辑正常执行另一部分挂掉）。

改完后，整个项目编译一下，以得到我们想要的 apphost.exe 和 singleapphost.exe。参考：

- [如何编译、修改和调试 dotnet runtime 仓库中的 apphost nethost comhost ijwhost - walterlv](http://blog.walterlv.com/post/how-to-modify-compile-and-debug-dotnet-apphost)

## 配合 NuGet 包编译

前面的修改，只是为了得到 apphost.exe，我们还没有让这个 apphost.exe 工作起来呢。

为了能工作起来，我们需要做一个像下面这样的 NuGet 包：

![NuGet 包结构](/static/posts/2022-01-27-18-19-22.png)

其中：

- build
    - 这个是预定义的文件夹，必须使用此名称。
    - 用来修改编译过程（这是 NuGet 包里用来编译的入口点），以便能将 AppHost 的修改加入到编译环节。
- template
    - 这个名字是随便取的，会在 build 里用到。
    - 替换占位符时会替换这里的 apphost.exe 文件。
- tools
    - 这个名字是随便取的，会在 build 里用到（虽然 tools 本来也是有特殊用途，不过我们没用到）。
    - 用来替换占位符的可执行程序就在这里。

而为了得到这样的 NuGet 包，我们这样来设计项目：

![项目结构](/static/posts/2022-01-27-18-24-19.png)

其中：

- Assets 文件夹里的内容会近似原封不动地放到目标 NuGet 包里（唯一变化的，就是在放进 NuGet 包之前会自动把 Build.props 和 Build.targets 的名字改一下）。
- Patches 文件夹里存放的是对 [dotnet/runtime: .NET is a cross-platform runtime for cloud, mobile, desktop, and IoT apps.](https://github.com/dotnet/runtime) 项目的修改补丁，以便后续修改 dotnet runtime 仓库时能随时使用这里的补丁继续。
- SourceProject 文件夹无需关心，是安装的源码包引来的。
- 其他所有文件都是用来编译生成替换占位符程序的。

为了能让这样的项目结构生成前面所述的 NuGet 包，我们需要修改项目的 csproj 文件：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFrameworks>net6.0;net5.0;net45</TargetFrameworks>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <RootNamespace>dotnetCampus.AppHosting</RootNamespace>
    <IncludeBuildOutput>false</IncludeBuildOutput>
  </PropertyGroup>

  <ItemGroup Condition="'$(TargetFramework)' == 'net6.0'">
    <PackageReference Include="dotnetCampus.CommandLine.Source" Version="3.3.0" PrivateAssets="All" />
    <PackageReference Include="dotnetCampus.MSBuildUtils.Source" Version="1.1.0" PrivateAssets="All" />
  </ItemGroup>

  <ItemGroup Condition="'$(TargetFramework)' != 'net6.0'">
    <Compile Remove="**\*.cs" />
    <Compile Include="Program.cs" />
  </ItemGroup>

  <!-- 引入包文件用于打包。 -->
  <Target Name="_IncludeAllDependencies" BeforeTargets="_GetPackageFiles">
    <ItemGroup>
      <None Include="Assets\build\Build.props" Pack="True" PackagePath="build\$(PackageId).props" />
      <None Include="Assets\build\Build.targets" Pack="True" PackagePath="build\$(PackageId).targets" />
      <None Include="Assets\template\**" Pack="True" PackagePath="template" />
      <None Include="$(OutputPath)net6.0\**" Pack="True" PackagePath="tools" />
    </ItemGroup>
  </Target>

</Project>
```

其中，重要的部分为：

1. `TargetFrameworks`：虽然我们只生成 `net6.0` 框架的替换 AppHost 占位符程序，但为了能让 NuGet 包能装在多框架项目中，我们需要添加其他框架的支持（虽然这些框架可能甚至都没有 AppHost 机制）。
    - 为此，我们需要在依赖其他 NuGet 包时使用 `Condition="'$(TargetFramework)' == 'net6.0'"` 判断，只在 `net6.0` 项目中用包。同时，还需要在非 net6.0 项目中移除几乎所有的源代码，避免其他框架限制我们的代码编写（例如 `net45` 框架会限制我们使用 .NET 6 的新 API）。
2. `GeneratePackageOnBuild` 设为 `true` 以生成 NuGet 包；`IncludeBuildOutput` 以避免将生成的文件输出到 NuGet 包中（因为我们有多个框架，而且除了 net6.0 都是垃圾文件，所以要避免默认生成进去；我们随后手工放入到 NuGet 包中）。
3. 通过名为 `_IncludeAllDependencie` 的 Target，我们将 Assets 文件夹中的所有文件打入 NuGet 包中，同时改一下 Build.props 和 Build.targets 文件的名字。然后把前面忽略的输出文件，将其 net6.0 框架部分手工打入 NuGet 包中。

那么剩下的，就是 Build.props / Build.targets 和占位符替换程序的部分了。

源码在这里：[dotnet-campus/dotnetCampus.AppHost](https://github.com/dotnet-campus/dotnetCampus.AppHost)。

Build.props 和 Build.targets 部分如果有问题，可以留言或者私信沟通；而占位符替换程序的本质就是读取文件并替换其一部分二进制序列，会比较简单。

---

**参考资料**

- [dotnet core 应用是如何跑起来的 通过AppHost理解运行过程](https://blog.lindexi.com/post/dotnet-core-%E5%BA%94%E7%94%A8%E6%98%AF%E5%A6%82%E4%BD%95%E8%B7%91%E8%B5%B7%E6%9D%A5%E7%9A%84-%E9%80%9A%E8%BF%87AppHost%E7%90%86%E8%A7%A3%E8%BF%90%E8%A1%8C%E8%BF%87%E7%A8%8B.html)
- [dotnet 桌面端基于 AppHost 的配置式自动切换更新后的应用程序路径](https://blog.lindexi.com/post/dotnet-%E6%A1%8C%E9%9D%A2%E7%AB%AF%E5%9F%BA%E4%BA%8E-AppHost-%E7%9A%84%E9%85%8D%E7%BD%AE%E5%BC%8F%E8%87%AA%E5%8A%A8%E5%88%87%E6%8D%A2%E6%9B%B4%E6%96%B0%E5%90%8E%E7%9A%84%E5%BA%94%E7%94%A8%E7%A8%8B%E5%BA%8F%E8%B7%AF%E5%BE%84.html)
- [Support deploying multiple exes as a single self-contained set · Issue #53834 · dotnet/runtime](https://github.com/dotnet/runtime/issues/53834)
- [How to share self contained runtime? · Issue #52974 · dotnet/runtime](https://github.com/dotnet/runtime/issues/52974)
- [DOTNET_ROOT does not work as the doc says. · Issue #64244 · dotnet/runtime](https://github.com/dotnet/runtime/issues/64244)
- [.NET environment variables - .NET CLI - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-environment-variables#dotnet_root-dotnet_rootx86)
- [Write a custom .NET runtime host - .NET - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/core/tutorials/netcore-hosting)
- [runtime/fxr_resolver.cpp at v6.0.1 · dotnet/runtime](https://github.com/dotnet/runtime/blob/v6.0.1/src/native/corehost/fxr_resolver.cpp#L55)
- [runtime/native-hosting.md at main · dotnet/runtime](https://github.com/dotnet/runtime/blob/main/docs/design/features/native-hosting.md)
- [samples/core/hosting at main · dotnet/samples](https://github.com/dotnet/samples/tree/main/core/hosting)
- [c# - While a self-contained .NetCore app is running, what's the best way to start another .NetCore app sharing the same runtime? - Stack Overflow](https://stackoverflow.com/q/63222315/6233938)

