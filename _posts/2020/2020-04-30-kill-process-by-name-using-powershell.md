---
title: "在 PowerShell 里根据进程名杀掉进程"
date: 2020-04-30 11:31:24 +0800
tags: powershell
position: knowledge
permalink: /posts/kill-process-by-name-using-powershell.html
---

任务管理器杀进程大家都会，不过如果你的系统被卡到任务管理器都无法操作了，怎么办？直接在 PowerShell 中干掉！另外，这也非常容易集成到各种工具链中。

---

系列博客：

- [在 CMD 里根据进程名杀掉进程 - walterlv](/post/process-by-name-using-cmd)
- [在 PowerShell 里根据进程名杀掉进程 - walterlv](/post/process-by-name-using-powershell)

<div id="toc"></div>

## Stop-Process / kill

PowerShell 脚本 Stop-Process 可以用来结束进程。

结束进程名为 chrome 的进程：

```powershell
Stop-Process -Name chrome
```

```powershell
# kill 是 Stop-Process 的简写，ProcessName 是 Name 的别名。
kill -ProcessName chrome
```

如果除了关闭你正在看的博客，还顺便要把自己正在编写的代码关闭掉，可以传多个进程名：

```powershell
Stop-Process -Name chrome,code
```

## taskkill 命令

PowerShell 依然能使用 CMD 命令，于是以下命令依旧可以工作：

```powershell
taskkill /f /t /im chrome.exe
```

详见：

- [在 CMD 里根据进程名杀掉进程 - walterlv](/post/process-by-name-using-cmd)

## 其他间接玩法

### Process.Kill

`Get-Process` 能拿到进程对象，于是可以利用管道拿到对象将其关闭：

```powershell
Get-Process -Name chrome | Stop-Process
```

更间接一点，遍历所有拿到的 Process 对象，然后杀掉：

```powershell
Get-Process -Name chrome | Foreach-Object { $_.Kill() }
```

