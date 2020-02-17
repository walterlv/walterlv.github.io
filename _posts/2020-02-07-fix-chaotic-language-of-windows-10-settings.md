---
title: "修复 Windows 10 设置界面里面混乱的语言翻译"
publishDate: 2020-02-07 13:35:27 +0800
date: 2020-02-17 08:34:21 +0800
categories: windowes
position: problem
---

Windows 10 每次新发布一个版本都会遇到各种各样的新型 Bug。

本文介绍的是 Windows 10 的设置界面里面，各种各样的语言文字都很混乱，就像统一错位了一样。本文也会同时介绍其修复方法。

---

<div id="toc"></div>

## 系统版本

会出现此问题的系统是 Windows 10 英文版系统。

注意，是 Windows 10 英文版系统，而不是中文版系统的英文语言。如果你想要识别这样的系统的话，也很简单，使用你的系统安装程序，安装程序中界面使用的语言就是此系统的原生语言。

如果在安装完此英文版系统后再安装中文语言，就可能会出现中文语言混乱的问题。

## 混乱的界面

先看看下面的两张图：

![混乱的界面1](/static/posts/2020-02-07-09-56-38.png)

![混乱的界面2](/static/posts/2020-02-07-09-57-25.png)

可以注意到，界面当中出现了很多本不应该出现在那个地方的文案。

如果我们这个时候让设置界面弹出一个对话框出来，你还会看到对话框中的文字超出范围导致布局错乱呢：

![混乱的界面3](/static/posts/2020-02-07-09-59-24.png)

按钮都不知道被裁成什么样了。

## 修复方法

经过我的多次尝试，发现，英文版系统安装中文语言包，第一次几乎必定失败，然后出现本文所述的问题。

解决方法是这样的：

1. 将语言切换回英文
2. 删除中文语言包
3. 删除下载缓存文件
4. 重新下载中文语言包

下面详细说明。

### 将语言切换回英文

进入“系统设置 -> 时间和语言 -> 语言”，通过点击上箭头的方式将英语语言置顶，同时将显示语言切换成英语。

![置顶英语语言](/static/posts/2020-02-07-11-20-43.png)

![将显示语言切换成英语](/static/posts/2020-02-07-13-25-56.png)

### 删除中文语言包

以管理员权限启动 PowerShell，然后输入 `Get-WinUserLanguageList` 命令，以获取我们要删除的语言的 LanguageTag。

```powershell
PS C:\Windows\system32> Get-WinUserLanguageList

LanguageTag     : en-US
Autonym         : English (United States)
EnglishName     : English
LocalizedName   : English (United States)
ScriptName      : Latin
InputMethodTips : {0409:00000409}
Spellchecking   : True
Handwriting     : False

LanguageTag     : zh-Hans-CN
Autonym         : 中文(中华人民共和国)
EnglishName     : Chinese
LocalizedName   : Chinese (Simplified, China)
ScriptName      : Chinese (Simplified)
InputMethodTips : {0804:{81D4E9C9-1D3B-41BC-9E6C-4B40BF79E35E}{FA550B04-5AD7-411F-A5AC-CA038EC515D7}}
Spellchecking   : True
Handwriting     : True
```

然后，依次输入以下四句命令，获取语言列表，筛选我们要删除的语言，删除筛选出的语言，设置回列表。

```powershell
PS C:\Windows\system32> $LangList = Get-WinUserLanguageList
PS C:\Windows\system32> $ToDeletedLang = $LangList | where LanguageTag -eq "zh-Hans-CN"
PS C:\Windows\system32> $LangList.Remove($ToDeletedLang)
True
PS C:\Windows\system32> Set-WinUserLanguageList $LangList -Force
```

### 删除下载缓存文件

进入文件夹“C:\Windows\SoftwareDistribution\Download”，删除里面的所有文件和文件夹。

![删除下载缓存](/static/posts/2020-02-07-13-30-29.png)

随后，重新启动计算机。

### 重新下载中文语言包

现在，按照正常的安装中文语言包的方式再安装一次语言包。

即“Settings -> Time & Language -> Language -> Add a preferred language”，然后选择中文，下一步 -> 安装。等待安装结束。

![选中中文](/static/posts/2020-02-07-13-33-32.png)

等安装进度条全部结束之后，再选择现实语言为“中文”即可。

![选择现实语言为中文](/static/posts/2020-02-07-13-35-17.png)
