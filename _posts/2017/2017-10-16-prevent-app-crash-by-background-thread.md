---
title: "配置 legacyUnhandledExceptionPolicy 防止后台线程抛出的异常让程序崩溃退出"
publishDate: 2017-10-16 20:52:01 +0800
date: 2019-11-28 16:08:14 +0800
tags: dotnet wpf
description: legacyUnhandledExceptionPolicy 可以防止程序在后台线程抛出异常后崩溃退出。
permalink: /post/prevent-app-crash-by-background-thread.html
---

如果你的程序抛了异常，你是怎么处理的呢？等待程序崩溃退出？还是进行补救？

如果是做 UI 开发，很容易就找到 `Dispatcher.UnhandledException` 事件，然后在事件中进行补救。如果补救成功，可以设置 `e.Handled = true` 来阻止异常继续让程序崩溃退出。但是，如果是后台线程抛出了异常呢？并没有 `Dispatcher` 可以用。所以我们就束手就擒让程序自己退出吗？

---

WPF 和 Windows Forms 都是微软的框架，为了照顾初学者，微软会默认每一个开发者都不会正确地处理异常。于是在异常发生之后，微软 Windows 会假设开发者并不知道如何应对以便让应用程序正常工作，就擅自将应用程序进程结束掉，以便防止应用程序自己内部产生奇怪的状态和错误，避免对系统环境造成不可逆的严重后果。

能够写出异常处理代码的开发者，微软会默认他们懂了异常处理。

写出了监听 `Dispatcher.UnhandledException` 事件的开发者，微软会认为他们已经学会了如何在 UI 线程中处理异常。于是允许开发者设置 `e.Handled = true` 来标记异常已被正确处理，程序可以不用退出了。

还有一个事件 `AppDomain.CurrentDomain.UnhandledException`，然而这个事件却并不允许开发者标记 `e.Handled = true`。因为微软认为，应用程序域中所有的线程发生异常都会进入这个事件中，大多数开发者都不明白这些线程这些异常是怎么回事，所以不认为这些开发者具备正确处理这些异常的能力。比如 WPF 的触摸模块发生了异常，开发者知道如何恢复吗？并不知道，还不如结束掉程序然后重启呢！

在这个事件中，有一个属性 `IsTerminating` 指示是否应用程序正因为这次异常准备退出，不过开发者并不能拿这个属性做些什么。

但还是要照顾更高级的开发者的，于是祭出新的配置——`legacyUnhandledExceptionPolicy`！

在 `app.config` 文件的 `<runtime>` 节点中添加如下代码：

```xml
<legacyUnhandledExceptionPolicy enabled="1"/>  
```

如果你找不到在 App.config 的哪个地方，我再用一段代码标注一下，大概在这里：

```diff
    <?xml version="1.0" encoding="utf-8"?>
    <configuration>
        <startup useLegacyV2RuntimeActivationPolicy="true">
            <supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.8" />
        </startup>
        <runtime>
++          <legacyUnhandledExceptionPolicy enabled="1" />
        </runtime>
    </configuration>
```

加上了这个配置之后，`AppDomain.CurrentDomain.UnhandledException` 事件的 `IsTerminating` 就变成了 `false` 啦！也就是说，程序并不会因为这次的异常而崩溃退出。

既然你通过这个配置节点于微软达成了契约，你就需要好好地在 `AppDomain.CurrentDomain.UnhandledException` 事件中写好异常的恢复逻辑。如果不好好恢复，小心有些致命的异常会导致你的程序出现雪崩式的错误，最终 Windows 还是会通过 `CorruptedStateException` 把你干掉的！

---

**参考资料**
- [c# - How to prevent an exception in a background thread from terminating an application? - Stack Overflow](https://stackoverflow.com/questions/186854/how-to-prevent-an-exception-in-a-background-thread-from-terminating-an-applicati)
- [Exceptions in Managed Threads - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/threading/exceptions-in-managed-threads?wt.mc_id=MVP)

