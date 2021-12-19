---
title: "在编译期间使用 Roslyn/MSBuild 自带的方法/函数判断、计算和修改属性"
date: 2019-05-15 21:41:27 +0800
tags: msbuild visualstudio roslyn
position: knowledge
permalink: /posts/msbuild-property-functions.html
---

充分利用 MSBuild 自带的方法，可以在编译期间完成大多数常见的属性转换，而不再需要自己专门写库来完成。

本文介绍如何使用 MSBuild 自带的方法，并列举 MSBuild 中各种自带的方法。

---

<div id="toc"></div>

## 如何在编译期间使用 MSBuild 自带的方法

当然，在修改编译期间的代码的时候，你可能需要提前了解项目文件相关的知识：

- [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj)

以下是使用 MSBuild 自带方法的最简单的一个例子，执行 `5-1` 的数学运算。

```xml
<Walterlv>$([MSBuild]::Subtract(5, 1))</Walterlv>
```

更复杂的，可能是 MSBuild 方法调用的嵌套了：

```xml
<WalterlvPath Condition="HasTrailingSlash('$(WalterlvPath)')">$(WalterlvPath.Substring(0, $([MSBuild]::Add($(WalterlvPath.Length), -1))))</WalterlvPath>
```

以上两段示例分别来自我的另外两篇博客，如果不明白，可以参考这两篇博客的内容：

- [在 Roslyn/MSBuild 中进行基本的数学运算](/post/msbuild-numeric-methods)
- [Roslyn/MSBuild 在编译期间处理路径中的斜杠与反斜杠](/post/msbuild-path-trailing-slash)

## MSBuild 自带的方法

### 数学运算

MSBuild 中数学运算的部分可以参考我的另一篇博客：

- [在 Roslyn/MSBuild 中进行基本的数学运算](/post/msbuild-numeric-methods)

### EnsureTrailingSlash

确保路径结尾有斜杠。

可参考我的另一篇博客：

- [Roslyn/MSBuild 在编译期间处理路径中的斜杠与反斜杠](/post/msbuild-path-trailing-slash)

### GetDirectoryNameOfFileAbove & GetPathOfFileAbove

这两个是非常有用却又非常容易被忽视的 API，非常有必要介绍一下。

可以阅读我的另一篇博客了解其用途和用法：

- [Roslyn/MSBuild 在编译期间从当前文件开始查找父级文件夹，直到找到包含特定文件的文件夹](/post/msbuild-get-directory-name-of-file-above)


### MakeRelative

计算两个路径之间的相对路径表示。

```xml
<PropertyGroup>
    <Path1>C:\Walterlv\</Path1>
    <Path2>C:\Walterlv\Demo\</Path2>
    <WalterlvPath1>$([MSBuild]::MakeRelative($(Path1), $(Path2)))</WalterlvPath1>
    <WalterlvPath2>$([MSBuild]::MakeRelative($(Path2), $(Path1)))</WalterlvPath2>
</PropertyGroup>
```

`WalterlvPath1` 的值会计算为 `Demo\`，而 `WalterlvPath2` 的值会计算为 `..\`。

### ValueOrDefault

如果赋值了，就使用所赋的值；否则使用参数指定的值：

```xml
<PropertyGroup>
    <WalterlvValue1>$([MSBuild]::ValueOrDefault('$(FooBar)', 'walterlv'))</WalterlvValue1>
    <WalterlvValue2>$([MSBuild]::ValueOrDefault('$(WalterlvValue1)', 'lindexi'))</WalterlvValue2>
</PropertyGroup>
```

第一行，因为我们没有定义任何一个名为 `FooBar` 的属性，所以 `WalterlvValue1` 属性会计算得到 `walterlv` 值。第二行，因为 `WalterlvValue1` 已经得到了一个值，所以 `WalterlvValue2` 也会得到 `WalterlvValue1` 的值，也就是 `walterlv`，不会得到 `lindexi`。

### 其他

MSBuild 剩下的一些方法使用场景非常有限（不懂就别瞎装懂了），这里做一些简单的介绍。

- `$([MSBuild]::DoesTaskHostExist(string theRuntime, string theArchitecture))`
    - 可参见：[msbuild/Microsoft.Common.overridetasks at master · microsoft/msbuild](https://github.com/Microsoft/msbuild/blob/master/src/Tasks/Microsoft.Common.overridetasks)
- `GetRegistryValue`
- `GetRegistryValueFromView`

---

**参考资料**

- [Property Functions - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/property-functions)

