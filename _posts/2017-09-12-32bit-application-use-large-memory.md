---
layout: post
title: "使 32 位程序使用大于 2GB 的内存"
date: 2017-09-12 21:48:46 +0800
categories: Windows
---

不管在 32 位 Windows 上还是在 64 位 Windows 上，32 位的应用程序都只能使用最大 2GB 的内存，这是我们司空见惯的一个设定。但其实 Windows 提供了一些方法让我们打破这样的设定，使程序使用大于 2GB 的内存。

阅读本文，你将了解：
1. 为什么 32 位程序只能使用最大 2GB 内存；
1. 让 32 位程序使用大于 2GB 内存的两种方法，
1. 声明支持大于 2GB 内存后，能使用多少内存。

### 为什么 32 位程序只能使用最大 2GB 内存？

32 位寻址空间只有 4GB 大小，于是 32 位应用程序最大只能用到 4GB 的内存。然而，除了应用程序要用内存，操作系统也需要使用。应用程序使用的内存分为用户态和内核态，每个 32 位程序的用户态可独享前 2GB 空间（指针值为正数），而内核态为所有程序共享 2GB 空间（指针值为负数）。所以，32 位应用程序实际能够访问的内存地址空间最多只有 2GB。

### 让 32 位程序使用大于 2GB 内存的两种方法

#### editbin

这是 Visual Studio 2017 采用的做法。我们需要使用到两个工具——`editbin` 和 `dumpbin`。前者用于编辑我们编译生成好的程序使之头信息中声明支持大于 2GB 内存，后者用于查看程序的头信息验证我们是否改好了。

编辑一个程序使之声明支持大于 2GB 内存的命令是：

```Bash
editbin /largeaddressaware xxx.exe
```

其中，`xxx.exe` 是我们准备修改的程序，可以使用相对路径或绝对路径（如果路径中出现空格记得带引号）。但是，`editbin` 从哪里来呢？

**撰写中……**

![本机工具提示符]({{ site.baseurl }}/assets/2017-09-12-where-to-find-editbin.png)

**撰写中……**

#### 编译成 AnyCPU (Prefer 32-bit)

这是本文更推荐的做法，也是最简单的做法。方法是打开入口程序集的属性页，将“目标平台”选为“AnyCPU”，然后勾选“首选 32 位”。需要注意的是，这种生成方式是 .Net Framework 4.5 及以上版本才提供的。

![AnyCPU (Prefer 32-bit)]({{ site.baseurl }}/assets/2017-09-12-anycpu-with-32bit-preferred-build.png)

至于 AnyCPU (Prefer 32-bit) 和 x86 两种生成方式的区别，请参见：[What is the purpose of the “Prefer 32-bit” setting in Visual Studio 2012 and how does it actually work?](https://stackoverflow.com/questions/12066638/what-is-the-purpose-of-the-prefer-32-bit-setting-in-visual-studio-2012-and-how)。

### 声明支持大于 2GB 内存后，能使用多少内存？

对于 32 位操作系统，程序依然只能使用 2GB 内存，除非开启了 `/3GB` 开关，开启方法详见：[/3GB](https://msdn.microsoft.com/en-us/library/windows/hardware/ff556232(v=vs.85).aspx)。开启后，应用程序的用户态将可以使用 3GB 内存，但内核态将只能使用 1GB 内存。微软认为，是否打开 `/3GB` 开关是计算机设备开发商需要做的事情，开发商也需要自己测试开启后系统的稳定性、内核态内存是否足够。

对于 64 位操作系统，Windows 将很豪放地将 4GB 全部贡献给这样的程序，因为系统自己已经有更多的内存寻址空间可以使用了，没必要跟 32 位应用程序抢占寻址空间。

### 参考资料
- AnyCPU (32bit preferred)
  - [What is the purpose of the “Prefer 32-bit” setting in Visual Studio 2012 and how does it actually work?](https://stackoverflow.com/questions/12066638/what-is-the-purpose-of-the-prefer-32-bit-setting-in-visual-studio-2012-and-how)
- IMAGE_FILE_LARGE_ADDRESS_AWARE
  - [Memory Limits for Windows and Windows Server Releases](https://msdn.microsoft.com/en-us/library/windows/desktop/aa366778(v=vs.85).aspx)
  - [Getting 32-bit application to use more than 2GB on 64-bit Windows 7?](https://superuser.com/questions/176869/getting-32-bit-application-to-use-more-than-2gb-on-64-bit-windows-7)
  - [/LARGEADDRESSAWARE (Handle Large Addresses)](https://msdn.microsoft.com/en-us/library/wz223b1z.aspx)
  - [Why 2 GB memory limit when running in 64 bit Windows?](https://stackoverflow.com/questions/2740308/why-2-gb-memory-limit-when-running-in-64-bit-windows)
  - [Pushing the Limits of Windows: Paged and Nonpaged Pool](https://blogs.technet.microsoft.com/markrussinovich/2009/03/10/pushing-the-limits-of-windows-paged-and-nonpaged-pool/)
  - [Can a 32bit process access more memory on a 64bit windows OS?](https://stackoverflow.com/questions/570589/can-a-32bit-process-access-more-memory-on-a-64bit-windows-os)
- /3GB
  - [/3GB](https://msdn.microsoft.com/en-us/library/windows/hardware/ff556232(v=vs.85).aspx)
- editbin/dumpbin
  - `editbin /largeaddressaware xxx.exe`
  - `dumpbin /headers xxx.exe | more`
  - [verify if largeAddressAware is in effect?](https://stackoverflow.com/questions/3979624/verify-if-largeaddressaware-is-in-effect)
  - [LargeAddressAware Visual Studio 2015 C#](https://stackoverflow.com/questions/31565532/largeaddressaware-visual-studio-2015-c-sharp)
