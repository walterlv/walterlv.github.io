---
title: "如何为你的 Windows 应用程序关联 URL 协议，以便在浏览器中也能打开你的应用"
publishDate: 2019-03-03 16:28:12 +0800
date: 2019-07-20 09:15:12 +0800
categories: windows
position: knowledge
---

移动程序关联 URL 是常态，桌面应用程序其实也早就支持关联 URL 以便在浏览器中打开。当我们的程序关联了一个 URL 协议之后，开发的网站上就可以通过这个 URL 与程序进行互操作，这很互联网。

对于 Windows 桌面应用来说，关联一个 URL 协议是通过修改注册表来实现的。本文介绍如何为你的应用关联一个 URL 协议。

---

<div id="toc"></div>

## URL 协议

一个常用的 URL 协议是这样子的：<https://walterlv.com>。前面的 `https` 就是协议名称，而 `https://` 放在一起就是在使用 `https` 协议。

本文我们将定义一个 `walterlv` 协议，然后关联到我们本地安装的一个桌面应用程序上，然后使用 `walterlv://open?id=1` 来打开一个 id 为 1 的逗比。

## 注册一个 URL 协议

要在 Windows 系统上注册一个 URL 协议，你只需要两个步骤：

- 好好想一个协议名称
- 在注册表中添加协议关联

### 好好想一个协议名称

就知道你想不出来名字，于是可以使用命名生成工具：[Whitman](ms-windows-store://pdp/?productid=9P8LNZRNJX85)，其原理可阅读 [冷算法：自动生成代码标识符（类名、方法名、变量名） - 吕毅](/post/algorithm-of-generating-random-identifiers)。

然后本文使用协议名称 `walterlv`。

### 在注册表中添加协议关联

你需要在注册表的 `HKEY_LOCAL_MACHINE\Software\Classes` 或者 `HKEY_CURRENT_USER\Software\Classes` 添加一些子键：

```text
HKEY_CURRENT_USER\Software\Classes
    walterlv
        (Default) = 吕毅的特殊链接
        URL Protocol = WalterlvProtocol
        Shell
            Open
                Command
                    (Default) = "C:\Users\lvyi\AppData\Local\Walterlv.Foo\Walterlv.Windows.Association.exe" "%1"
```

在 `Classes` 中的那个根键 `walterlv` 就是我们的协议名称，也就是 `walterlv://` 的那个前缀。

`walterlv` 根键 中的 `(Default)` 属性给出的是链接的名称；如果后面没有设置打开方式（也就是那个 `Shell\Open\Command`）的话，那么在 Chrome 里打开就会显示为那个名称（如下图）。

![默认的协议名称](/static/posts/2019-03-03-16-19-28.png)

`URL Protocol` 这个注册表项是必须存在的，但里面的值是什么其实无所谓。这只是表示 `walterlv` 是一个协议。

接下来 `Shell\Open\Command` 中的 `(Default)` 值设置为一个打开此协议用的命令行。其中路径后面的 `"%1"` 是文件资源管理器传入的参数，其实就是文件的完整路径。我们加上了引号是避免解析命令行的时候把包含空格的路径拆成了多个参数。

在正确填写了注册表的以上内容之后，在 Chrome 里打开此链接将看到以下 URL 打开提示：

![带有打开命令的协议](/static/posts/2019-03-03-16-24-31.png)

**关于注册表路径的说明**：

`HKEY_LOCAL_MACHINE` 主键是此计算机上的所有用户共享的注册表键值，而 `HKEY_CURRENT_USER` 是当前用户使用的注册表键值。而我们在注册表的 `HKEY_CLASSES_ROOT` 中也可以看到跟 `HKEY_LOCAL_MACHINE\Software\Classes` 和 `HKEY_CURRENT_USER\Software\Classes` 中一样的文件关联项，是因为 `HKEY_CLASSES_ROOT` 是 `HKEY_LOCAL_MACHINE\Software\Classes` 和 `HKEY_CURRENT_USER\Software\Classes` 合并之后的一个视图，其中用户键值会覆盖此计算机上的相同键值。

也就是说，如果你试图修改文件关联，那么需要去 `HKEY_LOCAL_MACHINE\Software\Classes` 和 `HKEY_CURRENT_USER\Software\Classes` 中，但如果只是去查看文件关联的情况，则只需要去 `HKEY_CLASSES_ROOT` 中。

写入计算机范围内的注册表项需要管理员权限，而写入用户范围内的注册表项不需要管理员权限；你可以酌情选用。

### 额外说明

感谢 [人猿](https://me.csdn.net/xnyqh) 提供的补充信息：

> 假如初次点击不打开，并且勾选了始终，那么以后这个弹框就没有了，而程序也不会打开，需要做下配置的修改 谷歌浏览器：C:\Users\(你的用户名)\AppData\Local\Google\Chrome\User Data\Default\Preferences 火狐浏览器：先关闭浏览器C:\Users\(你的用户名)\AppData\Roaming\Mozilla\Firefox\Profiles\4uasyvvi.default 找到handlers.json
