---
title: "应用程序清单 Manifest 中各种 UAC 权限级别的含义和效果"
publishDate: 2019-03-17 20:03:29 +0800
date: 2019-03-20 21:39:33 +0800
tags: windows dotnet csharp wpf
position: knowledge
coverImage: /static/posts/2019-03-17-16-34-34.png
permalink: /post/requested-execution-level-of-application-manifest.html
---

如果你的程序对 Windows 运行权限有要求，那么需要设置应用程序清单。本文介绍如何添加应用程序清单，并解释其中各项 UAC 权限设置的实际效果。

---

<div id="toc"></div>

阅读本文之前，你可能需要了解如何创建应用程序清单文件。阅读我的另一篇博客可以了解：

- [如何创建应用程序清单文件 App.Manifest，如何创建不带清单的应用程序 - 吕毅](/post/create-manifest-file-for-application)

## 各种不同的 UAC 清单选项

从默认生成的应用程序清单中，我们可以很容易的知道有四种不同的设置：

- `asInvoker`
- `requireAdministrator`
- `highestAvailable`
- 删除 `requestedExecutionLevel` 元素 *（不要忘了还可以删除）*

当然这里我们是没有考虑 `uiAccess` 的。你可以阅读我的另一篇博客了解 `uiAccess` 的一项应用：

- [让 Windows 桌面程序运行在 Windows 应用上面 - 吕毅](/wpf/2015/03/31/run-desktop-application-above-windows-application.html)

## asInvoker

**父进程是什么权限级别，那么此应用程序作为子进程运行时就是什么权限级别。**

默认情况下用户启动应用程序都是使用 Windows 资源管理器（explorer.exe）运行的；在开启了 UAC 的情况下，资源管理器是以标准用户权限运行的。于是对于用户点击打开的应用程序，默认就是以标准用户权限运行的。

如果已经以管理员权限启动了一个程序，那么这个程序启动的子进程也会是管理员权限。典型的情况是一个应用程序安装包安装的时候使用管理员权限运行，于是这个安装程序在安装完成后启动的这个应用程序进程实例就是管理员权限的。有时候这种设定会出现问题，你可以阅读 [在 Windows 系统上降低 UAC 权限运行程序（从管理员权限降权到普通用户权限）](/post/start-process-with-lowered-uac-privileges)。

## requireAdministrator

**此程序需要以管理员权限运行。**

在资源管理器中可以看到这样的程序图标的右下角会有一个盾牌图标。

![管理员权限图标](/static/posts/2019-03-17-16-34-34.png)

用户在资源管理器中双击启动此程序，或者在程序中使用 `Process.Start` 启动此程序，会弹出 UAC 提示框。点击“是”会提权，点击“否”则操作取消。

![UAC 弹窗](/static/posts/2019-03-17-16-42-45.png)

## highestAvailable

**此程序将以当前用户能获取的最高权限来运行。**

这个概念可能会跟前面说的 `requireAdministrator` 弄混淆。

要更好的理解这两个概念的区别，你可能需要对 UAC 用户账户控制有一个初步的了解，可以阅读我的另一篇博客：

- [Windows 中的 UAC 用户账户控制](/post/windows-user-account-control)

接下来的内容，都假设你已经了解了上文所述的 UAC 用户账户控制。

如果你指定为 `highestAvailable`：

- 当你在管理员账户下运行此程序，就会要求权限提升。资源管理器上会出现盾牌图标，双击或使用 `Process.Start` 启动此程序会弹出 UAC 提示框。在用户同意后，你的程序将获得完全访问令牌（Full Access Token）。
- 当你在标准账户下运行此程序，此账户的最高权限就是标准账户。受限访问令牌（Limited Access Token）就是当前账户下的最高令牌了，于是 `highestAvailable` 已经达到了要求。资源管理器上不会出现盾牌图标，双击或使用 `Process.Start` 启动此程序也不会出现 UAC 提示框，此程序将以受限权限执行。

下图是一个例子。lvyi 是我安装系统时创建的管理员账号，但是我使用的是 walterlv 标准账号。正常是在 walterlv 账号下启动程序，但以管理员权限运行时，会要求输入 lvyi 账号的密码来提权，于是就会以 lvyi 的身份运行这个程序。这种情况下，那个管理员权限运行的程序会以为当前运行在 lvyi 这个账户下，程序员需要小心这里的坑，因为拿到的用户路径以及注册表不是你所期望的 walterlv 这个账号下的。

![标准账户下运行管理员权限程序会切换账户](/static/posts/2019-03-17-16-57-48.png)

## 删除 requestedExecutionLevel 元素

删除 requestedExecutionLevel 元素指的是将下面标注的这一行删掉：

```diff
    <?xml version="1.0" encoding="utf-8"?>
    <assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
      <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">
        <security>
          <requestedPrivileges xmlns="urn:schemas-microsoft-com:asm.v3">
--          <requestedExecutionLevel level="asInvoker" uiAccess="false" />
          </requestedPrivileges>
        </security>
      </trustInfo>
```

注释中说删除 `requestedExecutionLevel` 元素将开启 UAC 虚拟化。

![开启 UAC 虚拟化](/static/posts/2019-03-17-17-15-24.png)

我将这个节点删除后，运行我的 Demo 程序后 UAC 虚拟化将启用。默认这里是“已禁用”的。

不过在以下任意一种情况下，UAC 虚拟化即便删了 `requestedExecutionLevel` 也是不会开启的：

1. 64 位进程
1. 不可交互的进程（例如服务）
1. 进程模拟用户的操作（如果一个进程像用户一样执行了某项操作，那么这个操作不会被虚拟化）
1. 驱动等内核模式进程

这部分的列表你可以在这里查询到：[Registry Virtualization - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/sysinfo/registry-virtualization#registry-virtualization-scope)。

## 这些值都用于什么场景？

- `asInvoker` 是默认情况下的首选。如果你的程序没有什么特殊的需求，就使用 `asInvoker`；就算你的程序需要管理员程序做一些特殊的任务，那最好也写成 `asInvoker`，仅在必要的时候才进行管理员权限提升。
- `requireAdministrator`，只有当你的程序大量进行需要管理员权限的操作的时候才建议使用 `requireAdministrator` 值，例如你正在做安装程序。
- `highestAvailable`，当你的程序需要管理员权限，但又要求仅对当前用户修改时设置为此值。因为标准用户申请 UAC 提权之后会以其他用户的身份运行进程，这就不是对当前用户的操作了；使用 `highestAvailable` 来确保以当前用户运行。

## 为什么 UWP 程序不能指定 UAC 清单选项？

在我的另一篇博客 [Windows 中的 UAC 用户账户控制](/post/windows-user-account-control) 中说到了访问令牌。

UWP 程序只能获得受限访问令牌，没得选，所以也就不需要指定 UAC 清单选项了。这也是为什么当你关闭 UAC 之后，UWP 程序将全部闪退的重要原因。

---

**参考资料**

- [Registry Virtualization - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/sysinfo/registry-virtualization#registry-virtualization-scope)
<!-- - [UAC 实现原理及绕过方法 - _chesky - 博客园](https://www.cnblogs.com/Chesky/p/UAC_Bypass.html) -->
- [How User Account Control (UAC) Affects Your Application - Microsoft Docs](https://docs.microsoft.com/en-us/cpp/security/how-user-account-control-uac-affects-your-application)


