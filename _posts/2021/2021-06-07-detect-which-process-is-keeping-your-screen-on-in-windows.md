---
title: "Windows 系统上如何揪出阻止你屏幕关闭的程序"
date: 2021-06-07 13:42:18 +0800
tags: windows
position: knowledge
coverImage: /static/posts/2021-06-07-08-31-42.png
permalink: /posts/detect-which-process-is-keeping-your-screen-on-in-windows.html
---

使用 Win32 API `SetThreadExecutionState` 可以阻止进入屏幕保护程序，也能阻止屏幕关闭、阻止系统睡眠。这很方便，这也就可能造成各种参差不齐的程序都试图阻止你的屏幕关闭，于是来一个一整晚亮瞎眼就很难受。

本文教大家如何揪出阻止你屏幕关闭的程序。

---

我们主要使用系统自带的 `powercfg` 来查询相关的应用。因此，你需要以管理员权限打开你喜欢的终端。

<div id="toc"></div>

## 命令 `powercfg /requests`

在终端中输入命令：

```powershell
powercfg /requests
```

`/requests` 参数的作用是‎“列举应用程序和驱动程序的电源请求。电源请求可防止计算机自动关闭显示屏或进入低功耗睡眠模式。‎”官方文档对此的描述是：

> Enumerates application and driver Power Requests. Power Requests prevent the computer from automatically powering off the display or entering a low-power sleep mode.

于是，如果有某个应用或驱动设置了阻止屏幕关闭，那么就会出现在此命令执行的结果里面。

比如下面是我的例子：

- SteamVR 的几个进程试图阻止屏幕关闭，另外一些进程试图阻止系统睡眠

![发现 SteamVR 的电源请求](/static/posts/2021-06-07-08-31-42.png)

结束掉 SteamVR 后重新执行此命令，可以发现已经没有进程在阻止屏幕关闭和系统睡眠了：

![没有程序在阻止屏幕关闭](/static/posts/2021-06-07-08-42-38.png)

## 命令 `powercfg -energy -trace`

在终端中输入命令：

```powershell
powercfg -energy -trace
```

有时，应用并没有直接阻止你的屏幕关闭，而是在一段时间之内试图不断重置睡眠计时器，这种情况，前面的命令不能完全帮助你找到问题所在，于是你需要使用这个新命令。

运行这个命令，你需要等待 60 秒，就像下面这样：

**注意**：*等待期间不要碰电脑，因为鼠标和键盘事件也会影响到追踪结果！*

![运行 60 秒的追踪](/static/posts/2021-06-07-08-55-06.png)

等待完成后，它会提示你“跟踪完成”，但不会直接告诉你任何结果。结果都存在了你个账户目录下的 `energy-trace.etl` 日志文件里面，例如 `C:\Users\lvyi\energy-trace.etl`。

这个文件要用事件查看器打开。

第一步：右键开始按钮，选择“事件查看器”。

![打开事件查看器](/static/posts/2021-06-07-09-22-55.png)

第二步：操作→打开保存的日志

去用户文件夹中寻找“energy-trace.etl”文件，例如“C:\Users\lvyi\energy-trace.etl”，然后打开。

![打开保存的日志](/static/posts/2021-06-07-09-23-24.png)

第三步：在保存的日志中找到可疑记录

由于日志太多（几十万条），建议右击日志选择“筛选当前日志(L)...”，在筛选器里将事件来源选成“Kernel-Power”，事件 ID 设为 63。

![设置筛选器](/static/posts/2021-06-07-13-20-08.png)

可以看到，即便我设置完成，也还有 7,852 个条目。不过这时也比较容易找到问题在哪里了。提示的是：

> The application or service 0x0 is attempting to update the system timer resolution to a value of 0x0.

即有程序试图重置系统计时器。

![点击其中的几条查阅](/static/posts/2021-06-07-13-24-13.png)

在详细信息里，可以找到是哪个程序：

![msedge 正在重置系统计时器](/static/posts/2021-06-07-13-24-55.png)

可以看到，在这条记录里，是“msedge.exe”。所以，可以去 Edge 浏览器标签里找找，是否有正在播放的视频或音频等。

## 常用阻止关闭屏幕的程序

[发现电脑屏幕总是不自动关闭？看看你是否打开了这些程序……](/post/these-windows-applications-always-keep-display-on)

---

**参考资料**

- [Powercfg command-line options - Microsoft Docs](https://docs.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options)


