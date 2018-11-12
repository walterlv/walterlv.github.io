---
title: "用 dotTrace 进行性能分析时，Timeline 打不开？无法启动进程？也许你需要先开启系统性能计数器的访问权限"
date: 2018-11-12 16:46:37 +0800
categories: dotnet windows
---

对 .NET 程序使用 dotTrace 进行性能分析时，你也可能遭遇到 dotTrace 的 Bug。我就遇到了性能分析选项 Timeline 打不开进程的情况。

---

<div id="toc"></div>

### dotTrace 的性能分析选项

dotTrace 启动性能分析的选项有四个，你可以阅读 [用 dotTrace 进行性能分析时，各种不同性能分析选项的含义和用途](/post/dottrace-profiler-options.html) 了解不同选项的含义和用途，以便对你的性能分析提供更多的帮助和更有价值的分析数据。

### Timeline 打不开？

可是，当我真的使用这个选项的时候，却发现根本无法完成性能分析。

具体来说，是在出现了性能分析的指示窗口后，被分析程序的界面迟迟没有出现。随后在半分钟到数分钟后，分析器自动退出，没有得到任何性能分析数据。

![启动 ETW](/static/posts/2018-11-12-16-08-58.png)  
▲ 启动 ETW（事件跟踪器）

![启动分析器](/static/posts/2018-11-12-16-09-03.png)  
▲ 启动性能分析器

![性能分析指示窗口](/static/posts/2018-11-12-16-40-48.png)  
▲ 性能分析指示窗口

最后那个指示窗口就这样过一会儿变成以下窗口，提示 “Waiting for a managed application to start...”，然后消失。

![等待启动](/static/posts/2018-11-12-16-41-35.png)  
▲ 等待启动

### 解决方法

在这四个选项中，只有 Timeline 和 Line-by-line 是打不开的，Sampling 打得开。于是可以从他们之间的差异着手分析。

在 [用 dotTrace 进行性能分析时，各种不同性能分析选项的含义和用途](/post/dottrace-profiler-options.html) 一文中，我们可以得知，只有 Timeline 用到了 ETW，而这个是一个系统功能。也许是系统功能无法访问呢？毕竟这种事情还是非常常见的。

于是果然在 [Timeline is not working](https://dotnettools-support.jetbrains.com/hc/en-us/articles/206546069-Timeline-is-not-working-issue-solution-for-different-Windows-versions) 找到了解决方法 —— 你需要开启你所在的用户组对 Performance Monitor 的访问权限。

现在开始解决：

#### 启动“计算机管理”

在你的 Windows 10 搜索（或者小娜）中搜索 “计算机管理”，英文用户搜索 “Computer Management”。然后启动它。

![搜索并启动计算机管理](/static/posts/2018-11-12-16-26-14.png)  
▲ 搜索并启动计算机管理

#### 配置性能监视器用户组

在计算机管理中，找到 “计算机管理 -> 系统工具 -> 本地用户和组 -> 组”，点开后在中间的列表中找到 “Performance Monitor Users”。

对于英文的系统，对应的路径为 “Computer Management -> System Tools -> Local Users and Groups -> Groups”，然后一样找到 “Performance Monitor Users”。

![找到 Performance Monitor Users](/static/posts/2018-11-12-16-27-56.png)  
▲ 找到 Performance Monitor Users

为了照顾中文用户，我找小伙伴帮忙截了一张中文的图：

![中文版的设置路径](/static/posts/2018-11-12-16-31-36.png)  
▲ 中文版的设置路径

#### 添加自己作为用户组的成员

双击 Performance Monitor Users，按照以下的步骤将自己添加到用户组中。

![将自己添加到用户组中](/static/posts/2018-11-12-16-35-51.png)  
▲ 将自己添加到用户组中

感谢 [林德熙](https://lindexi.gitee.io/lindexi/) 再次帮我截到一张中文版的图片：

![中文版的添加](/static/posts/2018-11-12-16-36-39.png)  
▲ 中文版的添加

#### 你已经完成了

你已经修复了问题，建议注销并重新登录 Windows，当然也可以考虑重启。

重启后再次尝试使用 Timeline 选项启动进程进行性能分析应该可以正常。

---

#### 参考资料

- [Timeline is not working: issue solution for different Windows versions – .NET Tools Support - JetBrains](https://dotnettools-support.jetbrains.com/hc/en-us/articles/206546069-Timeline-is-not-working-issue-solution-for-different-Windows-versions)
- [Can't start ETW collector. – .NET Tools Support - JetBrains](https://dotnettools-support.jetbrains.com/hc/en-us/community/posts/207099769-Can-t-start-ETW-collector-)
