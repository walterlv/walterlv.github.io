---
title: "使用 C# 中的 dynamic 关键字调用类型方法时可能遇到的各种问题"
date: 2019-08-04 14:58:15 +0800
categories: csharp dotnet
position: problem
---

你可以使用 `dynamic` 来定义一个变量或者字段，随后你可以像弱类型语言一样调用这个实例的各种方法，就像你一开始就知道这个类型的所有属性和方法一样。

但是，使用不当又会遇到各种问题，本文收集使用过程中可能会遇到的各种问题，帮助你解决掉它们。

---

<div id="toc"></div>

## 快速入门

`dynamic` 可以这么用：

```csharp
dynamic foo = GetSomeInstance();
foo.Run("欢迎访问吕毅（lvyi）的博客：blog.walterlv.com");

object GetSomeInstance()
{
    return 诡异的东西;
}
```

我们的 `GetSomeInstance` 明明返回的是 `object`，我们却可以调用真实类中的方法。

接下来讲述使用 `dynamic` 过程中可能会遇到的问题和解决方法。

## 编译错误：缺少编译器要求的成员

你初次在你的项目中引入 `dynamic` 关键字后，会出现编译错误，提示 “缺少编译器要求的成员”。

> error CS0656: 缺少编译器要求的成员“Microsoft.CSharp.RuntimeBinder.CSharpArgumentInfo.Create”

### 对于 .NET Core 或者 .NET Standard 项目

需要为你的项目安装以下两个 NuGet 包：

- [Microsoft.CSharp](https://www.nuget.org/packages/Microsoft.CSharp/)
- [System.Dynamic.Runtime](https://www.nuget.org/packages/System.Dynamic.Runtime/)

![引用两个 NuGet 包](/static/posts/2019-08-04-14-10-52.png)

于是你的项目里面会多出两个引用：

```diff
    <Project Sdk="Microsoft.NET.Sdk">

      <PropertyGroup>
        <TargetFrameworks>netstandard2.0;net48</TargetFrameworks>
      </PropertyGroup>

      <ItemGroup>
++      <PackageReference Include="Microsoft.CSharp" Version="4.5.0" />
++      <PackageReference Include="System.Dynamic.Runtime" Version="4.3.0" />
      </ItemGroup>

    </Project>
```

### 对于 .NET Framework 项目

你需要引用 `Microsoft.CSharp`：

![添加引用](/static/posts/2019-08-04-14-02-16.png)

![引用 Microsoft.CSharp](/static/posts/2019-08-04-14-04-08.png)

于是你的项目里面会多出一项引用：

```diff
    <Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">

      <PropertyGroup>
        <TargetFramework>net48</TargetFramework>
      </PropertyGroup>

      <ItemGroup>
++      <Reference Include="Microsoft.CSharp" />
      </ItemGroup>

    </Project>
```

## 异常：“{0}”未包含“{1}”的定义

`{0}` 是类型名称，而 `{1}` 是使用 `dynamic` 访问的属性或者方法的名称。

比如，我试图从某个 `Attribute` 中访问到 `Key` 属性的时候会抛出以下异常：

> Microsoft.CSharp.RuntimeBinder.RuntimeBinderException:““System.Attribute”未包含“Key”的定义”

出现此异常的原因是：

- `dynamic` 所引用的对象里面，没有签名相同的 `public` 的属性或者方法

于是，如果你确认你的类型里面是有这个属性或者方法的话，那么就需要注意需要将此成员改成 `public` 才可以访问。

<!-- ## 异常：绑定动态操作时出现异常

中文版异常：

> Microsoft.CSharp.RuntimeBinder.RuntimeBinderInternalCompilerException:“绑定动态操作时出现异常”

英文版异常：

> Microsoft.CSharp.RuntimeBinder.RuntimeBinderInternalCompilerException:"An unexpected exception occurred while binding a dynamic operation"

![绑定动态操作时出现异常](/static/posts/2019-08-04-13-57-00.png) -->

---

**参考资料**

- [c# - Why a Microsoft.CSharp.RuntimeBinder.RuntimeBinderException if the invoked method is there? - Stack Overflow](https://stackoverflow.com/q/5678608/6233938)
