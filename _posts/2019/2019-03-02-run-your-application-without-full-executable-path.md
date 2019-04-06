---
title: "让你的 Windows 应用程序在任意路径也能够直接通过文件名执行"
date: 2019-03-02 19:07:48 +0800
categories: windows
position: knowledge
---

我们可以在任何路径下输入 `explorer` 来启动资源管理器，可以在任何路径中输入 `git` 来使用 git 相关的命令。我们知道可以通过将一个应用程序加入到环境变量中来获得这个效果，但是还有其他的方式吗？

我们将这个过程称之为向 Windows 注册一个应用程序路径。本文介绍向 Windows 注册一个应用程序路径的各种方法。

---

<div id="toc"></div>

## Windows 如何查找程序路径？

当我们在任意目录中输入一个命令的时候，Windows 会按照如下顺序寻找这个命令对应的可执行程序：

- 当前的工作目录
- `Windows` 文件夹（仅此文件夹，不会搜索子文件夹）
- `Windows\System32` 文件夹
- 环境变量 `Path` 值中的所有文件夹
- 注册表 `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths`

微软 **推荐使用** `App Paths` 即修改此注册表项来添加可执行程序。

当然，你也可以使用当前用户键下的注册表项来实现同样的目的，程序使用当前用户路径写注册表是不需要管理员权限的。`HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\App Paths`。

## 使用 App Paths 添加可执行程序

在注册表中打开 `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths` 子键，你可以在里面找到当前通过此方法注册的所有可执行程序。

比如下图是 PowerShell Core 的 msi 包安装后添加的 `pwsh.exe` 键。

![PowerShell Core](/static/posts/2019-03-02-17-31-37.png)

现在我们添加一个我们自己开发的程序 `walterlv.exe`，于是就直接在 `App Paths` 子键下添加一个 `walterlv.exe` 的键，并将其默认值设为 `walterlv.exe` 的完整路径。

![新增的 walterlv.exe](/static/posts/2019-03-02-19-02-35.png)

---

**参考资料**

- [Application Registration - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/shell/app-registration)
