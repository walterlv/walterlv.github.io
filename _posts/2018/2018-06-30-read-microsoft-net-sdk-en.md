---
title: "Reading the Source Code of Microsoft.NET.Sdk, Writing the Creative Extension of Compiling"
publishDate: 2018-06-30 20:27:54 +0800
date: 2018-12-14 09:54:00 +0800
categories: dotnet visualstudio nuget msbuild
version:
  current: English
versions:
  - 中文: /post/read-microsoft-net-sdk.html
  - English: #
---

`Project` node starts to support the `Sdk` attribute since MSBuild release the 15.0 version which is embedded in Visual Studio 2017. For the `Sdk` attribute, the C# project file whose file extension is csproj becomes much more powerful and extensible.

We'll try to read the source code of `Microsoft.NET.Sdk` which is the default Sdk value of C#.NET project and try to write some creative extension of compiling.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

## Where to find the source code of Microsoft.NET.Sdk

Search `Microsoft.NET.Sdk` using [Everything](https://www.voidtools.com/) or [Wox](https://github.com/Wox-launcher/Wox), I find that multiple versions are installed in my computer. As I've installed the .NET Core 2.1, the location of my latest version is `C:\Program Files\dotnet\sdk\2.1.300\Sdks`. The official document [How to: Reference an MSBuild Project SDK](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-use-project-sdk?wt.mc_id=MVP) says that if you implement your own Sdk, you can also push it to <nuget.org>.

![Search Microsoft.NET.Sdk](/static/posts/2018-06-30-21-06-06.png)  
▲ Search Microsoft.NET.Sdk

![The Sdk folder](/static/posts/2018-06-30-21-08-25.png)  
▲ The Sdk folder on my computer

The NuGet part of `Microsoft.NET.Sdk` is on GitHub:

- [NuGet.Client/src/NuGet.Core at dev · NuGet/NuGet.Client](https://github.com/NuGet/NuGet.Client/tree/dev/src/NuGet.Core)

## The folder structure of Microsoft.NET.Sdk

When clicking into the `Microsoft.NET.Sdk` folder, we can find that the folder structure is very similar to the NuGet folder structure.

![The folder structure of Microsoft.NET.Sdk](/static/posts/2018-06-30-21-09-29.png)

I've written some posts talking about the NuGet folder structure but unfortunately they are all not in English:

- [How to Write a Cross-Platform NuGet Tool Package Base on MSBuild Task](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)
- [How to Write a Cross-Platform NuGet Tool Package Base on Command Line Application](/post/create-a-cross-platform-command-based-nuget-tool.html)

Microsoft have some official document talking about the NuGet folder structure [How to create a NuGet package from a convention-based working directory](https://docs.microsoft.com/en-us/nuget/create-packages/creating-a-package#from-a-convention-based-working-directory?wt.mc_id=MVP).

**But** there exists an extra `Sdk` folder for the `Sdk` kind of NuGet package.

![The extra Sdk folder](/static/posts/2018-06-30-21-10-19.png)

The `Sdk.props` file and the `Sdj.targets` file will be imported by default and Microsoft's official document also mentions it here: [How to: Reference an MSBuild Project SDK - Visual Studio](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-use-project-sdk?wt.mc_id=MVP). It says that the two code blocks are actually the same:

> ```xml
> <Project Sdk="Microsoft.NET.Sdk">
>     <PropertyGroup>
>         <TargetFramework>net46</TargetFramework>
>     </PropertyGroup>
> </Project>
> ```

> ```xml
> <Project>
>     <!-- Implicit top import -->
>     <Import Project="Sdk.props" Sdk="Microsoft.NET.Sdk" />
> 
>     <PropertyGroup>
>         <TargetFramework>net46</TargetFramework>
>     </PropertyGroup>
> 
>     <!-- Implicit bottom import -->
>     <Import Project="Sdk.targets" Sdk="Microsoft.NET.Sdk" />
> </Project>
> ```

Because of the default importation behavior, Sdk can do variaty of tasks when MSBuild or Roslyn build the .NET projects. The default Sdk `Microsoft.NET.Sdk` is very extensible so that we can easily use it to customize out compiling behavior and I've mentioned these in the two non-English posts above.

## The major targets of Microsoft.NET.Sdk

I try to search `Target` node in the whole `Sdk` folder and find out 174 `Target`s. Don't worry about the huge `Target` amount because most of them are private by indicating the name with a `_` prefix and some of them have the same name to override and wait to be overridden.

So the core compiling `Target` is not so many and I pick up some core `Target` here:

- `CollectPackageReferences`: Collect the `PackageReference` items to resolve the package dependencies of the project.
- `CoreCompile` The core compiling `Target`.

- `GenerateAssemblyInfo`: Generate the `AssemblyInfo.cs` file which is usually written by developers manually before .NET Core published.
- `Pack`: Pack current project into a NuGet package file whose extension is nupkg.
- `GenerateNuspec`: Generate the nuspec file which is the meta info of the NuGet package.

## Write creative extensions of compiling

I also find some creative `Target` that inspires me:

```xml
<Target Name="DontRestore" BeforeTargets="Restore">
  <Error Text="This project should not be restored" />
 </Target>
```

▲ If a `Restore` target exists, then report a compiling error.

```xml
<Target Name="ReferenceStaticLegacyPackage" BeforeTargets="CollectPackageReferences">
  <ItemGroup>
    <PackageReference Remove="LiteDB" />
    <PackageReference Include="LiteDB" Version="2.0.2" />
  </ItemGroup>
</Target>
```

▲ This is written by me to prevent a specific package named `LiteDB` to be upgrade. I post this method in [my another non-English post](/post/prevent-nuget-package-upgrade.html).

---

### References

- [How to: Reference an MSBuild Project SDK - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-use-project-sdk?wt.mc_id=MVP)
