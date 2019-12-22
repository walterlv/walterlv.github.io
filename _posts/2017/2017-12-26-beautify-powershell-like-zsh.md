---
title: "将美化进行到底，把 PowerShell 做成 oh-my-zsh 的样子"
publishDate: 2017-12-26 15:00:17 +0800
date: 2019-12-18 13:47:18 +0800
categories: windows powershell
---

不知你有没有看过 Linux 上 oh-my-zsh 的样子？看过之后你一定会惊叹，原来命令行还能这么玩！然而 Windows 下能这么玩吗？答案是可行的，接下来就来看看怎么玩。

[![借用了下 oh-my-zsh 的官网图片](/static/posts/2017-12-26-13-04-12.png)](https://github.com/robbyrussell/oh-my-zsh)

---

Windows 下我们用 oh-my-posh 在 PowerShell 中实现这样的效果。分以下三步走：

<p id="toc"></p>

## 安装 oh-my-posh

我们需要先以管理员权限启动 PowerShell，以便执行安装操作。（具体是在开始按钮上点击右键，选择“Windows PowerShell (管理员)”。）

![以管理员权限启动 PowerShell](/static/posts/2017-12-26-13-09-02.png)

然后，运行命令以安装 posh-git，这是 oh-my-posh 的依赖。

```powershell
Install-Module posh-git -Scope CurrentUser
```

如果此前没有安装 NuGet 提供程序，则此时会提示安装 NuGet；如果此前没有开启执行任意脚本，此处也会提示执行脚本。*如果没有权限执行脚本，可能需要先执行 `Set-ExecutionPolicy Bypass`。*

![Install-Module posh-git -Scope CurrentUser](/static/posts/2017-12-26-13-18-55.png)

![安装 NuGet 提供程序](/static/posts/2017-12-26-13-14-23.png)

![安装 posh-git](/static/posts/2017-12-26-13-17-03.png)

接下来，运行命令以安装 oh-my-posh 本身。

```powershell
Install-Module oh-my-posh -Scope CurrentUser
```

![Install-Module oh-my-posh -Scope CurrentUser](/static/posts/2017-12-26-13-18-16.png)

![安装 oh-my-posh](/static/posts/2017-12-26-13-17-16.png)

自此，oh-my-posh 安装完毕。

## 启用模组并设置主题

接下来，我们需要启用安装的模组。启用模组的命令是：

```powershell
Import-Module oh-my-posh
```

其实写本文主要就是想体验 zsh 的操作，并看看 git 文件夹的视觉效果。现在我们就试试，输入：

```powershell
Set-Theme
```

然后按一下空格，按一下 Tab。会发现这时已经可以用方向键来选择参数了！原生 PowerShell 可没有这个功能啊！

![选择主题](/static/posts/2017-12-26-13-27-38.png)

我们选择 `Agnoster` 主题。（这些主题都是 oh-my-posh 带给我们的。）

接下来我们看看 git 文件夹下的显示：

![git 文件夹的显示](/static/posts/2017-12-26-13-30-05.png)

并没有 zsh 那样的效果。——因为我们缺少专用的字体！

下一节我们会讲如何安装专为 zsh 效果设计的字体。

现在，我们需要让 PowerShell 每次启动的时候都能够加载这个模组，所以我们需要设置 profile 文件让它自动启用。

敲 `$profile` 可以让 PowerShell 告诉我们这个文件的路径是什么。当然下图是我的路径，读者的默认在文档路径里的 PowerShell 文件夹下。

![profile 文件路径](/static/posts/2017-12-26-13-21-46.png)

我们需要编辑这个文件（如果没有，手动创建一个），然后在里面写下那一句话：

```powershell
Import-Module oh-my-posh
Set-Theme Paradox
```

![在个人配置文件中的内容](/static/posts/2019-12-18-13-36-33.png)

接下来，新打开 PowerShell（不需要管理员权限）时就会提示加载了这个文件：

![加载个人及系统配置文件](/static/posts/2017-12-26-13-24-35.png)

## 安装字体/安装第三方 PowerShell

！！！**重要说明：给 PowerShell 定制字体是一件非常困难的事情，非常困难！！！** *可参见 [自定义 Windows PowerShell 和 cmd 的字体](/post/customize-fonts-of-command-window) 感受一下。* **所以，这里更倾向于在安装了字体的情况下使用第三方 PowerShell。**

比如下图是我用 vscode 中带的 PowerShell 的效果。

![PowerShell in vscode](/static/posts/2017-12-26-15-01-52.png)

推荐的其他 PowerShell：

- [ConEmu](https://www.fosshub.com/ConEmu.html)
- [cmder - Console Emulator](http://cmder.net/)

但是，如果你执意要跑原生 PowerShell，那也不是没有办法，你可以使用 PowerLine 专为 PowerShell 和 zsh 设计的字体，它们的字体是可以完美跑到 PowerShell 和 PowerShell Core 中的。

下图是我在 PowerShell Core 中的运行效果：

![PowerLine 字体效果](/static/posts/2019-12-18-13-47-07.png)

请在这里下载 PowerLine 字体：

- [powerline/fonts: Patched fonts for Powerline users.](https://github.com/powerline/fonts)

方法是克隆这个仓库，然后在克隆出来的文件夹中找到 Install.ps1 文件，执行它，会发现它会自动为我们安装所有的 PowerLine 字体。

![Install.ps1](/static/posts/2019-12-18-13-39-31.png)

![安装所有的字体](/static/posts/2019-12-18-13-41-05.png)

安装完成之后，在 PowerShell 或者 PowerShell Core 的标题栏上右击选择“属性”，然后选择你想要设置的字体就可以立刻看到效果了。注意，PowerLine 字体都是带有 for PowerLine 后缀的。

![设置字体](/static/posts/2019-12-18-13-45-44.png)

PowerLine 字体官方文档在这里：[Overview — Powerline beta documentation](https://powerline.readthedocs.io/en/master/overview.html)。

![官方文档中的 PowerLine 字体截图](/static/posts/2017-12-26-13-38-19.png)  
▲ 官方文档中的 PowerLine 字体截图

- 官方字体的下载链接：[powerline/fonts: Patched fonts for Powerline users.](https://github.com/powerline/fonts)
- 官方字体的看图预览：[fonts/All.md at master · powerline/fonts](https://github.com/powerline/fonts/blob/master/samples/All.md)

---

**参考资料**

- [powerline/fonts: Patched fonts for Powerline users.](https://github.com/powerline/fonts)
- [Overview — Powerline beta documentation](https://powerline.readthedocs.io/en/master/overview.html)
