---
title: "C#/.NET 中启动进程时所使用的 UseShellExecute 设置为 true 和 false 分别代表什么意思？"
publishDate: 2019-03-29 15:23:35 +0800
date: 2019-04-01 12:04:26 +0800
categories: dotnet csharp
position: knowledge
---

在 .NET 中创建进程时，可以传入 `ProcessStartInfo` 类的一个新实例。在此类型中，有一个 `UseShellExecute` 属性。

本文介绍 `UseShellExecute` 属性的作用，设为 `true` 和 `false` 时，分别有哪些进程启动行为上的差异。

---

<div id="toc"></div>

## 本质差异

`Process.Start` 本质上是启动一个新的子进程，不过这个属性的不同，使得启动进程的时候会调用不同的 Windows 的函数。

- `UseShellExecute = true`
    - 调用的是 [ShellExecute](https://docs.microsoft.com/en-us/windows/desktop/api/shellapi/nf-shellapi-shellexecutea)
- `UseShellExecute = false`
    - 调用的是 [CreateProcess](https://docs.microsoft.com/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-createprocessa)

当然，如果你知道这两个函数的区别，那你自然也就了解此属性设置为 `true` 和 `false` 的区别了。

## 效果差异

`ShellExecute` 的用途是打开程序或者文件或者其他任何能够打开的东西（如网址）。

也就是说，你可以在 `Process.Start` 的时候传入这些：

- 一个可执行程序（exe）
- 一个网址
- 一个 html / mp4 / jpg / docx / enbx 等各种文件
- 在 `PATH` 环境变量中的各种程序

不过，此方法有一些值得注意的地方：

- 不支持重定向输入和输出
- 最终启动了哪个进程可能是不确定的，你可能需要注意潜在的安全风险

而 `CreateProcess` 则会精确查找路径来执行，不支持各种非可执行程序的打开。但是：

- 支持重定向输入和输出

## 如何选择

`UseShellExecute` 的默认值是 `true`。

如果有以下需求，那么建议设置此值为 `false`：

- 需要明确执行一个已知的程序
- 需要重定向输入和输出

如果你有以下需求，那么建议设置此值为 `true` 或者保持默认：

- 需要打开文档、媒体、网页文件等
- 需要打开 Url
- 需要打开脚本执行
- 需要打开计算机上环境变量中路径中的程序

---

**参考资料**

- [c# - When do we need to set UseShellExecute to True? - Stack Overflow](https://stackoverflow.com/a/5255335/6233938)
