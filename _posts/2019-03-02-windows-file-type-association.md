---
title: "如何为你的 Windows 应用程序关联一种或多种文件类型"
publishDate: 2019-03-02 21:22:40 +0800
date: 2019-03-03 13:22:06 +0800
categories: dotnet windows csharp
position: knowledge
---

对于 Windows 桌面应用来说，让应用关联一种或多种文件类型是通过修改注册表来实现的。

本文介绍如何为你的应用关联自定义的文件类型或者关联被广泛使用的文件类型。

---

<div id="toc"></div>

### 文件关联

Windows 上的文件关联是通过文件的扩展名来实现的。有些文件类型是被广泛使用的公共类型，例如 .txt、.png、.mp4 文件；有些则是你自己的应用程序使用的私有类型，例如我自己定义一个 .lvyi 扩展名的文件类型。

我们会关联这些广泛使用的类型可能是因为我们自己写了一个自己的文本编辑器，于是我们会关联 .txt 或者 .md 类型。而我们关联自定义的文件类型是因为我们需要为我们自己的应用生态产生一些文件数据。

那么问题来了，我怎么知道我现在准备使用的扩展名是不是已经被广泛使用的公共类型呢？请进入此网站查看：[Media Types](http://www.iana.org/assignments/media-types/media-types.xhtml)。

### 注册一个文件类型

要在 Windows 系统上注册一个文件类型，你需要做三个步骤：

1. 取一个应用程序标识符（[ProgID](https://docs.microsoft.com/en-us/windows/desktop/shell/fa-progids)）
1. 在注册表中添加文件关联（用于告知 Windows 这个文件已经被关联）
1. 为关联的程序添加谓词（用于打开这个文件）

#### 取一个应用程序标识符

没错，我说的就是取名字，而且要求在 Windows 系统上全局唯一；所以这里取名字也是有讲究的。关于应用程序标识符的相关内容，可以阅读微软的官方文档：[Programmatic Identifiers - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/shell/fa-progids)。

微软建议的 ProgID 的取名方式是这样的：

```text
厂商名.应用名.版本号
```

这里的版本号通常是指的大版本号。例如版本号为 `1.6.0.97` 的应用，通常只取第一位，即 `1`。一个典型的建议的取名示例是这样的：

```text
Walterlv.Foo.1
```

还是看微软自己的命名示例会更权威一点：

![来自微软的 ProgID 命名示例](/static/posts/2019-03-02-20-10-03.png)

竟然取一个名字也能写这么多篇幅，看来程序员的命名果然是世界上的一大难题呀！赶紧试用一下我的命名神器吧 —— [点击下载](ms-windows-store://pdp/?productid=9P8LNZRNJX85)，其原理可阅读 [冷算法：自动生成代码标识符（类名、方法名、变量名） - 吕毅](https://walterlv.com/post/algorithm-of-generating-random-identifiers.html)。

#### 在注册表中添加文件关联

你需要在注册表的 `HKEY_LOCAL_MACHINE\Software\Classes` 或者 `HKEY_CURRENT_USER\Software\Classes` 添加一些子键：

```text
HKEY_CURRENT_USER\Software\Classes
    .walv
        (Default) = Walterlv.Foo.1
    .lvyi
        (Default) = Walterlv.Foo.1
    Walterlv.Foo.1
        (Default) = 吕毅的示例文件
        shell
            open
                command
                    (Default) = C:\Users\lvyi\AppData\Local\Walterlv.Foo\walterlv.exe "%1"
                      
```

前面的 `.walv` 和 `lvyi` 是我自己定义的两种文件类型，我将它们的 `(Default)` 值设置成 `Walterlv.Foo.1`；而 `Walterlv.Foo.1` 就是前面说的应用程序标识符（ProgID）。后面的又新建了一个 `Walterlv.Foo.1` 的键，其 `(Default)` 值设置成了我们这个应用关联时使用的名称，也就是资源管理器中显示这个文件的时候使用的名称。

![在注册表中的 Walterlv.Foo.1](/static/posts/2019-03-02-20-51-54.png)

**关于注册表路径的说明**：

`HKEY_LOCAL_MACHINE` 主键是此计算机上的所有用户共享的注册表键值，而 `HKEY_CURRENT_USER` 是当前用户使用的注册表键值。而我们在注册表的 `HKEY_CLASSES_ROOT` 中也可以看到跟 `HKEY_LOCAL_MACHINE\Software\Classes` 和 `HKEY_CURRENT_USER\Software\Classes` 中一样的文件关联项，是因为 `HKEY_CLASSES_ROOT` 是 `HKEY_LOCAL_MACHINE\Software\Classes` 和 `HKEY_CURRENT_USER\Software\Classes` 合并之后的一个视图，其中用户键值会覆盖此计算机上的相同键值。

也就是说，如果你试图修改文件关联，那么需要去 `HKEY_LOCAL_MACHINE\Software\Classes` 和 `HKEY_CURRENT_USER\Software\Classes` 中，但如果只是去查看文件关联的情况，则只需要去 `HKEY_CLASSES_ROOT` 中。

写入计算机范围内的注册表项需要管理员权限，而写入用户范围内的注册表项不需要管理员权限；你可以酌情选用。

#### 为关联的程序添加谓词

我们需要为关联的程序添加谓词才能够使用我们的程序打开这个文件。通常进行文件关联时最常用的谓词是 `open`，添加路径为 `HKEY_CURRENT_USER\Software\Classes\Walterlv.Foo.1\shell\Open\Command`。添加后，我们可以在文件资源管理器中通过双击打开这个文件。

```text
Walterlv.Foo.1
    (Default) = 吕毅的示例文件
    shell
        Open
            Command
                (Default) = C:\Users\lvyi\AppData\Local\Walterlv.Foo\walterlv.exe "%1"
```

其中路径后面的 `"%1"` 是文件资源管理器传入的参数，其实就是文件的完整路径。我们加上了引号是避免解析命令行的时候把包含空格的路径拆成了多个参数。

还可以添加其他谓词，有一些是预定义的谓词，你也可以随便写其他的谓词。另外，还可以定义文件的图标。

```text
Walterlv.Foo.1
    (Default) = 吕毅的示例文件
    DefaultIcon = "C:\Users\lvyi\AppData\Local\Walterlv.Foo\lvyi-icon.ico"
    shell
        Open
            Command
                (Default) = "C:\Users\lvyi\AppData\Local\Walterlv.Foo\walterlv.exe" "%1"
        Edit
            Command
                (Default) = C:\Users\lvyi\AppData\Local\Walterlv.Foo\walterlv.exe "%1" --edit
```

### 反注册文件类型

当你卸载你的程序的时候，需要反注册之前注册过的文件类型；而反注册的过程并不是把以上的过程完全反过来。

微软推荐我们只删除 ProgID 的键，而不删除文件扩展名的键；因为其他的程序可能已经关联了我们的文件扩展名。就算我们使用的是私有的格式，也有可能是我们程序的未来版本会关联这个扩展名。

### 一个完整的文件关联示例

```text
HKEY_CLASSES_ROOT
    .walv
        (Default) = Walterlv.Foo.1
    .lvyi
        (Default) = Walterlv.Foo.1
        Content Type = text/xml
    Walterlv.Foo.1
        (Default) = 吕毅的示例文件
        AlwaysShowExt = 1
        DefaultIcon = "C:\Users\lvyi\AppData\Local\Walterlv.Foo\lvyi-icon.ico"
        shell
            Open
                Command
                    (Default) = "C:\Users\lvyi\AppData\Local\Walterlv.Foo\walterlv.exe" "%1"
        Edit
            Command
                (Default) = C:\Users\lvyi\AppData\Local\Walterlv.Foo\walterlv.exe "%1" --edit
        用逗比的方式打开
            Command
                (Default) = C:\Users\lvyi\AppData\Local\Walterlv.Foo\walterlv.exe "%1" --doubi
```

---

#### 参考资料

- [File Types and File Associations - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/shell/fa-intro)
- [Programmatic Identifiers - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/shell/fa-progids)
- [Media Types](http://www.iana.org/assignments/media-types/media-types.xhtml)
