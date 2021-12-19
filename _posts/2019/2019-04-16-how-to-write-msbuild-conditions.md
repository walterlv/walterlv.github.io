---
title: "MSBuild 如何编写带条件的属性、集合和任务 Condition？"
date: 2019-04-16 17:27:46 +0800
tags: msbuild
position: starter
permalink: /posts/how-to-write-msbuild-conditions.html
---

在项目文件 csproj 中，通过编写带条件的属性（PropertyGroup）、集合（ItemGroup）和任务（Target）可以完成更加复杂的项目文件的功能。

本文介绍如何编写带条件的 MSBuild 项。

---

<div id="toc"></div>

## Condition

如果要给你的 MSBuild 项附加条件，那么加上 `Condition` 特性即可。

`Condition` 可以写在任何地方，例如 `PropertyGroup`、`ItemGroup`、`Target` 或者内部的一个属性或一个项或者一个任务等。

下面这段代码表示在 `Debug` 配置下计算一个属性的值，而这个逗比属性 `DoubiNames` 的属性仅在此属性从未被指定过值的时候赋一个值 `吕毅`。

```xml
<Project>
    <PropertyGroup Condition=" '$(Configuration)' == 'Debug' ">
        <DoubiNames Condition=" '$(DoubiNames)' == '' ">吕毅</DoubiNames>
    </PropertyGroup>
</Project>
```

在单引号的前后，等号这些运算符的前后空格可加可不加，没有影响。

## 单引号

在上面的例子中，我们给条件中的所有字符串加上了包裹的单引号。

单引号对于简单的字母数字字符串是不必要的，对于布尔值来说也是不必要的。但是，对于空值来说，是必须加上的，即 `''`。

## `==` 和 `!=`

`==` 符号左右两侧的字符串如果相等，则返回 `true`，否则返回 `false`。

`!=` 符号左右两侧的字符串如果相等，则返回 `false`，否则返回 `true`。

```xml
Condition=" $(Configuration) == 'Debug' "
```

## `<`, `>`, `<=`, `>=`

用于比较数值上的大小关系。当然，在项目文件中，用于表示数值的字符串在此操作符下表示的就是数值。

1. 左右两侧比较的字符串必须是表示数值的字符串，例如 `123` 或者 `0x7b`；
1. 只能是十进制或者十六进制字符串，而十六进制字符串必须以 `0x` 开头；
1. 由于此比较是写在 XML 文件中的，所以必须转义，即 `<` 需要写成 `&lt;`，`>` 需要写成 `&gt;`。

## `Exists`, `HasTrailingSlash`

`Exists` 判断文件或者文件夹是否存在。存在则返回 `true`，否则返回 `false`。

```xml
Condition=" Exists('Foo\walterlv.config') "
```

```xml
Condition=" Exists('Foo\WalterlvFolder') "
```

```xml
Condition=" Exists('$(WalterlvFile)') "
```

`HasTrailingSlash` 如果字符串的尾部包含 `/` 或者 `\` 字符串，则返回 `true`，否则返回 `false`。

```xml
Condition="!HasTrailingSlash($(OutputPath))"
```

## 与或非：`And`, `Or`, `!`

就是计算机中常见的与或非的机制。

```xml
<DoubiNames Condition=" '$(DoubiNames)' == '吕毅' Or '$(DoubiNames)' == '林德熙' ">组队逗比</DoubiNames>
```

## 组合：`()`

就是计算机中通常用于修改运算优先级的括号，这可以先计算括号内的布尔结果。

## if 条件：`$if$`

```xml
Condition=" $if$ ( %expression% ), $else$, $endif$ "
```

---

**参考资料**

- [MSBuild Conditions - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-conditions)
- [Visual Studio Project/Item Template Parameter Logic - Stack Overflow](https://stackoverflow.com/q/6709057/6233938)

