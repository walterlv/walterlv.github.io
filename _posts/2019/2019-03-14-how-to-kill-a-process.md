---
title: "C#/.NET 如何结束掉一个进程"
date: 2019-03-14 22:57:27 +0800
tags: dotnet csharp
position: starter
---

本文介绍如何结束掉一个进程。

---

<div id="toc"></div>

## 结束掉特定名字的进程

`ProcessInfo` 中有 `Kill` 实例方法可以调用，也就是说如果我们能够拿到一个进程的信息，并且对这个进程拥有访问权限，那么我们就能够结束掉它。

使用 `Process.GetProcessesByName(processName)` 可以按照名字拿到进程信息。于是我们可以使用这个方法杀掉具有特定名称的进程。

```csharp
private void KillProcess(string processName)
{
    foreach (var process in Process.GetProcessesByName(processName))
    {
        try
        {
            // 杀掉这个进程。
            process.Kill();

            // 等待进程被杀掉。你也可以在这里加上一个超时时间（毫秒整数）。
            process.WaitForExit();
        }
        catch (Win32Exception ex)
        {
            // 无法结束进程，可能有很多原因。
            // 建议记录这个异常，如果你的程序能够处理这里的某种特定异常了，那么就需要在这里补充处理。
            // Log.Error(ex);
        }
        catch (InvalidOperationException)
        {
            // 进程已经退出，无法继续退出。既然已经退了，那这里也算是退出成功了。
            // 于是这里其实什么代码也不需要执行。
        }
    }
}
```

## 结束掉自己

可以是参见林德熙的博客，使用 `Environment.FailFast`，在结束掉自己的时候记录自己的错误日志。

- [dotnet 使用 Environment.FailFast 结束程序 - 林德熙](https://blog.lindexi.com/post/dotnet-%E4%BD%BF%E7%94%A8-environment.failfast-%E7%BB%93%E6%9D%9F%E7%A8%8B%E5%BA%8F)
