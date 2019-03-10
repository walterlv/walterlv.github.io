---
title: "如何在命令行中监听用户输入文本的改变？"
publishDate: 2019-01-21 22:03:07 +0800
date: 2019-03-04 22:14:42 +0800
categories: dotnet csharp
position: problem
---

这真是一个诡异的需求。为什么我需要在命令行中得知用户输入文字的改变啊！实际上我希望实现的是：在命令行中输入一段文字，然后不断地将这段文字发往其他地方。

本文将介绍如何监听用户在命令行中输入文本的改变。

---

在命令行中输入有三种不同的方法：

- `Console.Read()`
    - 用户可以一直输入，在用户输入回车之前，此方法都会一直阻塞。而一旦用户输入了回车，你后面的 `Console.Read` 就不会一直阻塞了，直到把用户在这一行输入的文字全部读完。
- `Console.ReadKey()`
    - 用户输入之前此方法会一直阻塞，用户只要按下任何一个键这个方法都会返回并得到用户按下的按键信息。
- `Console.ReadLine()`
    - 用户可以一直输入，在用户输入回车之前，此方法都会一直阻塞。当用户输入了回车之后，此方法会返回用户在这一行输入的字符串。

从表面上来说，以上这三个方法都不能满足我们的需求，每一个方法都不能直接监听用户的输入文本改变。尤其是 `Console.Read()` 和 `Console.ReadLine()` 方法，在用户输入回车之前，我们都得不到任何信息。看起来我们似乎只能通过 `Console.ReadKey()` 来完成我们的需求了。

但是，一旦我们使用了 `Console.ReadKey()`，我们将不能获得另外两个方法中的输入体验。例如，我们按下退格键（BackSpace）可以删除光标的前一个字符，按下删除键（Delete）可以删除光标的后一个字符，按下左右键可以移动光标到合适的文本上。

然而，不幸的是，除了这三个方法，我们还真的没有原生的方法来实现命令行的输入监听了。所以看样子我们需要自己来使用 `Console.ReadKey()` 实现用户输入文字的监听了。

我在 [如何让 .NET Core 命令行程序接受密码的输入而不显示密码明文 - walterlv](/post/input-password-with-mask-in-cli.html) 一问中有说到如何在命令行中输入密码而不会显示明文。我们用到的就是此博客中所述的方法。

```csharp
var builder = new StringBuilder();
while (true)
{
    var i = Console.ReadKey(true);

    if (i.Key == ConsoleKey.Enter)
    {
        Console.WriteLine();
        // 用户在这里输入了回车，于是我们需要结束输入了。
    }

    if (i.Key == ConsoleKey.Backspace)
    {
        if (builder.Length > 0)
        {
            Console.Write("\b \b");
            builder.Remove(builder.Length - 1, 1);
        }
    }
    else
    {
        builder.Append(i.KeyChar);
        Console.Write(i.KeyChar);
    }
}
```

然而实际上在使用此方法的时候并不符合预期，因为退格的时候我们得到了半个字：

![我们得到了半个字](/static/posts/2019-01-21-21-56-04.png)

额外的，我们还不支持左右键移动光标，而且按住控制键的时候也会输入一个字符；这些都是我还没有处理的。

这就意味着我们使用 `"\b \b"` 来删除我们输入的字符的时候，有可能在一些字符的情况下我们需要删除两个字符宽度。

然而如何获取一个字的字符宽度呢？还是很复杂的。于是我很暴力地使用 [OnChar函数的中文处理问题，退格键时，怎么处理-CSDN论坛](https://bbs.csdn.net/topics/390088904) 论坛中使用的方法直接通过编码范围判断中文的方式来推测字符宽度。如果你有更正统的方法，非常欢迎指导我。

简单起见，我写了一个类来封装输入文本改变。阅读以下代码，或者访问 [Walterlv.CloudKeyboard/ConsoleLineReader.cs](https://github.com/walterlv/Walterlv.CloudKeyboard/blob/master/CloudKeybaord.Cli/ConsoleLineReader.cs) 阅读此类型的最新版本的代码。

```csharp
using System;
using System.Text;

namespace Walterlv.Demo
{
    public sealed class ConsoleLineReader
    {
        public event EventHandler<ConsoleTextChangedEventArgs> TextChanged;

        public string ReadLine()
        {
            var builder = new StringBuilder();
            while (true)
            {
                var i = Console.ReadKey(true);

                if (i.Key == ConsoleKey.Enter)
                {
                    var line = builder.ToString();
                    OnTextChanged(line, i.Key);
                    Console.WriteLine();
                    return line;
                }

                if (i.Key == ConsoleKey.Backspace)
                {
                    if (builder.Length > 0)
                    {
                        var lastChar = builder[builder.Length - 1];
                        Console.Write(lastChar > 0xA0 ? "\b\b  \b\b" : "\b \b");
                        builder.Remove(builder.Length - 1, 1);
                    }
                }
                else
                {
                    builder.Append(i.KeyChar);
                    Console.Write(i.KeyChar);
                }

                OnTextChanged(builder.ToString(), i.Key);
            }
        }

        private void OnTextChanged(string line, ConsoleKey key)
        {
            TextChanged?.Invoke(this, new ConsoleTextChangedEventArgs(line, key));
        }
    }

    public class ConsoleTextChangedEventArgs : EventArgs
    {
        public ConsoleTextChangedEventArgs(string line, ConsoleKey consoleKey)
        {
            Line = line;
            ConsoleKey = consoleKey;
        }

        public string Line { get; }
        public ConsoleKey ConsoleKey { get; }
    }
}
```

那么使用的时候，则会简单很多：

```csharp
var reader = new ConsoleLineReader();
reader.TextChanged += (sender, args) =>
{
    // 这里可以在用户每次输入的文本改变的时候执行。
};

while (true)
{
    // 我在这里循环执行，于是即便用户按了回车，也会继续输入。
    reader.ReadLine();
}
```

---

**参考资料**

- [StreamReader.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/IO/StreamReader.cs,ef2abdf7bd65b2ec)
- [windows - How to backspace the characters in the cmd buffer? - Super User](https://superuser.com/questions/863031/how-to-backspace-the-characters-in-the-cmd-buffer)
- [Console.KeyAvailable Property (System) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.console.keyavailable)
- [OnChar函数的中文处理问题，退格键时，怎么处理-CSDN论坛](https://bbs.csdn.net/topics/390088904)
