---
title: "可集成到文件管理器，一句 PowerShell 脚本发布某个版本的所有 NuGet 包"
publishDate: 2019-11-20 14:38:39 +0800
date: 2019-12-08 15:29:05 +0800
tags: powershell nuget dotnet
position: problem
coverImage: /static/posts/2019-11-20-14-31-13.png
permalink: /post/push-nuget-packages-using-powershell.html
---

要发布 NuGet 包，只需要执行命令 `nuget push xxx.nupkg` 即可，或者去 nuget.org 点鼠标上传。

不过，如果你有很多的 NuGet 包并且经常需要推送的话，也可以集成到 Directory Opus 或者 Total Commander 中。

---

<div id="toc"></div>

## NuGet 推送命令

NuGet 推送命令可直接在微软官方文档中阅读到：

- [NuGet CLI push command - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/cli-reference/cli-ref-push)

在你已经[设置了 ApiKey](https://docs.microsoft.com/en-us/nuget/reference/cli-reference/cli-ref-setapikey) 的情况下：

```powershell
nuget setapikey xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx -source https://api.nuget.org/v3/index.json
```

之后你只需要执行一句命令即可：

```powershell
nuget.exe push Walterlv.Themes.FluentDesign.Source.0.8.0-alpha.nupkg -source https://api.nuget.org/v3/index.json
```

或者推送此文件夹下 0.8.0-alpha 版本的所有 NuGet 包：

```powershell
nuget.exe push *.0.8.0-alpha.nupkg -source https://api.nuget.org/v3/index.json
```

## 用 PowerShell 包装一下

要执行 NuGet 的推送命令，我们需要一个可以执行命令的终端，比如 PowerShell。命令的执行结果我们也可以直接在终端看到。

不过，如果命令是集成到其他工具里面，那么就不一定能够看得到命令的执行结果了。

这个时候，可以考虑用 PowerShell 间接执行这个命令：

```powershell
# PowerShell 版本
powershell -NoExit -c "nuget push *.0.8.0-alpha.nupkg -Source https://api.nuget.org/v3/index.json"
```

```powershell
# PowerShell Core 版本
pwsh -NoExit -c "nuget push *.0.8.0-alpha.nupkg -Source https://api.nuget.org/v3/index.json"
```

关于使用 PowerShell 间接执行命令的更多细节，可以参考我的另一篇博客：

- [PowerShell 的命令行启动参数（可用于执行命令、传参或进行环境配置） - walterlv](/post/powershell-startup-arguments)

## 集成到 Directory Opus

我将这个命令集成到了 Directory Opus 中，这样，一次点击或者一个快捷键就能发布某个特定版本的所有的 NuGet 包了。

![集成到 Directory Opus](/static/posts/2019-11-20-14-31-13.png)

关于使用 Directory Opus 继承工具栏按钮的细节，可以阅读我的另一篇博客：

- [在 Directory Opus 中添加自定义的工具栏按钮提升效率 - walterlv](/post/directory-opus-custom-toolbar-buttons)

具体来说，就是安装上文中所述的方法添加一个按钮，在按钮当中需要执行的脚本如下：

```powershell
cd "{sourcepath} "
pwsh -NoExit -c "$file=[Regex]::Match('{file}', '\.\d+\.\d+\.\d+.+.nupkg').Value; nuget push *$file -Source https://api.nuget.org/v3/index.json"
```

含义为：

1. 转到 Directory Opus 当前目录
1. 执行一段 PowerShell 脚本，但执行完之后不退出（这样，我可以观察到我实际上推送的是哪一些包，并且可以知道推送是否出现了错误）
1. 要执行的命令为 `nuget push *.xxx.nupkg -Source https://api.nuget.org/v3/index.json`
    - 其中，中间的 xxx 是使用正则表达式匹配的 `{file}` 文件名
    - `{file}` 是 Directory Opus 当前选中的文件，我用正则表达式匹配出其版本号和后面的 `.nupkg` 后缀
    - 将正则表达式匹配出来的文本作为 `nuget push` 的包，最终生成的命令会非常类似于本文一开始提到的命令 `nuget push *.0.8.0-alpha.nupkg -Source https://api.nuget.org/v3/index.json`

![Directory Opus 工具栏按钮](/static/posts/2019-11-22-14-52-06.png)

于是，当我选中了一个包，按下这个工具栏按钮之后，就可以推送与这个包相同版本的所有的 NuGet 包了。

毕竟我一次编译产生的 NuGet 包太多了，还是需要使用这样的方式来提高一点效率。至于为什么不用持续集成，是因为目前 SourceYard 还不支持在 GitHub 上集成。

![一键推送 NuGet 包](/static/posts/2019-11-24-13-18-30.png)

---

**参考资料**

- [NuGet CLI push command - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/cli-reference/cli-ref-push)


