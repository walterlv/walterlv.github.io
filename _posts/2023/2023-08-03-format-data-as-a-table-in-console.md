---
title: ".NET/C# 程序如何在控制台/终端中以字符表格的形式输出数据"
date: 2023-08-03 11:49:03 +0800
categories: dotnet csharp
position: problem
coverImage: /static/posts/2023-08-03-10-54-17.png
---

在一篇在控制台窗口中监听前台窗口的博客中，我在控制台里以表格的形式输出了每一个前台窗口的信息。在控制台里编写一个字符表格其实并不难，毕竟 ASCII 中就已经提供了制表符。不过要在合适的位置输出合适的制表符，要写一些打杂式的代码了；另外，如果还要考虑表格列的宽度自适应，再考虑中英文在控制台中的对齐，还要考虑文字超出单元格时是裁剪/省略/换行。当把所有这些麻烦加到一起之后，写一个这样的辅助类来顶替那些麻烦事儿还是很有必要的。

---

<div id="toc"></div>

## 效果预览

以下是我在前台[窗口监视程序](/post/monitor-foreground-window-on-windows)中的运行效果：

![监听前台窗口变化的运行效果](/static/posts/2023-08-03-10-54-17.png)

## 代码组织

我写了三个类来完成这样的事情：

- `ConsoleTableBuilder<T>` 用于构建表格
- `ConsoleTableColumnDefinition<T>` 用于定义表格的列
- `ConsoleStringExtensions` 由于在控制台中做中英文对齐不能使用 `string` 原有的与长度相关的方法，所以我们需要一个静态类来扩展 `string` 对控制台的特殊处理

详细的代码，可以在我的 GitHub 仓库中找到：

- <https://github.com/walterlv/Walterlv.Packages/tree/master/src/Utils/Walterlv.Console>

其中，`ConsoleStringExtensions` 类的设计，我参考了 [D 的个人博客](https://88250.b3log.org/articles/2007/02/10/1171085880000.html)，不过原文的一部分关键实现其实是不正确的，有一些本不必要的循环浪费性能，还有不能直观看出含义的缩写命名，所以这个类的实际代码是我完全重写之后，请 GPT-4 帮我润色，以及请 GitHub Copilot 帮我写完注释之后的版本。

## 开源

这个类库我已经开源到我的 GitHub 仓库中，并可直接以 NuGet 形式引用。

项目地址：

- <https://github.com/walterlv/Walterlv.Packages/tree/master/src/Utils/Walterlv.Console>

NuGet 包：

- <https://www.nuget.org/packages/Walterlv.Console>

## 用法

如下，我们获取控制台的字符宽度，然后 `-1` 后作为表格的宽度，随后定义每一列，这就完成了表格的初始化：

```csharp
var consoleWidth = Console.WindowWidth;
var table = new ConsoleTableBuilder<Win32Window>(consoleWidth - 1, new ConsoleTableColumnDefinition<Win32Window>[]
{
    (8, "time", _ => $"{DateTime.Now:hh:mm:ss}"),
    (8, "hwnd", w => $"{w.Handle:X8}"),
    (0.5, "title", w => w.Title),
    (0.25, "class name", w => w.ClassName),
    (6, "pid", w => $"{w.ProcessId}"),
    (0.25, "process name", w => $"{w.ProcessName}"),
});
Console.WriteLine(table.BuildHeaderRows());
```

- 需要 `-1` 是因为大多数情况下，输出的行都刚好能在控制台中排得下，但有小部分控制台会在输出完后额外换一行，于是会看到每输出一行都有一个空白行出现（虽然我现在仍不知道原因）
- 定义列时，每个参数都是一个 `ConsoleTableColumnDefinition<Win32Window>` 的实例，为了方便，我允许隐式从元组转换
    - 整数列宽的元组，定义的是这一列可用的字符数
    - 小数列的元组，是将整数列宽和表格划线用的字符除外后，剩余总列宽的百分比
    - 元组的第二项是表头中的列名
    - 元组的第三项是这一列的值的获取和格式化方法

接下来，在每一次有新数据需要输出时，都可以通过 `BuildRow` 方法，传入数据实例和字符串换行方法，得到一行的字符串。

```csharp
// 当前前台窗口变化时，输出新的前台窗口信息。
void WinEventProc(HWINEVENTHOOK hWinEventHook, uint @event, HWND hwnd, int idObject, int idChild, uint idEventThread, uint dwmsEventTime)
{
    var current = GetForegroundWindow();

    var w = new Win32Window(current);
    var rowText = table.BuildRow(w, StringDisplayMode.Wrap);

    Console.WriteLine(rowText);
}
```

- `StringDisplayMode` 是一个枚举，指定当字符串超过指定长度时，应如何处理此字符串：
    - `Truncate` 截断字符串
    - `TruncateWithEllipsis` 截断字符串，并在末尾添加省略号
    - `Wrap` 将字符串换行

注意，当选择 `Wrap` 换行时，通过 `BuildRow` 方法得到的字符串其实是多行的（可以看本文开头的效果图了解）。

关于表格输出类的完整使用示例，可参考我监听前台窗口的博客，或直接查看我的 GitHub 仓库中的示例代码。

- [如何在控制台程序中监听 Windows 前台窗口的变化 - walterlv](/post/monitor-foreground-window-on-windows)
- [Walterlv.Packages/src/Utils/Walterlv.Console](https://github.com/walterlv/Walterlv.Packages/tree/master/src/Utils/Walterlv.Console)

---

**参考资料**

- [D 的个人博客](https://88250.b3log.org/articles/2007/02/10/1171085880000.html)

