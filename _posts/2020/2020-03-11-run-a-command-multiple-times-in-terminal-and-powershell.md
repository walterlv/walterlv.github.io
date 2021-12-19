---
title: "如何在终端和 PowerShell 中将一个命令自动重复执行多次"
date: 2020-03-11 16:26:03 +0800
tags: windows powershell
position: starter
---

你可能有很多原因要将一个命令重复执行多次，本文介绍在多个平台下如何多次重复执行命令。

---

<div id="toc"></div>

## 背景

最近遇到一个偶然复现的单元测试错误，于是在每次运行时，打算重复运行多次来调查问题是否已经解决。

实际上，重复执行命令有更多用途：

1. 通过重复执行来复现一些偶发的问题
1. 执行一组命令，每次只有参数不同
1. 大大减轻手工输入命令的工作量

## Bash

Linux 或者 Mac 系统的终端中，可以使用 `for` 来完成重复执行命令，使用 `${}` 来引用定义的变量。

```bash
for i in {1..10}; do echo ${i}; done
```

这表示从 1 到 10（两端的值都会取到），依次输出这些数。

比如，我们需要运行 100 次单元测试，那么：

```bash
walterlv@localhost:~$ for i in {1..100}; do dotnet test ./Walterlv.Tests.dll; done
Microsoft (R) 测试执行命令行工具版本 16.3.0
版权所有 (C) Microsoft Corporation。保留所有权利。
正在启动测试执行，请稍候...

总共 1 个测试文件与指定模式相匹配。

测试运行成功。
测试总数: 238
     通过数: 238
总时间: 1.6384 秒
Microsoft (R) 测试执行命令行工具版本 16.3.0
版权所有 (C) Microsoft Corporation。保留所有权利。
正在启动测试执行，请稍候...

总共 1 个测试文件与指定模式相匹配。

测试运行成功。
测试总数: 238
     通过数: 238
总时间: 1.7138 秒
...
```

## PowerShell

PowerShell Core 是跨平台的配置框架，可以在 Windows/Linux/Mac 系统下使用。在 PowerShell 中，也可以使用 `for`：

```powershell
for ($i=1; $i -le 10; $i++) { echo $i }
```

这表示从 1 到 10（两端的值都会取到），依次输出这些数。

比如，我们需要运行 100 次单元测试，那么：

```powershell
PS C:\Users\lvyi> for ($i=1; $i -le 100; $i++) { dotnet test .\Walterlv.Tests.dll }
Microsoft (R) 测试执行命令行工具版本 16.3.0
版权所有 (C) Microsoft Corporation。保留所有权利。
正在启动测试执行，请稍候...

总共 1 个测试文件与指定模式相匹配。

测试运行成功。
测试总数: 238
     通过数: 238
总时间: 1.6384 秒
Microsoft (R) 测试执行命令行工具版本 16.3.0
版权所有 (C) Microsoft Corporation。保留所有权利。
正在启动测试执行，请稍候...

总共 1 个测试文件与指定模式相匹配。

测试运行成功。
测试总数: 238
     通过数: 238
总时间: 1.7138 秒
...
```

---

**参考资料**

- [How To Run a Command Multiple Times in Terminal and PowerShell](https://medium.com/better-programming/how-to-run-a-command-multiple-times-in-terminal-and-powershell-5af76df8d123)
