---
title: "PowerShell 的命令行启动参数（可用于执行命令、传参或进行环境配置）"
date: 2019-05-12 15:05:23 +0800
categories: windows powershell
position: knowledge
---

有一些程序不支持被直接启动，而要求通过命令行启动。这个时候，你就需要使用 PowerShell 或者 PowerShell Core 来启动这样的程序。我们都知道如何在命令行或各种终端中启动一个程序，但是当你需要自动启动这个程序的时候，你就需要知道如何通过 PowerShell 或其他命令行终端来启动一个程序，而不是手工输入然后回车运行了。

本文就介绍 PowerShell 的命令行启动参数。利用这些参数，你可以自动化地通过 PowerShell 程序来完成一些原本需要通过手工执行的操作或者突破一些限制。

---

<div id="toc"></div>

## 一些必须通过命令行启动的程序

一般来说，编译生成的 exe 程序都可以直接启动，即便是命令行程序也是如此。但是有一些程序就是要做一些限制。比如下面的 FRP 反向代理程序：

![FRP 反向代理程序限制必须从命令行启动](/static/posts/2019-05-12-12-48-57.png)

借助 cmd.exe 来启动的方法可以参见我的另一篇博客：

- [cmd.exe 的命令行启动参数（可用于执行命令、传参或进行环境配置） - 吕毅](/post/cmd-startup-arguments.html)

那么我们如何能够借助于 PowerShell 或者 PowerShell 来启动它呢？

## PowerShell 的帮助文档

先打开一个 PowerShell。

对于 Windows 自带的基于 .NET Framework 的 PowerShell，使用 `powershell` 命令可以直接启动 PowerShell。对于基于 .NET Core 版本的 PowerShell Core，使用 `pwsh` 命令可以直接启动。

关于 .NET Core 版本的 PowerShell Core 可以参见我的另一篇博客：

- [安装和运行 .NET Core 版本的 PowerShell - 吕毅](/post/install-and-run-powershell-core.html)

接下来输入下面三个命令中的任何一个：

- `PowerShell -Help`
- `PowerShell -?`
- `PowerShell /?`

或者对于 PowerShell Core 来说，是下面三个命令中的任何一个：

- `pwsh -Help`
- `pwsh -?`
- `pwsh /?`

你就可以看到 PowerShell 的使用说明：

![PowerShell 的使用说明](/static/posts/2019-05-12-14-55-11.png)

## PowerShell 的启动参数示例

### 使用 PowerShell 间接启动一个程序并传入参数

下面的命令，使用 PowerShell 间接启动 frpc.exe 反向代理程序，并给 frpc.exe 程序传入 `-c ./frpc.ini` 的启动参数：

```powershell
> pwsh -Command "D:\walterlv\frpc.exe -c ./frpc.ini"
```

或者简写为：

```powershell
> pwsh -c "D:\walterlv\frpc.exe -c ./frpc.ini"
```

实际上使用 PowerShell 来做这些事情简直是用牛刀杀鸡，因为本身 PowerShell 非常强大。我们只是因为一些程序的限制不得不使用这样的方案来启动程序而已。

比如其中之一，执行脚本。

### 使用 PowerShell 间接执行一个脚本

```powershell
# Execute a PowerShell Command in a session
PowerShell -Command "Get-EventLog -LogName security"

# Run a script block in a session
PowerShell -Command {Get-EventLog -LogName security}

# An alternate way to run a command in a new session
PowerShell -Command "& {Get-EventLog -LogName security}"
```

## 附 PowerShell 的全部启动参数说明

> ```
> PowerShell[.exe] [-PSConsoleFile <文件> | -Version <版本>]
>     [-NoLogo] [-NoExit] [-Sta] [-Mta] [-NoProfile] [-NonInteractive]
>     [-InputFormat {Text | XML}] [-OutputFormat {Text | XML}]
>     [-WindowStyle <样式>] [-EncodedCommand <Base64 编码命令>]
>     [-ConfigurationName <字符串>]
>     [-File <文件路径> <参数>] [-ExecutionPolicy <执行策略>]
>     [-Command { - | <脚本块> [-args <参数数组>]
>                   | <字符串> [<命令参数>] } ]
> 
> PowerShell[.exe] -Help | -? | /?
> 
> -PSConsoleFile
>     加载指定的 Windows PowerShell 控制台文件。若要创建控制台
>     文件，请在 Windows PowerShell 中使用 Export-Console。
> 
> -Version
>     启动指定版本的 Windows PowerShell。
>     使用参数输入版本号，如 "-version 2.0"。
> 
> -NoLogo
>     启动时隐藏版权标志。
> 
> -NoExit
>     运行启动命令后不退出。
> 
> -Sta
>     使用单线程单元启动 shell。
>     单线程单元(STA)是默认值。
> 
> -Mta
>     使用多线程单元启动 shell。
> 
> -NoProfile
>     不加载 Windows PowerShell 配置文件。
> 
> -NonInteractive
>     不向用户显示交互式提示。
> 
> -InputFormat
>     描述发送到 Windows PowerShell 的数据的格式。有效值为
>     "Text" (文本字符串)或 "XML" (序列化的 CLIXML 格式)。
> 
> -OutputFormat
>     确定如何设置 Windows PowerShell 输出内容的格式。有效值
>     为 "Text" (文本字符串)或 "XML" (序列化的 CLIXML 格式)。
> 
> -WindowStyle
>     将窗口样式设置为 Normal、Minimized、Maximized 或 Hidden。
> 
> -EncodedCommand
>     接受 base-64 编码字符串版本的命令。使用此参数
>     向 Windows PowerShell 提交需要复杂引号
>     或大括号的命令。
> 
> -ConfigurationName
>     指定运行 Windows PowerShell 的配置终结点。
>     该终结点可以是在本地计算机上注册的任何终结点，包括
>     默认的 Windows PowerShell 远程处理终结点或具有特定用户角色功能
>     的自定义终结点。
> 
> -File
>     在本地作用域("dot-sourced")中运行指定的脚本，以便
>     脚本创建的函数和变量可以在当前
>     会话中使用。输入脚本文件路径和任何参数。
>     File 必须是命令中的最后一个参数，因为在 File 参数
>     名称后面键入的所有字符都将解释
>     为后跟脚本参数的脚本文件路径。
> 
> -ExecutionPolicy
>     设置当前会话的默认执行策略，并将其保存
>     在 $env:PSExecutionPolicyPreference 环境变量中。
>     该参数不会更改在注册表中
>     设置的 Windows PowerShell 执行策略。
> 
> -Command
>     执行指定的命令(和任何参数)，就好像它们是
>     在 Windows PowerShell 命令提示符下键入的一样，然后退出，除非
>     指定了 NoExit。Command 的值可以为 "-"、字符串或
>     脚本块。
> 
>     如果 Command 的值为 "-"，则从标准输入中读取
>     命令文本。
> 
>     如果 Command 的值为脚本块，则脚本块必须
>     用大括号({})括起来。只有在 Windows PowerShell 中运行 PowerShell.exe 时，
>     才能指定脚本块。脚本块的结果将作为反序列化的 XML 对象
>     (而非活动对象)返回到父 Shell。
> 
>     如果 Command 的值为字符串，则 Command 必须是命令中的
>     最后一个参数，因为在命令后面键入的所有字符
>     都将解释为命令参数。
> 
>     若要编写运行 Windows PowerShell 命令的字符串，请使用以下格式:
>         "& {<命令>}"
>     其中，引号表示一个字符串，调用运算符(&)
>     导致执行命令。
> 
> -Help, -?, /?
>     显示此消息。如果在 Windows PowerShell 中键入 PowerShell.exe
>     命令，请在命令参数前面添加连字符(-)，而不是添加正
>     斜杠(/)。你可以在 Cmd.exe 中使用连字符或正斜杠。
> 
> 示例
>     PowerShell -PSConsoleFile SqlSnapIn.Psc1
>     PowerShell -version 2.0 -NoLogo -InputFormat text -OutputFormat XML
>     PowerShell -ConfigurationName AdminRoles
>     PowerShell -Command {Get-EventLog -LogName security}
>     PowerShell -Command "& {Get-EventLog -LogName security}"
> 
>     # To use the -EncodedCommand parameter:
>     $command = 'dir "c:\program files" '
>     $bytes = [System.Text.Encoding]::Unicode.GetBytes($command)
>     $encodedCommand = [Convert]::ToBase64String($bytes)
>     powershell.exe -encodedCommand $encodedCommand
> ```
