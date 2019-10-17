---
title: "如何在 .NET 项目中开启不安全代码（以便启用 unsafe fixed 等关键字）"
date: 2019-10-17 15:55:41 +0800
categories: dotnet csharp
position: starter
---

有小伙伴希望在 .NET 代码中使用指针，操作非托管资源，于是可能使用到 `unsafe` `fixed` 关键字。但使用此关键字的前提是需要在项目中开启不安全代码。

本文介绍如何在项目中开启不安全代码。

---

<div id="toc"></div>

## 入门方法

第一步：在你需要启用不安全代码的项目上点击右键，然后选择属性：

![项目 - 属性](/static/posts/2019-10-17-15-34-33.png)

第二步：在“生成”标签下，勾选上“允许不安全代码”：

![允许不安全代码](/static/posts/2019-10-17-15-36-34.png)

第三步：切换到 Release 配置，再勾上一次“允许不安全代码”（确保 Debug 和 Release 都打开）

![在 Release 允许不安全代码](/static/posts/2019-10-17-15-38-36.png)

方法结束。

## 高级方法

**推荐**

如果你使用 .NET Core / .NET Standard 项目，那么你可以修改项目文件来实现，这样项目文件会更加清真。

第一步：在你需要启用不安全代码的项目上点击右键，然后选择编辑项目文件：

![编辑项目文件](/static/posts/2019-10-17-15-42-42.png)

第二步：在你的项目文件的属性组中添加一行 `<AllowUnsafeBlocks>true</AllowUnsafeBlocks>`：

*我已经把需要新增的行高亮出来了*

```diff
    <Project Sdk="Microsoft.NET.Sdk">

      <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>netcoreapp3.0</TargetFramework>
++      <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
      </PropertyGroup>

    </Project>
```

## 临时方法

**不推荐**

如果你只是临时希望加上不安全代码开关，则可以在编译的时候加入 `-unsafe` 命令行参数：

```powershell
csc -unsafe walterlv.cs
```

注意，不能给 `msbuild` 或者 `dotnet build` 加上 `-unsafe` 参数来编译项目，只能使用 `csc` 加上 `-unsafe` 来编译文件。因此使用场景非常受限，不推荐使用。

## 其他说明

第一种方法（入门方法）和第二种方法（高级方法）最终的修改是有一些区别的。入门方法会使得项目文件中有针对于 Debug 和 Release 的不同配置，代码会显得冗余；而高级方法中只增加了一行，对任何配置均生效。

因此如果可能，尽量使用高级方法呗。

```diff
    <Project Sdk="Microsoft.NET.Sdk">

      <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>netcoreapp3.0</TargetFramework>
++      <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
      </PropertyGroup>

--    <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|AnyCPU'">
--      <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
--    </PropertyGroup>

--    <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Release|AnyCPU'">
--      <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
--    </PropertyGroup>

    </Project>
```

即使是 .NET Framework 也是可以使用 SDK 风格的项目文件的，详情请阅读：

- [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成 Sdk 风格的 csproj - walterlv](https://blog.walterlv.com/post/introduce-new-style-csproj-into-net-framework.html)
