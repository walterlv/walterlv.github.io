---
title: "无需安装 VS2019，在 Visual Studio 2022 中编译 .NET Framework 4.5/4/3.5 这样的古老框架"
publishDate: 2021-11-11 17:59:52 +0800
date: 2021-11-15 15:55:01 +0800
categories: visualstudio dotnet
position: problem
---

Visual Studio 2022 已正式发布！着急升级的小伙伴兴致勃勃地升级并卸载了原来的 Visual Studio 2019 后，发现自己的几个库项目竟然无法编译通过了。究其原因，是因为我的一些库依旧在支持古老的 .NET Framework 4.5 框架，而 Visual Studio 2022 不再附带如此古老的目标包了。

我之前在 [另一篇文章](/post/how-to-support-net45-on-vs2022-or-later) 中告诉大家通过将 Visual Studio 2019 装回来的方式解决这个问题，但是有小伙伴不想安装 Visual Studio 2019；所以本文用另外一种方法，无需安装 Visual Studio 2019，也无需单独安装 .NET Framework 目标包。

---

<div id="toc"></div>

## 无法编译 .NET Framework 4.5 项目

为了更广泛的适用于各种项目，我的一些库兼容的框架版本是非常古老的（比如下图截取的这张）。可是卸载掉 Visual Studio 2019 只留下 Visual Studio 2022 之后这些项目就不再能编译通过了。如果点开 Visual Studio 2022 的安装程序，会发现已经删除掉了 .NET Framework 4.5 的目标包了，无法通过它安装回来。

![支持古老的框架](/static/posts/2021-11-09-09-46-36.png)

![无法编译 .NET Framework 4.5 项目](/static/posts/2021-11-09-09-45-32.png)

![没有 .NET Frameweork 4.5 的目标包](/static/posts/2021-11-09-09-49-26.png)

## 关键步骤

### 第一步：安装 NuGet 包 Microsoft.NETFramework.ReferenceAssemblies

[Microsoft.NETFramework.ReferenceAssemblies](https://www.nuget.org/packages/Microsoft.NETFramework.ReferenceAssemblies/) 这款 NuGet 包旨在解决没有目标包的时候编译 .NET Framework 框架的问题。因此，我们将通过安装此 NuGet 包来解决 Visual Studio 2022 中目标包的缺失问题。

正常你只需要在项目中安装这个 NuGet 包即可。如果你整个解决方案里所有项目都需要兼容 .NET Framwework 4.5 或者更加古老的 .NET 框架，也可以用 Directory.Build.props 文件，详见：[使用 Directory.Build.props 管理多个项目配置 - 林德熙](https://blog.lindexi.com/post/Roslyn-%E4%BD%BF%E7%94%A8-Directory.Build.props-%E7%AE%A1%E7%90%86%E5%A4%9A%E4%B8%AA%E9%A1%B9%E7%9B%AE%E9%85%8D%E7%BD%AE.html)

```xml
<Project>
  <ItemGroup>
    <PackageReference Include="Microsoft.NETFramework.ReferenceAssemblies" Version="1.0.2" PrivateAssets="all" />
  </ItemGroup>
</Project>
```

**请特别注意**

如果你正在开发的是库项目，那么在引用此 NuGet 包之后，应该加上 `PrivateAssets="all"` 来标记此 NuGet 包不会成为你自己的库的其中一个依赖。否则就会像下图一样有一个不期望的依赖。

![不期望的依赖](/static/posts/2021-11-11-17-56-48.png)  
▲ 不期望的依赖

![正常的依赖](/static/posts/2021-11-11-17-59-41.png)  
▲ 正常的依赖

### 第二步：适配 Visual Studio 的特殊开发环境

如果你不用 VS2022，而只是使用 `dotnet build` 或 `msbuild` 命令来编译，那么以上第一步完成后就够了。不过考虑到大家基本上都是用 Visual Studio 来开发，所以上述操作在 VS 中的水土不服也需要特别处理一下。

在项目的 csproj 文件中添加一个 Target：

```xml
<Target Name="WalterlvPackagesIncludeNetFrameworkReferences" BeforeTargets="GetReferenceAssemblyPaths" DependsOnTargets="Restore"
        Condition=" '$(TargetFrameworkIdentifier)' == '.NETFramework' And '$(TargetFrameworkRootPath)' == '' ">
  <PropertyGroup>
    <TargetFrameworkRootPath Condition=" $(TargetFrameworkMoniker) == '.NETFramework,Version=v4.5' ">$(UserProfile)\.nuget\packages\microsoft.netframework.referenceassemblies.net45\1.0.2\build</TargetFrameworkRootPath>
    <TargetFrameworkRootPath Condition=" $(TargetFrameworkMoniker) == '.NETFramework,Version=v4.0' ">$(UserProfile)\.nuget\packages\microsoft.netframework.referenceassemblies.net40\1.0.2\build</TargetFrameworkRootPath>
  </PropertyGroup>
</Target>
```

或者如果前面你是在 Directory.Build.props 文件中添加的引用，那么就在对应的 Directory.Build.targets 文件中添加这一段（没有此文件则新建）。

解释一下这段代码如何适配了 Visual Studio 的特殊开发环境：

1. 猜测 VS 会缓存 `TargetFrameworkRootPath` 属性，一旦获取到其值将再也不会更新之，就算后面紧跟着还原 NuGet 包后值已被正常赋值了也不会使用（即使重启 VS 也是如此）；于是我们在 `TargetFrameworkRootPath` 属性为 `` 时手工给其赋上正确的值。
2. 猜测 VS 在发现 `TargetFrameworkRootPath` 属性所对应的路径不存在时视为与空同等处理；所以我们 `DependsOnTargets="Restore"` 以便在第一次还原 NuGet 包相关路径还没有创建时马上完成 NuGet 包的还原以创建对应目录。

在使用了以上代码后，Visual Studio 2022 刚打开项目时会短暂提示缺少 .NET Framework 4.5 框架，但真正编译时此提示会消失。这些问题都是单独使用命令来编译时不会遇到的问题。我也尝试过其他的解决方法，但都不能完美消除此错误提示（如果你没有 WPF 项目的话，也可以通过创建名为 `GetReferenceAssemblyPaths` 的空 Target 跳过检查）。

写完上面的代码之后：

1. 关闭 Visual Studio 2022
2. 清理仓库，执行 `git clean -xdf` 命令（这会删除所有未被版本管理的文件，包括 Visual Studio 的各种缓存文件）
3. 重新启动 Visual Studio 2022

## 一些注意事项

### 1. 需要覆盖整个解决方案中所有涉及到 .NET Framework 框架的项目

这个 NuGet 包的本质是在编译的时候设置 `TargetFrameworkRootPath` 属性到 NuGet 包里安装过来的目录，并且通过 `<Reference Include="mscorlib" Pack="false" />` 指定额外引用 mscorelib，所以不会产生额外的引用。于是这种方式安装的 NuGet 包不像其他的 NuGet 包那样可以传递到其他引用它的项目。

你需要做的：

1. 给所有含 .NET Framework 框架的项目安装 [Microsoft.NETFramework.ReferenceAssemblies](https://www.nuget.org/packages/Microsoft.NETFramework.ReferenceAssemblies/) NuGet 包
2. 如果不想直接给所有项目安装，可以使用 [Directory.Build.props](https://blog.lindexi.com/post/Roslyn-%E4%BD%BF%E7%94%A8-Directory.Build.props-%E7%AE%A1%E7%90%86%E5%A4%9A%E4%B8%AA%E9%A1%B9%E7%9B%AE%E9%85%8D%E7%BD%AE.html) 来一并安装

### 2. 不支持同一个文件夹下有两个 csproj 项目的情况

有时候为了方便，当两个项目几乎所有文件都相同，只是项目配置不同时，我们会考虑将这两个项目放到同一个文件夹里面以共用文件。可惜这种方式组织的项目，跟本问所提供的方案不兼容。

![两个项目文件在同一个文件夹下](/static/posts/2021-11-12-11-34-47.png)

如果解决方案中存在这样的项目组织方式，你会发现其他项目都能编译通过，唯独这两个项目依旧死在缺少 .NET Framework 45 目标包上。解决方法就是把这两个项目拆开成两个文件夹。

可是他们共用的文件怎么办？答案是在每个项目的 csproj 文件中添加下面几行：

```xml
  <ItemGroup>
    <Compile Include="..\SomeCommonFolder\**\*.cs" Link="%(RecursiveDir)%(Filename)%(Extension)" />
  </ItemGroup>
```

即他们都去共同的目录下把文件都拉进来编译，并且以链接的方式显示到 Visual Studio 解决方案管理器里。详见：[使用链接共享 Visual Studio 中的代码文件](/visualstudio/2016/08/01/share-code-with-add-as-link)

另外，这里的 `%(RecursiveDir)` 是递归显示文件夹（否则所有文件会拍平到项目里），`%(Filename)` 是将链接显示成文件名，`%(Extension)` 是在文件名后面显示文件扩展名。经此写法，项目里显示的其他文件夹的文件看起来就像真的在这个项目里一样。

### 3. 对于经典 csproj 格式（而非 SDK 风格 csproj 格式）的情况

评论区 [@afunc233](https://github.com/afunc233) 的[回复](https://github.com/walterlv/BlogComments/issues/104#issuecomment-968103614) 说经典 csproj 格式没办法使用本文所述的方法。

我个人建议还是迁移一下比较好，不难而且完全兼容旧格式的所有功能。迁移教程：[将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成 Sdk 风格的 csproj](https://blog.walterlv.com/post/introduce-new-style-csproj-into-net-framework)。

如果不想迁移，也可以试试[官方的方法](https://github.com/Microsoft/dotnet/tree/master/releases/reference-assemblies)。但我不想尝试，所以就在线等 TA 在评论区的回复吧！

### 4. 不想折腾之一：还是装回 VS2019 吧

有时候，你可能会遇到各种意料之外的问题，超出我上面列举的坑。不想折腾的话，那就把 .NET Framework 4.5 目标包装回来吧，可参见：[Visual Studio 2022 升级不再附带 .NET Framework 4.5 这种古老的目标包了，本文帮你装回来](/post/how-to-support-net45-on-vs2022-or-later)。

### 5. 不想折腾之二：打死也不装回 VS2019

有时候，你可能会遇到各种意料之外的问题，超出我上面列举的坑。如果你跟我一样，无论如何都不想装回 VS2019，那么还有解决方法：直接把 .NET Framework 的引用全拷到项目里来。操作如下：

1. 去 [Microsoft.NETFramework.ReferenceAssemblies](https://www.nuget.org/packages/Microsoft.NETFramework.ReferenceAssemblies/) NuGet 包的下载页，找到 Dependencies 标签，里面有各个不同 .NET Framework 版本的 .NET Framework 引用包。
2. 点开你项目需要的那个版本的 .NET Framework 包，然后在页面右边找到 Download package 链接，点它，下下来。
3. 解压下载下来的 NuGet 包，取出其中的“/build/.NET Framework”文件夹，复制到你的项目里某个位置。
4. 在你仓库的根目录添加或修改 Directory.Build.props 文件，里面添加下面的代码。

![各个版本的 .NET Framework 引用包](/static/posts/2021-11-12-11-59-41.png)

![复制 .NET Framework 文件夹](/static/posts/2021-11-12-12-03-33.png)

Directory.Build.props 文件的新增内容：

```diff
<Project>

++  <PropertyGroup>
++      <TargetFrameworkRootPath>$(MSBuildThisFileDirectory)Dependencies</TargetFrameworkRootPath>
++  </PropertyGroup>

++  <ItemGroup Condition=" ('$(TargetFrameworkIdentifier)' == '.NETFramework') And ('$(TargetFrameworkVersion)' == 'v4.5') ">
++      <Reference Include="mscorlib" Pack="false" />
++      <Reference Include="Microsoft.VisualBasic" Pack="false" Condition="'$(Language)' == 'VB' And '$(UsingMicrosoftNETSdk)' == 'true'" />
++  </ItemGroup>

</Project>
```

其中：

1. 如果没有此文件，那么创建一个。
2. 那个 `TargetFrameworkRootPath` 的值是 `.NETFramework` 文件夹的**父级文件夹**。划重点，你需要确保那个文件夹里面包含我们从 NuGet 包里解压出来的 `.NETFramework` 完整文件夹。
3. 后面的 `ItemGroup` 里的内容，直接照抄上文即可，我也是照抄 [Microsoft.NETFramework.ReferenceAssemblies](https://www.nuget.org/packages/Microsoft.NETFramework.ReferenceAssemblies/) 包里的

用最后的这种方法，算就究级解决方案了。没有这种方案解决不了的问题！如果有，那就是有某项目没受此文件影响，把这段代码拷到那个项目的 csproj 文件里去。
