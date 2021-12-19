---
title: "为 .NET Core / Framework 程序开启大内存感知（LargeAddressAware），使 32 位程序支持最多 4GB 的用户空间内存"
date: 2021-12-13 21:01:43 +0800
tags: dotnet windows
position: knowledge
coverImage: /static/posts/2021-12-13-20-51-53.png
permalink: /post/how-to-enable-large-address-aware-for-net-apps.html
---

如果你不做特殊处理，把你的项目以 x86 的架构进行编译，那么你的应用程序在 Windows 上最多只能使用 2GB 的内存（地址空间）。如果你的项目使用 .NET Framework 框架，那么现行有很多简单的方法来帮你实现大内存感知，但 .NET Core 框架下却没有。所以我写了一个库 dotnetCampus.LargeAddressAware，帮助你轻松实现 32 位程序的大内存感知。

---

<div id="toc"></div>

## dotnetCampus.LargeAddressAware 库

无论你是 .NET Framework 程序还是 .NET Core 程序，只要在你的项目中安装 [dotnetCampus.LargeAddressAware](https://www.nuget.org/packages/dotnetCampus.LargeAddressAware/) 即可立享最高可达 4GB 的用户空间内存。

```xml
<ItemGroup>
  <PackageReference Include="dotnetCampus.LargeAddressAware" Version="1.0.0" />
</ItemGroup>
```

## 效果

| 应用程序 | 操作系统 | 是否开启大内存感知 | 最大可使用的用户空间内存 |
| -------- | -------- | ------------------ | ------------------------ |
| 32-bit   | 32-bit   | ❌                  | 2GB                      |
| 32-bit   | 64-bit   | ❌                  | 2GB                      |
| 32-bit   | 32-bit   | ✔️                  | 3GB                      |
| 32-bit   | 64-bit   | ✔️                  | 4GB                      |

## 原理

我在 2017 年写的一篇博客（[使 32 位程序使用大于 2GB 的内存](/windows/2017/09/12/32bit-application-use-large-memory)）中就已经介绍过 32 位程序开启大内存感知的原理和方法了，不过因为一开始我自己也懂得不多，所以写得比较简单。后来也根据自己新的理解也填充了不少内容，但是当初取的标题和内容真的很难被搜到，而且侧重点在方法上。所以现在重写了现在的这篇新的，侧重在让懒用户快速上手，让深度用户快速理解上。

32 位寻址空间只有 4GB 大小，于是 32 位应用程序进程最大只能用到 4GB 的内存。然而，除了应用程序本身要用内存，操作系统内核也需要使用。应用程序使用的内存空间分为用户空间和内核空间，每个 32 位程序的用户空间可独享前 2GB 空间（指针值为正数），而内核空间为所有进程共享 2GB 空间（指针值为负数）。所以，32 位应用程序实际能够访问的内存地址空间最多只有 2GB。

在应用程序的 PE 头上，有一个应用程序是否感知大内存的标记 `LARGEADDRESSAWARE`。当 32 位操作系统识别到此标记时，会为其提供 3GB 的用户空间；当 64 位操作系统识别到此标记时，会为其提供 4GB 的用户空间，即用户态完全用满 32 位的寻址空间。

## 其他开启 `LARGEADDRESSAWARE` 的方法

### 不推荐的方法：仅适用于 .NET Framework 的旧方法

当时的[那篇博客](/windows/2017/09/12/32bit-application-use-large-memory)中，我提到过可通过编译成 AnyCPU (Prefer 32-bit) 来实现大内存感知，这也是最简单的方式，被 .NET Framework 自带。方法是修改 csproj 文件，加上这两句：

```diff
    <PropertyGroup>
++    <!-- 此方法被废弃，因为不支持 .NET Core -->
++    <PlatformTarget>AnyCPU</PlatformTarget>
++    <Prefer32Bit>true</Prefer32Bit>
    </PropertyGroup>
```

可惜，此方法只适用于 .NET Framework 程序，不适用于 .NET Core 程序！因为 .NET Core 框架下编译时，是直接忽略 `Prefer32Bit` 的！.NET Core 下大内存感知确实是有了，但生成的却是 AMD64 程序，无法在 32 位系统下运行。

![AMD64 程序](/static/posts/2021-12-13-20-51-53.png)

### 不推荐的方法：使用 EditBin 的原始方法

如果还想用自带的方法来完成大内存感知的开启的话，我们只能选用 Visual Studio 自带的 editbin 了。方法是打开 Visual Studio 自带的终端，然后在里面输入：

```powershell
editbin /largeaddressaware xxx.exe
```

方法本身其实是非常好的，毕竟是 Visual Studio 自带的工具链。但需要手工执行就是一个大坑！你怎么能保证每次发布前要运行一下这个命令呢？

## 检查是否已开启大内存感知

我在[之前的博客](/windows/2017/09/12/32bit-application-use-large-memory)中提到可以使用 Visual Studio 自带的 dumpbin 工具来检查是否开启了大内存感知：

```powershell
dumpbin /headers xxx.exe | more
```

但是，我们有更直观的 dnSpy 为什么还要用命令行来临时查看呢？相信你早就注意到前面我已经贴了一张 dnSpy 检查大内存感知的图了。

---

**参考资料**

- AnyCPU (32bit preferred)
    - [What is the purpose of the “Prefer 32-bit” setting in Visual Studio 2012 and how does it actually work?](https://stackoverflow.com/questions/12066638/what-is-the-purpose-of-the-prefer-32-bit-setting-in-visual-studio-2012-and-how)
    - [WPF 编译为 AnyCPU 和 x86 有什么区别 - 林德熙](https://blog.lindexi.com/post/WPF-%E7%BC%96%E8%AF%91%E4%B8%BA-AnyCPU-%E5%92%8C-x86-%E6%9C%89%E4%BB%80%E4%B9%88%E5%8C%BA%E5%88%AB.html)
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

