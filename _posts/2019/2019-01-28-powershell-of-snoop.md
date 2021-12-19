---
title: "在 Snoop 中使用 PowerShell 脚本进行更高级的 UI 调试"
publishDate: 2019-01-28 23:01:02 +0800
date: 2019-03-09 09:11:47 +0800
tags: wpf dotnet powershell
position: knowledge
coverImage: /static/posts/2019-01-28-22-21-02.png
---

在 WPF 开发时，有 Snoop 的帮助，UI 的调试将变得非常轻松。使用 Snoop，能轻松地查看 WPF 中控件的可视化树以及每一个 Visual 节点的各种属性，或者查看数据上下文，或者监听查看事件的引发。

不过，更强大的是支持使用 PowerShell 脚本。这使得它即便 UI 没有给你提供一些入口，你也能通过各种方式查看或者修改 UI。

---

<div id="toc"></div>

## Snoop PowerShell 入口

常规 Snoop 的使用方法，将狮子瞄准镜拖出来对准要调试 UI 的 WPF 窗口松开。这里我拿 Visual Studio 2019 的窗口做试验。

![调试 Visual Studio 2019 的 UI](/static/posts/2019-01-28-22-21-02.png)

在打开的新的 Snoop 窗口中我们打开 PowerShell 标签。

![打开 PowerShell 标签](/static/posts/2019-01-28-22-22-54.png)

本文的内容将从这里开始。

## 自带的 PowerShell 变量

在 Snoop 的 PowerShell 提示窗口中，我们可以得知有两个变量可以使用：`$root` 和 `$selected`。包含这两个，还有其他的可以使用：

- `$root` 拿到当前 Snoop 窗口顶层元素类型的实例
- `$selected` 拿到当前 Snoop 用鼠标或键盘选中的元素的实例
- `$parent` 拿到当前 Snoop 选中元素的可视化树父级
- `$null` 就是 .NET 中的 null

当然，你也可以定义和使用其他的变量，后面会说。

![`$root`](/static/posts/2019-01-28-22-25-49.png)

![`$selected`](/static/posts/2019-01-28-22-28-19.png)

## 基本的 PowerShell 命令

### 属性

```powershell
# 获取属性
$selected.Visual.Content
```

```powershell
# 将属性设置为 null
$selected.Visual.Content = $null
```

直接像 C# 语法那样一直在后面使用 `.` 可以访问实例中的属性。不需要关心实例是什么类型的，只要拥有那个属性，就可以访问到。

比如下面，上面的例子我们选中的是 `MainWindow`，于是我们使用 `$selected.Visual.Content` 访问到 `MainWindow` 的 `Content` 属性，而后面 `$selected.Visual.Content = $null` 则是将 `Window` 的内容清空了。

![获取 Content 属性](/static/posts/2019-01-28-22-42-44.png)

![设置 Content 属性](/static/posts/2019-01-28-snoop-powershell-content-to-null.gif)

### 创建对象

```powershell
# 创建对象
$button = New-Object System.Windows.Controls.Button -property @{ Content = "欢迎访问 blog.walterlv.com" }
```

![创建一个 Button](/static/posts/2019-01-28-22-53-34.png)

### 调用方法

```powershell
$selected.Visual.Children.Add($button)
```

顶部的那个按钮就是通过上面的命令添加上去的。

![调用实例方法](/static/posts/2019-01-28-22-55-42.png)

调用静态方法用的是 `[类名]::方法名(参数)`

```powershell
$button.Content = [System.Environment]::Version.ToString() + " running for blog.walterlv.com"
```

![调用静态方法](/static/posts/2019-01-28-22-59-55.png)

---

**参考资料**

- [Snooping WPF: Tips and PowerShell tricks](https://blog.scottlogic.com/2013/12/18/wpf-snoop-powershell.html)

