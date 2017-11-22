---
title: "自定义 Windows PowerShell 和 cmd 的字体"
date: 2017-11-22 23:14:33 +0800
categories: windows powershell
---

Windows 系统下的命令行界面，字体要么是点阵字体，要么是宋体；但无论哪种，始终觉得难看了。然而，字体选择界面却始终没办法选择到我们新安装的各种字体。

本文将推荐一款可以为 PowerShell 和 cmd 使用的等宽字体，适合程序员使用。

---

<div id="toc"></div>

### 对字体要求

当然，安装了 git 后，会自动帮我们安装 mintty，bash 风格，自定义方便，着色也很棒。如果可能，我还是更希望用 mintty。可是，总有免不了要用 cmd 的时候，或者虽然强大但很丑的 PowerShell……

![](/static/posts/2017-11-23-00-01-33.png)  
▲ 很丑的 cmd

微软说，cmd 和 PowerShell 对字体的要求非常苛刻，在 [Necessary criteria for fonts to be available in a command window](https://support.microsoft.com/zh-cn/help/247815/necessary-criteria-for-fonts-to-be-available-in-a-command-window) 一文种就有说到：

> The fonts must meet the following criteria to be available in a command session window:
> - The font must be a fixed-pitch font.
> - The font cannot be an italic font.
> - The font cannot have a negative A or C space.
> - If it is a TrueType font, it must be FF_MODERN.
> - If it is not a TrueType font, it must be OEM_CHARSET.
> Additional criteria for Asian installations:
> - If it is not a TrueType font, the face name must be "Terminal."
> - If it is an Asian TrueType font, it must also be an Asian character set.

翻译过来是：

> 要能在命令行种使用，字体必须满足：
> - 必须是等宽字体
> - 不能是斜体
> - 该字体不能有A或C负空间
> - 如果是 TrueType 字体，则它必须是 FF_MODERN
> - 如果不是 TrueType 字体，则它必须是 OEM_CHARSET
> 如果是给亚洲地区使用，还必须满足这些条件：
> - 如果不是 TrueType 字体，字体名必须是“Terminal”
> - 如果是亚洲的 TrueType 字体，还必须使用亚洲的字符集。

这还真不是一般字体能够满足的……

### 推荐可用的字体

我找了好几款字体，然而只发现下面两款字体是真正可以在 PowerShell 或 cmd 里面用的：

- [Inziu Iosevka](https://be5invis.github.io/Iosevka/inziu.html)  
作者：[Belleve - 微软字体设计师，新中文字体主催](https://www.zhihu.com/people/be5invis)
- [Microsoft YaHei Mono](https://github.com/Microsoft/BashOnWindows/files/1362006/Microsoft.YaHei.Mono.zip) on GitHub  
微软为 WSL/Bash on Ubuntu on Windows 设计的字体，PowerShell 和 cmd 也能用  
效果相当于微软雅黑和 Consolas 的混搭

然而发现能用的都出自微软之手……

Inziu 字体族较多，实测有些有效有些无效：

![](/static/posts/2017-11-23-00-16-27.png)

所以，我更倾向于推荐 [Microsoft YaHei Mono](https://github.com/Microsoft/BashOnWindows/files/1362006/Microsoft.YaHei.Mono.zip)，效果如下图：

![](/static/posts/2017-11-23-00-24-33.png)  
▲ PowerShell

![](/static/posts/2017-11-22-23-14-57.png)  
▲ cmd

### 控制台字体设置方法

对于上面推荐的两款字体，直接安装就可以了，下次打开 PowerShell 或者 cmd 时，属性界面里面就可以找到新安装的字体，就可以选择了。

![](/static/posts/2017-11-23-00-20-34.png)  
▲ 属性

![](/static/posts/2017-11-23-00-21-14.png)  
▲ 选择字体

---

#### 参考资料

- [Necessary criteria for fonts to be available in a command window](https://support.microsoft.com/zh-cn/help/247815/necessary-criteria-for-fonts-to-be-available-in-a-command-window)
- [为什么 Windows 下 cmd 和 PowerShell 不能方便地自定义字体？ - 知乎](https://www.zhihu.com/question/36344262)
- HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Console\TrueTypeFont
- [List of all colors available for powershell? - Stack Overflow](https://stackoverflow.com/questions/20541456/list-of-all-colors-available-for-powershell)
