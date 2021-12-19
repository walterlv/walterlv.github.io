---
title: "C#/.NET 如何创建带有本机依赖的多框架多系统 NuGet 包"
date: 2021-12-13 20:21:48 +0800
categories: dotnet nuget msbuild
position: knowledge
image:
  src: /static/posts/2021-12-13-20-02-30.png
---

正常如果你想写一个 .NET 的 NuGet 包，直接打包就好了，你的引用程序集会出现在 NuGet 包内的 lib 文件夹内。然而，如果我们的 NuGet 包包含本机依赖的话怎么办呢？

---

<div id="toc"></div>

## 我们的项目需求

假设我们要做一个 NuGet 包 Walterlv.MixPackage，包含以下内容：

1. 一个要被引用的托管程序集 Walterlv.MixPackage.dll
2. 一个封装了本机代码的 C++/CLI 程序集 Walterlv.NativeWrapper.dll
3. 一个被封装的本机代码动态链接库 Walterlv.Interop.dll
4. 其他本机依赖 Ijwhost.dll、concrt140.dll、msvcp140.dll、vcruntime140.dll、ucrtbase.dll 等

其中 1 是完全使用 C# 编写的 .NET 程序集，2 是 C++/CLI 程序集。3 是团队内编写的实现功能的本机动态链接库。1 依赖 2，2 依赖 3，3 依赖 4。实际上 3 和 4 在打包方式上是完全一样的，所以我们后面会将其合并考虑。

在你具体的项目中，可以只有 1、4 也可以只有 1、3、4 或者是 2、4 或者是 2、3、4。对于这些不同的组合，NuGet 包的制作会有一点点不一样，在这篇博客里面都会说应该怎么做。

## NuGet 相关文件夹解读

我曾在这两篇博客里提到过 NuGet 文件夹，那里会更全一些但是不够细。而本文不会全面，却对本文所需的例子说明得更加详细。感兴趣也可以过去看看。

- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool)
- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool)

我们会涉及到这些文件夹：

```
+ buildTransive
    - 可选。包含构建时的一些自定义任务（如果有的化），可随着包依赖而传递执行。
+ lib
    - 必须。放你最终被引用的托管程序集，将被引用。
+ ref
    - 看情况，可能必须可能可选。如果你除了要引用托管程序集外，还要引用平台相关的程序集，那么这就是必须的。
+ runtimes
    - 必须。用来放平台相关的动态链接库。
```

其中，`runtimes` 文件夹的层次结构类似这样：

```
+ runtimes
    + win
        - net46
        - net451
        - net461
        - netcoreapp2.1
        - netstandard1.3
        - netstandard2.0
        - uap10.0.16299
    + unix
        - netcoreapp2.1
        - netstandard1.3
        - netstandard2.0
    + osx
        - netcoreapp2.1
        - netstandard1.3
        - netstandard2.0
```

当然如果你只跑在 Windows 系统上，也可以是这样（实际上是一样的，看你需求）：

```
+ runtimes
    + win-x86
        + lib
            - net45
            - netcoreapp3.1
            - net5.0
    + win-x64
        + lib
            - net45
            - netcoreapp3.1
            - net5.0
```

其中，`ref` 文件夹内包含各个不同框架下要引用的程序集。

```
+ ref
    - net45
    - netcoreapp3.1
    - net5.0
```

最后那个 `lib` 文件夹应该不用多作解释了，一个普通的 .NET 程序集打出的 NuGet 包里带的就是这个文件夹，用来被引用。

但需要特别说明的是：

* 【重要】**如果你包含 `lib` 文件夹，那么你应该分拆成两个 NuGet 包！** 否则可能迫于 .NET Core 下我还没懂的 .deps 文件的引用机制，你将无法同时引用托管和 C++/CLI 程序集。

## 制作这样的 NuGet 包

如果你对 NuGet 打包比较熟，相信看到上面的文件夹结构就已经知道怎么打出这样的包了。不过如果不熟也没关系，我们继续阅读下文。

### 打出什么样的包？

对于本文前面说到的几种包，打的方式不太一样。总共 3 种不同的 dll（托管程序集、C++/CLI 程序集、本机动态链接库），因此我们能组合出 7 种不同的包结构。

#### 1/7 只含托管程序集

太简单了，默认打包就是这样。本文不讲。

#### 2/7 只含本机动态链接库

如果只含本机动态链接库，只需要做好 runtimes 文件夹就够了。制作方法见后文的“本机依赖包（单包）”。

#### 3/7 只含 C++/CLI 程序集

如果只含C++/CLI 程序集和本机动态链接库，一样只需要做好 runtimes 文件夹就够了。制作方法见后文的“本机依赖包（单包）”。

#### 4/7 含 C++/CLI 程序集和本机动态链接库

如果只含 C++/CLI 程序集和本机动态链接库，一样只需要做好 runtimes 文件夹就够了。制作方法见后文的“本机依赖包（单包）”。

#### 5/7 含托管程序集和本机动态链接库

如果只含托管程序集和本机动态链接库，只需要做好 lib 和 runtimes 文件夹就够了。制作方法见后文的“本机依赖包（单包）”。

#### 6/7 托管程序集和 C++/CLI 程序集

由于包含了托管程序集和 C++/CLI 程序集，这两种程序集同时被 .NET Core App / .NET 5/6 项目引用时会出现问题，分别引用则正常。所以制作方法见后文的“托管、C++/CLI 和本机依赖包（双包）”。

但是，如果你的托管程序集完全封装好了 C++/CLI 程序集，使得后者完全不会被项目引用的话，你也可以把它视作本机动态链接库来做，即做成“本机依赖包（单包）”。

#### 7/7 含托管程序集、C++/CLI 程序集、本机动态链接库

由于包含了托管程序集和 C++/CLI 程序集，这两种程序集同时被 .NET Core App / .NET 5/6 项目引用时会出现问题，分别引用则正常。所以制作方法见后文的“托管、C++/CLI 和本机依赖包（双包）”。

但是，如果你的托管程序集完全封装好了 C++/CLI 程序集，使得后者完全不会被项目引用的话，你也可以把它视作本机动态链接库来做，即做成“本机依赖包（单包）”。

### 包制作方法

在前面的 7 种不同的组合中，我们最终会做出两种不同的包来：

1. 只包含托管依赖或只包含本机依赖的“单包”，其特点为这些依赖只需拷贝到输出目录即可，项目本身不会直接依赖它们的类型（例如通过 P/Invoke 调用的那些 dll）。
2. 同时包含托管依赖和 C++/CLI 依赖的“双包”，其特点为项目会直接使用 C++/CLI 程序集里的类型。

分别介绍制作方法。

#### 本机依赖包（单包）

单包特别好打。所以如果你不是有特别需要的话，最好还是选单包。

##### 第一步：创建一个普通的类库

![创建一个普通的 .NET 类库](/static/posts/2021-12-13-19-20-16.png)

##### 第二步：将本机依赖文件拷至对应文件夹下

这里，我们建了一个“Assets”文件夹，用来放 NuGet 的零散文件。这个名字你可以随便取，反正也不会进到 NuGet 文件夹中。

随后，我们依层级建好“runtimes”、“win-x86”、“lib”、“netcoreapp3.1”这样的文件夹一整组（见下图）。然后，把对应架构的 dll 分别拷至对应的目录下。

![项目文件结构](/static/posts/2021-12-13-19-42-28.png)

图中出现的 Ijwhost.dll 是加载 C++/CLI 程序集必须的 .NET Core 运行时，在生成 C++/CLI 程序集时会出现在其输出目录里。

##### 第三步：将文件打入 NuGet 包中

编辑刚刚项目的 csproj 文件，用 `GeneratePackageOnBuild` 标记要生成 NuGet 包；用 `_GetPackageFiles` 时机将 `Assets\runtimes` 文件夹中的所有文件引入包中。另外，目标框架我们选了两个，与最终包含的本机依赖的框架种类对应，即分别允许高于 .NET Core App 3.1（含 .NET 5/6）和 .NET Framework 4.5.2 框架的程序集引用此项目。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFrameworks>netcoreapp3.1;net452</TargetFrameworks>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
  </PropertyGroup>

  <Target Name="IncludeAllDependencies" BeforeTargets="_GetPackageFiles">
    <ItemGroup>
      <None Include="Assets\runtimes\**\*.dll" Pack="True" PackagePath="runtimes" />
    </ItemGroup>
  </Target>

</Project>
```

特别的，如果你的这个项目仅供打 NuGet 包，最终生成的 dll 不被引用，那么额外标一个“IsTool”，这样生成的 dll 不被引用。当然，如果你这个 dll 要被引用就不应该加这句代码。

```diff

    <PropertyGroup>
      <TargetFrameworks>netcoreapp3.1;net452</TargetFrameworks>
      <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
++    <!-- 仅当你的 dll 不需要被引用时 -->
++    <IsTool>true</IsTool>
    </PropertyGroup>
```

如果你不需要直接那个 C++/CLI 程序集，而只是需要它出现在输出目录，那么到目前为止就够了。但如果那个 C++/CLI 程序集需要被引用，你还需要额外加一点点。我们取 x86 下的这两个 dll，将其让入 NuGet 的 ref 文件夹中。

```diff
    <Target Name="IncludeAllDependencies" BeforeTargets="_GetPackageFiles">
      <ItemGroup>
        <None Include="Assets\runtimes\**\*.dll" Pack="True" PackagePath="runtimes" />
++      <!-- 仅当你的 C++/CLI 也需要被引用时 -->
++      <None Include="Assets\runtimes\win-x86\lib\net452\Walterlv.Demo.Interop.dll" Pack="True" PackagePath="ref\net452" />
++      <None Include="Assets\runtimes\win-x86\lib\netcoreapp3.1\Walterlv.Demo.Interop.dll" Pack="True" PackagePath="ref\netcoreapp3.1" />
      </ItemGroup>
    </Target>
```

当然，如果你有专门生成引用程序集的方法，也可以在这里放专门的引用程序集，而不用像这样拿一个 x86 的程序集来无意义地增加 NuGet 包的大小。

**请特别注意：**托管程序集和 C++/CLI 程序集不可在同一个 NuGet 包中被引用！这意味着，如果你己像引用 C++/CLI 又想引用此项目的 dll 时，请改用后面的“双包”方案。

##### 完成

编译这个项目，你将在输出目录下得到一个 NuGet 包，它已经具有正确的文件结构了。

![输出的单包 NuGet 包](/static/posts/2021-12-13-20-02-30.png)

#### 托管、C++/CLI 和本机依赖包（双包）

双包方案旨在解决托管程序集和 C++/CLI 程序集无法在同一个 NuGet 包中被引用的问题。（实际上是可以正常引用并编译通过的，但在 .NET Core 框架下无法运行。）

##### 第四步：再建一个普通的类库

再建一个普通的类库，引用之前创建的项目。现在两个项目的职责分别为：

* 原来的类库：负责提供本机动态链接库和 C++/CLI 程序集
* 新的类库：负责提供托管程序集，并标记引用原来的包

![再建一个普通的类库](/static/posts/2021-12-13-20-08-14.png)

编辑新项目的 csproj 文件。目标框架需与原来一模一样；也要 `GeneratePackageOnBuild` 来标记生成 NuGet 包；使用 `ProjectReference` 引用原来的项目，这样可以在生成的 NuGet 包中自动标记原来的 NuGet 包是其中一个重要的依赖。最后，如果我们这个托管程序集需要引用那个 C++/CLI 程序集，那么就额外在下面写上一个 `Reference` 把原来的 dll 引用一下。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFrameworks>netcoreapp3.1;net452</TargetFrameworks>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\Walterlv.PackageDemo.Runtime\Walterlv.PackageDemo.Runtime.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Reference Include="Walterlv.Demo.Interop.dll" HintPath="..\Walterlv.PackageDemo.Runtime\Assets\runtimes\win-x86\lib\$(TargetFramework)\Walterlv.Demo.Interop.dll" />
  </ItemGroup>

</Project>
```

##### 完成

再编译整个项目，你就可以得到两个 NuGet 包了：

* Walterlv.PackageDemo.Runtime：包含本机依赖和 C++/CLI 程序集
* Walterlv.PackageDemo：包含托管程序集，同时依赖前者

![输出的另一个 NuGet 包](/static/posts/2021-12-13-20-13-45.png)

## 使用效果

当你将两个 NuGet 包都推送到 NuGet 服务器上去之后，你就可以在你的业务中使用这两个 NuGet 包了：

* 如果你只做了一个单包，那么直接引用这个单包即可
* 如果你做的是双包，那么引用其中托管的那一个即可，本机依赖包会自动根据 NuGet 的依赖安装

### .NET Framework 项目

对于 .NET Framework 项目，项目编译后，NuGet 会自动将本机依赖包里对应架构和框架的文件拷贝到输出目录中，于是你就能正常运行你的程序了。

### .NET Core App 项目

对于 .NET Core App 项目，项目编译后，输出目录下会出现“runtimes”和“ref”两个文件夹，分别对应 NuGet 包里的同名文件夹，不过只包含业务项目需要的框架，而不含其他框架。

如果你最终直接把此 .NET Core App 项目发布出去，则这两个文件夹配合“.deps”文件需要一并带上。如果你使用 .NET 的发布功能将其发布成框架独立的应用程序，那么编译器会自动将 runtimes 里面的对应架构和框架的文件拷贝至输出目录下，于是你就能正常运行你的程序了。
