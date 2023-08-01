---
title: "在 Windows 上如何在启动程序时单独为这个程序指定环境变量，而不需要编写任何代码或脚本"
date: 2023-08-01 16:48:15 +0800
categories: windows
position: problem
coverImage: /static/posts/2023-08-01-16-46-50.png
---

有些程序没有内置提供代理的功能，但遵循环境变量中设置的代理。如果我们能有办法仅为这个特定的程序设置环境变量，那么我们就可以在不开启全局代理的情况下单独为这样的程序开启代理。

---

<div id="toc"></div>

## 设置环境变量开启代理

比如，Unity Hub 就是这样的一个程序。为了让它开启代理，我们可以在命令行中用这样的三句命令启动它：

```powershell
> cd "C:\Program Files\Unity Hub"
> set HTTP_PROXY=http://127.0.0.1:7778
> set HTTPS_PROXY=http://127.0.0.1:7778
> "Unity Hub.exe"
```

## 单独为程序设置环境变量的方法

如果，我们能用一句话就完成上面的三句命令，那么就可以直接在快捷方式中设置这个程序的代理了，不需要单独写一个脚本。

在这个问答中 [Launch Windows program with custom environment variable - Super User](https://superuser.com/a/424002/940098)，我获得了启发，用 CMD 代理启动。不过原回答中只设置了一条环境变量，我们需要稍作修改以设置两条环境变量。

### 一句命令

```powershell
C:\Windows\System32\cmd.exe /c "set HTTP_PROXY=http://127.0.0.1:7778 && set HTTPS_PROXY=http://127.0.0.1:7778 && start "Unity Hub Launcher" "C:\Program Files\Unity Hub\Unity Hub.exe""
```

- 这里的外层引号 `"` 是为了让整个后面的字符串不会被空格分隔
- 这里的内层引号则是为了让 cmd 代理执行的命令部分的每个参数不会被空格分隔
- 在 cmd 中，`&&` 用来连接两个命令

### 快捷方式

如果平时是通过快捷方式来启动程序的，那么只需要编辑此快捷方式的属性，将目标改为上面的命令即可。

![设置快捷方式](/static/posts/2023-08-01-16-46-50.png)

这样，整个程序的使用体验基本跟平时没有什么区别，但已经成功为它设置了代理。

---

**参考资料**

- [Launch Windows program with custom environment variable - Super User](https://superuser.com/a/424002/940098)

