---
title: "设置进程的 RedirectStandardOutput 重定向输出后，如果不将输出读出来，会卡死此进程"
date: 2020-08-04 11:00:19 +0800
tags: dotnet csharp
position: problem
coverImage: /static/posts/2020-08-03-19-42-13.png
permalink: /post/standard-output-must-be-read-if-you-redirect-standard-output.html
---

设置进程的 RedirectStandardOutput 重定向输出后，必须将其读出来。本文带你做一个实验并得出结论。

---

<div id="toc"></div>

## 重定向输出

一个简单的尝试重定向输出的代码如下：

```csharp
using var process = new Process
{
    StartInfo = new ProcessStartInfo("Walterlv.Demo.Output.exe")
    {
        UseShellExecute = false,
        CreateNoWindow = true,
        RedirectStandardOutput = true,
    },
};
process.Start();
Console.ReadLine();
```

正常跑起来的话不会出什么问题。不过对于 `Walterlv.Demo.exe` 那个进程来说，就比较危险了……

## 卡死！

`Walterlv.Demo.Output.exe` 是什么程序呢？自己写的测试程序，如下：

```csharp
namespace Walterlv.Demo.Output
{
    class Program
    {
        static void Main(string[] args)
        {
            for (var i = 0; i < int.MaxValue; i++)
            {
                System.Console.WriteLine($"[{i.ToString().PadLeft(7)}] Console.WriteLine();");
            }
        }
    }
}
```

用 Visual Studio 附加到两个进程后，点击“暂停”按钮，会发现

![暂停按钮](/static/posts/2020-08-03-19-42-13.png)

![已停止](/static/posts/2020-08-03-19-43-04.png)

这个 `for` 循环并没有像平常的其他循环一样瞬间炸裂，而是停在了一个神奇的数字“128”上。点击“继续”按钮，过一会儿再点击“暂停”，依然显示的是“128”。

说明--**现在卡死了**！

## 缓冲区已满

因为我们前面的代码使用 `Console.ReadLine()` 等待用户输入，我们在下一行打一个断点，可以在按下回车后进入断点，于是可以观察到 `process` 里面的各种字段和属性。

可以注意到，`StandardOutput` 属性中是存在缓冲区的，大小只有 4096 字节。打开 `charBuffer` 字段，可观察到每一个字节的值。

![缓冲区数据](/static/posts/2020-08-04-10-55-11.png)

我们的输出程序，总共输出 128 次即死掉，而每次输出的行（就是那个 `[      1] Console.WriteLine();`）我正好安排到 32 个字符。乘起来刚好 4096 大小。

## 开发注意

如果你重定向了输出流，那么一定记得取出输出数据，否则会导致被启动的程序卡死在下一个 `Console.WriteLine` 中。


