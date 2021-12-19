---
title: "cmd.exe 的命令行启动参数（可用于执行命令、传参或进行环境配置）"
publishDate: 2019-05-12 13:06:46 +0800
date: 2019-05-25 09:50:48 +0800
tags: windows powershell
position: knowledge
coverImage: /static/posts/2019-05-12-12-48-57.png
permalink: /posts/cmd-startup-arguments.html
---

有一些程序不支持被直接启动，而要求通过命令行启动。这个时候，你就需要使用 cmd.exe 来启动这样的程序。我们都知道如何在 cmd.exe 中启动一个程序，但是当你需要自动启动这个程序的时候，你就需要知道如何通过 cmd.exe 来启动一个程序，而不是手工输入然后回车运行了。

本文就介绍 cmd.exe 的命令行启动参数。利用这些参数，你可以自动化地通过 cmd.exe 程序来完成一些原本需要通过手工执行的操作或者突破一些限制。

---

<div id="toc"></div>

## 一些必须通过命令行启动的程序

一般来说，编译生成的 exe 程序都可以直接启动，即便是命令行程序也是如此。但是有一些程序就是要做一些限制。比如下面的 FRP 反向代理程序：

![FRP 反向代理程序限制必须从命令行启动](/static/posts/2019-05-12-12-48-57.png)

那么我们如何能够借助于 cmd.exe 来启动它呢？接下来说明。

顺便，使用 PowerShell 来启动的方法可以参见我的另一篇博客：

- [PowerShell 的命令行启动参数（可用于执行命令、传参或进行环境配置） - 吕毅](/post/powershell-startup-arguments)

## cmd.exe 的帮助文档

先打开一个 cmd，然后输入：

```powershell
> cmd /?
```

你就可以看到 cmd.exe 的使用说明：

![cmd.exe 的使用说明](/static/posts/2019-05-12-12-54-33.png)

> 启动 Windows 命令解释器的一个新实例
> 
> ```powershell
> CMD [/A | /U] [/Q] [/D] [/E:ON | /E:OFF] [/F:ON | /F:OFF] [/V:ON | /V:OFF]
>     [[/S] [/C | /K] string]
> ```

你可以随时输入上面的 `cmd /?` 命令来查看这些参数详细说明，所以本文不会非常详细地列举各个参数的含义，只会列出一些常见的使用示例。

## cmd.exe 的启动参数示例

### 使用 cmd.exe 间接启动一个程序并传入参数

下面的命令，使用 cmd 间接启动 frpc.exe 反向代理程序，并给 frpc.exe 程序传入 `-c ./frpc.ini` 的启动参数：

```powershell
> cmd /c D:\walterlv\frp\frpc.exe -c ./frpc.ini
```

关于为什么会用这种方式启动 frpc.exe，则是为了设置 frpc.exe 为开机自动启动。

因为我写了一些 Asp.NET Core 的服务，详见：

- [dotnet core 通过 frp 发布自己的网站 - 林德熙](https://blog.lindexi.com/post/dotnet-core-通过-frp-发布自己的网站.html)

另外，间接启动一个程序的时候也可以传入 `/k` 参数。与 `/c` 参数不同的是：

- `/c` 在执行完程序之后，cmd.exe 也会终止
- `/k` 在执行完程序之后，cmd.exe 依然会继续运行

所以 `/c` 命令会更适用于自动化的脚本，而 `/k` 命令则更适用于半自动化的脚本。

## cmd.exe 启动参数使用中的坑

在上面的例子中，我们的路径中不涉及到空格。我们知道，路径中有空格的话，在命令行中使用需要加上引号。但实际上如果你真的给路径加上了引号，会发现 cmd.exe 就开始不识别你的命令路径了。

这个时候，你需要在整个传给 cmd.exe 的命令外层再加一层引号：

```powershell
> cmd /c " "D:\walterlv folders\frp\frpc.exe" -c ./frpc.ini "
```

以上，感谢 [林德熙](https://blog.lindexi.com/) 挥泪踩出来的坑，详见：

- [如何在 CMD 启动的软件传入带空格的路径 - 林德熙](https://blog.lindexi.com/post/%E5%A6%82%E4%BD%95%E5%9C%A8-cmd-%E5%90%AF%E5%8A%A8%E7%9A%84%E8%BD%AF%E4%BB%B6%E4%BC%A0%E5%85%A5%E5%B8%A6%E7%A9%BA%E6%A0%BC%E7%9A%84%E8%B7%AF%E5%BE%84)

## 附 cmd.exe 的全部启动参数说明

> 启动 Windows 命令解释器的一个新实例
> 
> ```powershell
> CMD [/A | /U] [/Q] [/D] [/E:ON | /E:OFF] [/F:ON | /F:OFF] [/V:ON | /V:OFF]
>     [[/S] [/C | /K] string]
> ```
> 
> /C      执行字符串指定的命令然后终止
> /K      执行字符串指定的命令但保留
> /S      修改 /C 或 /K 之后的字符串处理(见下)
> /Q      关闭回显
> /D      禁止从注册表执行 AutoRun 命令(见下)
> /A      使向管道或文件的内部命令输出成为 ANSI
> /U      使向管道或文件的内部命令输出成为
>         Unicode
> /T:fg   设置前台/背景颜色(详细信息见 COLOR /?)
> /E:ON   启用命令扩展(见下)
> /E:OFF  禁用命令扩展(见下)
> /F:ON   启用文件和目录名完成字符(见下)
> /F:OFF  禁用文件和目录名完成字符(见下)
> /V:ON   使用 ! 作为分隔符启用延迟的环境变量
>         扩展。例如，/V:ON 会允许 !var! 在执行时
>         扩展变量 var。var 语法会在输入时
>         扩展变量，这与在一个 FOR
>         循环内不同。
> /V:OFF  禁用延迟的环境扩展。
> 
> 注意，如果字符串加有引号，可以接受用命令分隔符 "&&"
> 分隔多个命令。另外，由于兼容性
> 原因，/X 与 /E:ON 相同，/Y 与 /E:OFF 相同，且 /R 与
> /C 相同。任何其他开关都将被忽略。
> 
> 如果指定了 /C 或 /K，则会将该开关之后的
> 命令行的剩余部分作为一个命令行处理，其中，会使用下列逻辑
> 处理引号(")字符:
> 
>     1.  如果符合下列所有条件，则会保留
>         命令行上的引号字符:
> 
>         - 不带 /S 开关
>         - 正好两个引号字符
>         - 在两个引号字符之间无任何特殊字符，
>           特殊字符指下列字符: &<>()@^|
>         - 在两个引号字符之间至少有
>           一个空格字符
>         - 在两个引号字符之间的字符串是某个
>           可执行文件的名称。
> 
>     2.  否则，老办法是看第一个字符
>         是否是引号字符，如果是，则去掉首字符并
>         删除命令行上最后一个引号，保留
>         最后一个引号之后的所有文本。
> 
> 如果 /D 未在命令行上被指定，当 CMD.EXE 开始时，它会寻找
> 以下 REG_SZ/REG_EXPAND_SZ 注册表变量。如果其中一个或
> 两个都存在，这两个变量会先被执行。
> 
>     HKEY_LOCAL_MACHINE\Software\Microsoft\Command Processor\AutoRun
> 
>         和/或
> 
>     HKEY_CURRENT_USER\Software\Microsoft\Command Processor\AutoRun
> 
> 命令扩展是按默认值启用的。你也可以使用 /E:OFF ，为某一
> 特定调用而停用扩展。你
> 可以在机器上和/或用户登录会话上
> 启用或停用 CMD.EXE 所有调用的扩展，这要通过设置使用
> REGEDIT.EXE 的注册表中的一个或两个 REG_DWORD 值:
> 
>     HKEY_LOCAL_MACHINE\Software\Microsoft\Command Processor\EnableExtensions
> 
>         和/或
> 
>     HKEY_CURRENT_USER\Software\Microsoft\Command Processor\EnableExtensions
> 
> 到 0x1 或 0x0。用户特定设置
> 比机器设置有优先权。命令行
> 开关比注册表设置有优先权。
> 
> 在批处理文件中，SETLOCAL ENABLEEXTENSIONS 或 DISABLEEXTENSIONS 参数
> 比 /E:ON 或 /E:OFF 开关有优先权。请参阅 SETLOCAL /? 获取详细信息。
> 
> 命令扩展包括对下列命令所做的
> 更改和/或添加:
> 
>     DEL or ERASE
>     COLOR
>     CD or CHDIR
>     MD or MKDIR
>     PROMPT
>     PUSHD
>     POPD
>     SET
>     SETLOCAL
>     ENDLOCAL
>     IF
>     FOR
>     CALL
>     SHIFT
>     GOTO
>     START (同时包括对外部命令调用所做的更改)
>     ASSOC
>     FTYPE
> 
> 有关特定详细信息，请键入 commandname /? 查看。
> 
> 延迟环境变量扩展不按默认值启用。你
> 可以用/V:ON 或 /V:OFF 开关，为 CMD.EXE 的某个调用而
> 启用或停用延迟环境变量扩展。你
> 可以在机器上和/或用户登录会话上启用或停用 CMD.EXE 所有
> 调用的延迟扩展，这要通过设置使用 REGEDIT.EXE 的注册表中的
> 一个或两个 REG_DWORD 值:
> 
>     HKEY_LOCAL_MACHINE\Software\Microsoft\Command Processor\DelayedExpansion
> 
>         和/或
> 
>     HKEY_CURRENT_USER\Software\Microsoft\Command Processor\DelayedExpansion
> 
> 到 0x1 或 0x0。用户特定设置
> 比机器设置有优先权。命令行开关
> 比注册表设置有优先权。
> 
> 在批处理文件中，SETLOCAL ENABLEDELAYEDEXPANSION 或 DISABLEDELAYEDEXPANSION
> 参数比 /V:ON 或 /V:OFF 开关有优先权。请参阅 SETLOCAL /?
> 获取详细信息。
> 
> 如果延迟环境变量扩展被启用，
> 惊叹号字符可在执行时间被用来
> 代替一个环境变量的数值。
> 
> 你可以用 /F:ON 或 /F:OFF 开关为 CMD.EXE 的某个
> 调用而启用或禁用文件名完成。你可以在计算上和/或
> 用户登录会话上启用或禁用 CMD.EXE 所有调用的完成，
> 这可以通过使用 REGEDIT.EXE 设置注册表中的下列
>  REG_DWORD 的全部或其中之一:
> 
>     HKEY_LOCAL_MACHINE\Software\Microsoft\Command Processor\CompletionChar
>     HKEY_LOCAL_MACHINE\Software\Microsoft\Command Processor\PathCompletionChar
> 
>         和/或
> 
>     HKEY_CURRENT_USER\Software\Microsoft\Command Processor\CompletionChar
>     HKEY_CURRENT_USER\Software\Microsoft\Command Processor\PathCompletionChar
> 
> 由一个控制字符的十六进制值作为一个特定参数(例如，0x4
> 是Ctrl-D，0x6 是 Ctrl-F)。用户特定设置优先于机器设置。
> 命令行开关优先于注册表设置。
> 
> 如果完成是用 /F:ON 开关启用的，两个要使用的控制符是:
> 目录名完成用 Ctrl-D，文件名完成用 Ctrl-F。要停用
> 注册表中的某个字符，请用空格(0x20)的数值，因为此字符
> 不是控制字符。
> 
> 如果键入两个控制字符中的一个，完成会被调用。完成功能将
> 路径字符串带到光标的左边，如果没有通配符，将通配符附加
> 到左边，并建立相符的路径列表。然后，显示第一个相符的路
> 径。如果没有相符的路径，则发出嘟嘟声，不影响显示。之后，
> 重复按同一个控制字符会循环显示相符路径的列表。将 Shift
> 键跟控制字符同时按下，会倒着显示列表。如果对该行进行了
> 任何编辑，并再次按下控制字符，保存的相符路径的列表会被
> 丢弃，新的会被生成。如果在文件和目录名完成之间切换，会
> 发生同样现象。两个控制字符之间的唯一区别是文件完成字符
> 符合文件和目录名，而目录完成字符只符合目录名。如果文件
> 完成被用于内置式目录命令(CD、MD 或 RD)，就会使用目录
> 完成。
> 用引号将相符路径括起来，完成代码可以正确处理含有空格
> 或其他特殊字符的文件名。同时，如果备份，然后从行内调用
> 文件完成，完成被调用时位于光标右方的文字会被调用。
> 
> 需要引号的特殊字符是:
>      `<space>`
>      `()[]{}^=;!'+,`~(&()`


