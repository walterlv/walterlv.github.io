---
title: "用命令行执行 .NET 单元测试时，如何仅执行符合某些条件的单元测试"
date: 2020-03-11 17:59:23 +0800
tags: dotnet
position: knowledge
coverImage: /static/posts/2020-03-11-16-43-44.png
---

本文介绍使用 `dotnet test` 命令进行单元测试的时候，过滤出被测项目中的一部分测试出来，仅测试这一部分。

---

<div id="toc"></div>

## 背景

建一个 .NET Core 的单元测试项目，例如项目名字是 Walterlv.Demo.Tests。举例其中的一个测试类如下：

```csharp
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Walterlv.Demo.Tests
{
    [TestClass]
    public class FooTest
    {
        [TestCategory("CategoryA")]
        [Priority(1)]
        [TestMethod]
        public void TestMethod1()
        {
        }

        [Priority(2)]
        [TestMethod]
        public void TestMethod2()
        {
        }
    }
}
```

使用 Visual Studio 的话，直接在测试资源管理器中点击运行全部测试，或者选择想要测试的项点运行所选测试即可。

![Visual Studio 测试资源管理器](/static/posts/2020-03-11-16-43-44.png)

而使用 GUI 工具的话不利于 CI 集成和自动化测试，所以必然需要用到命令：

```powershell
> dotnet test .\Walterlv.Demo.Tests.dll
```

有时为了调试方便或输出分类数据等，要求执行一部分单元测试，这就需要过滤了。`dotnet test` 的过滤使用 `--filter` 选项。

## 过滤

### 方法名

查找方法名包含某字符串的单元测试并执行：

```csharp
dotnet test --filter TestMethod1
```

或者：

```csharp
dotnet test --filter Name~TestMethod1
```

如果是排除某方法，则是：

```csharp
dotnet test --filter FullyQualifiedName!=Walterlv.Demo.Tests.FooTest.TestMethod1
```

### 类名

查找类名等于某字符串的单元测试并执行：

```csharp
dotnet test --filter ClassName=Walterlv.Demo.Tests.FooTest
```

类名必须包含命名空间，否则找不到。

### 分类与优先级

查找标记了 `[TestCategory("CategoryA")]` 的方法并执行单元测试：

```csharp
dotnet test --filter TestCategory=CategoryA
```

查找标记了 `[Priority(2)]` 的方法并执行单元测试：

```csharp
dotnet test --filter Priority=2
```

### 条件与或

条件或（`|`）：

```csharp
dotnet test --filter Name~TestMethod1|TestCategory=CategoryA
```

条件与（'&'）：

```csharp
dotnet test --filter Name~TestMethod1&TestCategory=CategoryA
```

---

**参考资料**

- [Running selective unit tests - .NET Core - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/core/testing/selective-unit-tests)

