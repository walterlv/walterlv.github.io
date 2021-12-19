---
title: "C#/.NET 调试的时候显示自定义的调试信息（DebuggerDisplay 和 DebuggerTypeProxy）"
date: 2019-03-05 22:53:06 +0800
tags: dotnet csharp visualstudio
position: starter
---

使用 Visual Studio 调试 .NET 程序的时候，在局部变量窗格或者用鼠标划到变量上就能查看变量的各个字段和属性的值。默认显示的是对象 `ToString()` 方法调用之后返回的字符串，不过如果 `ToString()` 已经被占作它用，或者我们只是希望在调试的时候得到我们最希望关心的信息，则需要使用 .NET 中调试器相关的特性。

本文介绍使用 `DebuggerDisplayAttribute` 和 `DebuggerTypeProxyAttribute` 来自定义调试信息的显示。（同时隐藏我们在背后做的这些见不得人的事儿。）

---

<div id="toc"></div>

## 示例代码

比如我们有一个名为 `CommandLine` 的类型，表示从命令行传入的参数；内有一个字典，包含命令行参数的所有信息。

```csharp
public class CommandLine
{
    private readonly Dictionary<string, IReadOnlyList<string>> _optionArgs;
    private CommandLine(Dictionary<string, IReadOnlyList<string>> optionArgs)
        => _optionArgs = optionArgs ?? throw new ArgumentNullException(nameof(optionArgs));
}
```

现在，我们在 Visual Studio 里面调试得到一个 `CommandLine` 的实例，然后使用调试器查看这个实例的属性、字段和集合。

然后，这样的一个字典嵌套列表的类型，竟然需要点开 4 层才能知道命令行参数究竟是什么。这样的调试效率显然是太低了！

![原生的调试显示](/static/posts/2019-03-05-22-30-28.png)

## DebuggerDisplay

使用 `DebuggerDisplayAttribute` 可以帮助我们直接在局部变量窗格或者鼠标划过的时候就看到对象中我们最希望了解的信息。

现在，我们在 `CommandLine` 上加上 `DebuggerDisplayAttribute`：

```csharp
// 此段代码非最终版本。
[DebuggerDisplay("CommandLine: {DebuggerDisplay}")]
public class CommandLine
{
    private readonly Dictionary<string, IReadOnlyList<string>> _optionArgs;
    private CommandLine(Dictionary<string, IReadOnlyList<string>> optionArgs)
        => _optionArgs = optionArgs ?? throw new ArgumentNullException(nameof(optionArgs));

    private string DebuggerDisplay => string.Join(' ', _optionArgs
        .Select(pair => $"{pair.Key}{(pair.Key == null ? "" : " ")}{string.Join(' ', pair.Value)}"));
}
```

效果有了：

![使用 DebuggerDisplay](/static/posts/2019-03-05-22-36-42.png)

不过，展开对象查看的时候可以看到一个 `DebuggerDisplay` 的属性，而这个属性我们只是调试使用，这是个垃圾属性，并不应该影响我们的查看。

![里面有一个 DebuggerDisplay 垃圾属性](/static/posts/2019-03-05-22-39-20.png)

我们使用 `DebuggerBrowsable` 特性可以关闭某个属性或者字段在调试器中的显示。于是代码可以改进为：

```diff
--  [DebuggerDisplay("CommandLine: {DebuggerDisplay}")]
++  [DebuggerDisplay("CommandLine: {DebuggerDisplay,nq}")]
    public class CommandLine
    {
        private readonly Dictionary<string, IReadOnlyList<string>> _optionArgs;
        private CommandLine(Dictionary<string, IReadOnlyList<string>> optionArgs)
            => _optionArgs = optionArgs ?? throw new ArgumentNullException(nameof(optionArgs));
    
++      [DebuggerBrowsable(DebuggerBrowsableState.Never)]
        private string DebuggerDisplay => string.Join(' ', _optionArgs
            .Select(pair => $"{pair.Key}{(pair.Key == null ? "" : " ")}{string.Join(' ', pair.Value)}"));
    }
```

添加了从不显示此字段（`DebuggerBrowsableState.Never`），在调试的时候，展开后的属性列表里面没有垃圾 `DebuggerDisplay` 属性了。

另外，我们在 `DebuggerDisplay` 特性的中括号中加了 `nq` 标记（No Quote）来去掉最终显示的引号。

## DebuggerTypeProxy

虽然我们使用了 `DebuggerDisplay` 使得命令行参数一眼能看出来，但是看不出来我们把命令行解析成什么样了。于是我们需要更精细的视图。

然而，上面展开 `_optionArgs` 字段的时候，依然需要展开 4 层才能看到我们的所有信息，所以我们使用 `DebuggerTypeProxyAttribute` 来优化调试器实例内部的视图。

```csharp
class CommandLineDebugView
{
    [DebuggerBrowsable(DebuggerBrowsableState.Never)]
    private readonly CommandLine _owner;

    public CommandLineDebugView(CommandLine owner)
    {
        _owner = owner;
    }

    [DebuggerBrowsable(DebuggerBrowsableState.RootHidden)]
    private string[] Options => _owner._optionArgs
        .Select(pair => $"{pair.Key}{(pair.Key == null ? "" : " ")}{string.Join(' ', pair.Value)}")
        .ToArray();
}
```

我面写了一个新的类型 `CommandLineDebugView`，并在构造函数中允许传入要优化显示的类型的实例。在这里，我们写一个新的 `Options` 属性把原来字典里面需要四层才能展开的值合并成一个字符串集合。

但是，我们在 `Options` 上标记 `DebuggerBrowsableState.RootHidden`：

1. 如果这是一个集合，那么这个集合将直接显示到调试视图的上一级视图中；
1. 如果这是一个普通对象，那么这个对象的各个属性字段将合并到上一级视图中显示。

别忘了我们还需要禁止 `_owner` 在调试器中显示，然后把 `[DebuggerTypeProxy(typeof(CommandLineDebugView))]` 加到 `CommandLine` 类型上。

这样，最终的显示效果是这样的：

![使用 DebuggerTypeProxy](/static/posts/2019-03-05-22-51-26.png)

点击 `Raw View` 可以看到我们没有使用 `DebuggerTypeProxyAttribute` 视图时的属性和字段。

## 最终代码

```csharp
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Walterlv.Framework.StateMachine;

namespace Walterlv.Framework
{
    [DebuggerDisplay("CommandLine: {DebuggerDisplay,nq}")]
    [DebuggerTypeProxy(typeof(CommandLineDebugView))]
    public class CommandLine
    {
        private readonly Dictionary<string, IReadOnlyList<string>> _optionArgs;
        private CommandLine(Dictionary<string, IReadOnlyList<string>> optionArgs)
            => _optionArgs = optionArgs ?? throw new ArgumentNullException(nameof(optionArgs));

        [DebuggerBrowsable(DebuggerBrowsableState.Never)]
        private string DebuggerDisplay => string.Join(' ', _optionArgs
            .Select(pair => $"{pair.Key}{(pair.Key == null ? "" : " ")}{string.Join(' ', pair.Value)}"));

        private class CommandLineDebugView
        {
            [DebuggerBrowsable(DebuggerBrowsableState.Never)]
            private readonly CommandLine _owner;

            public CommandLineDebugView(CommandLine owner) => _owner = owner;

            [DebuggerBrowsable(DebuggerBrowsableState.RootHidden)]
            private string[] Options => _owner._optionArgs
                .Select(pair => $"{pair.Key}{(pair.Key == null ? "" : " ")}{string.Join(' ', pair.Value)}")
                .ToArray();
        }
    }
}
```

---

**参考资料**

- [DebuggerTypeProxyAttribute Class (System.Diagnostics) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.diagnostics.debuggertypeproxyattribute)
- [DebuggerDisplayAttribute Class (System.Diagnostics) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.diagnostics.debuggerdisplayattribute)
- [Using DebuggerTypeProxy Attribute - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/debugger/using-debuggertypeproxy-attribute)
- [Using the DebuggerDisplay Attribute - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/debugger/using-the-debuggerdisplay-attribute)
