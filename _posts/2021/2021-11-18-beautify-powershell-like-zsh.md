---
title: "将美化进行到底，使用 Oh My Posh 把 PowerShell 做成 oh-my-zsh 的样子"
publishDate: 2017-12-26 15:00:17 +0800
date: 2021-11-22 16:35:33 +0800
tags: windows powershell
position: starter
image:
  src: /static/posts/2021-11-18-12-16-48.png
---

不知你有没有看过 Linux 上 oh-my-zsh 的样子？看过之后你一定会惊叹，原来命令行还能这么玩！然而 Windows 下能这么玩吗？答案是可行的，接下来就来看看怎么玩。

---

Windows 下我们用 Oh My Posh 在 PowerShell 中实现这样的效果。先放一张我的美化效果图：

![美化效果](/static/posts/2021-11-18-12-16-48.png)

接下来，我们用三个步骤完成这样的美化。

<p id="toc"></p>

## 第零步：挑选一个终端

鉴于无论是 PowerShell (Windows) 还是 PowerShell (Core) 都无法直接获得本文所述的效果，所以强烈建议在开始之前准备一个专门的终端，比如：

* [Windows Terminal](https://www.microsoft.com/store/productId/9N0DX20HK701) (Windows 自带)
* [Fluent Terminal](https://www.microsoft.com/store/productId/9P2KRLMFXF9T) (流畅设计的终端)
- [ConEmu](https://www.fosshub.com/ConEmu.html)
- [cmder - Console Emulator](http://cmder.net/)

无论你选了哪一个，当你设置好后，会在所有终端中生效，包括 Visual Studio、Visual Studio Code 中内嵌的终端。

另外，如果你从来没有在你的电脑上折腾过终端，那么可能还需要额外去应用商店安装一下 [PowerShell](https://www.microsoft.com/store/productId/9MZ1SNWT0N5D) 的 .NET 版本（不装的话，默认是 Windows PowerShell，版本会旧一些）：

![应用商店中的 PowerShell](/static/posts/2021-11-18-11-50-24.png)

## 第一步：安装 Oh My Posh

先启动你主用的终端（本文将以 Windows Terminal 为例），然后输入如下安装命令：

```powershell
Install-Module oh-my-posh -Scope CurrentUser
```

![安装 Oh My Posh](/static/posts/2021-11-18-11-59-00.png)

如果中途提示是否允许安装，输入 `Y` 继续就好了。

## 第二步：启用 Oh My Posh

在安装完后，输入并执行 `Get-PoshThemes` 命令便可以浏览 Oh My Posh 自带的几十款主题（同时也能验证装好了）。只可惜你会发现主题里有大量的“□□”字，这个我们在第三步里会推荐一些字体供你挑选。

![确认已安装](/static/posts/2021-11-18-12-02-03.png)

还需要做一件重要的事情，我们要让每次新启动 PowerShell 时都自动启用此模组，否则等你下次打开终端时就没有任何效果了。

输入 `$PROFILE` 查询你的 PowerShell Profile 文件位置：

![寻找 PowerShell Proile 文件](/static/posts/2021-11-18-12-07-37.png)

去对应的文件夹找一下这个文件（Microsoft.PowerShell_profile.ps1）。如果你没有这个文件，就新建一个，文件里面编写如下内容：

```powershell
Import-Module oh-my-posh
Set-PoshPrompt agnoster
```

这里的 `agnoster` 是刚刚 `Get-PoshThemes` 主题列表里的第一个。因为我们还没有装好字体，现在格式混乱，所以也很难挑选真正喜爱的主题。

至此，Oh My Posh 模组已经可以在每次启动 PowerShell 时自动加载了。

![自动加载了 Oh My Posh 模组](/static/posts/2021-11-18-12-12-27.png)

## 第三步：安装字体、挑选主题

关于字体，小提一下：如果你直接使用 PowerShell 而不使用终端的话，字体的定制会非常麻烦，可参见 [自定义 Windows PowerShell 和 cmd 的字体](/post/customize-fonts-of-command-window) 感受一下。所以还是需要强调一下本文开头的部分，建议选一款终端操作以较少调试上的痛苦。

字体可以在这些地方挑选：

* [Nerd Fonts - Iconic font aggregator, glyphs/icons collection, & fonts patcher](https://www.nerdfonts.com/font-downloads)  
    ▲ 推荐，支持 Oh My Posh 需要的各种图标
* [powerline/fonts: Patched fonts for Powerline users.](https://github.com/powerline/fonts)  
    ▲ 基本能呈现 PowerLine 效果，但图标较少，可选的主题较少

对于 Nerd Fonts，去网站上挑选一款字体，点击“Download”下载、解压、右键全选安装即可，就像安装其他任何字体一样。*对于 PowerLine Fonts，克隆仓库，找到 Install.ps1 文件并执行它即可安装。*

这里，我选了 Nerd Fonts 系的 Fira Code NF 字体，直接安装。接着，去终端里面为 PowerShell 选择刚安装好的字体，点击保存。（如果终端里看不到新安装的字体，请重启终端。）

![选择字体](/static/posts/2021-11-18-12-31-01.png)

接下来就是见证奇迹的时刻——新启动一个终端：

![更换了 Fira Code NF 字体后新启动的终端](/static/posts/2021-11-18-12-55-51.png)

重新输入 `Get-PoshThemes` 再预览主题，然后挑选一个。挑好后，去修改 Microsoft.PowerShell_profile.ps1 文件内容，换主题名。

![挑选主题](/static/posts/2021-11-18-12-56-52.png)

这里，我选了 `iterm2`，于是就有了本文一开始的美化效果了。同样，在 Visual Studio Code 里设置一下终端字体也可以在 Visual Studio Code 里看到相同的效果：

![在 Visual Studio Code 里的效果](/static/posts/2021-11-18-13-03-12.png)

主题在这个文件夹下，可以自行编辑：

* `~\Documents\PowerShell\Modules\oh-my-posh\<版本号>\themes`  
    ▲ 如果你用的是 Windows PowerShell 而不是 PowerShell，可用 `$PROFILE` 查询一下跟目录

[S0cialEngineering - 灰色铅笔的彩色世界。](https://github.com/S0cialEngineering) 基于自带的 iterm2 魔改了一个 iterm3 主题，他授权我在这里分流提供给大家下载。我觉得非常好看，就白瞟了。

* [下载 iterm3.omp.json](/static/attachments/oh-my-posh/themes/iterm3.omp.json)

效果如下：

![iterm3.omp.json 效果](/static/posts/2021-11-19-15-37-29.png)

---

**参考资料**

- [Nerd Fonts - Iconic font aggregator, glyphs/icons collection, & fonts patcher](https://www.nerdfonts.com/)
- [powerline/fonts: Patched fonts for Powerline users.](https://github.com/powerline/fonts)
- [Overview — Powerline beta documentation](https://powerline.readthedocs.io/en/master/overview.html)
