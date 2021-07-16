---
title: "如何调试 WiX Burn 制作的自定义托管引导程序的 exe 安装包"
date: 2021-07-16 16:47:57 +0800
categories: dotnet msi wix
position: starter
---

WiX 本身很强大，使用本来也没那么难。奈何 WiX 3 的官方文档可读性极差且长期不更新，于是新手在使用 WiX 制作安装包时极容易出问题，导致制作的安装包各种行为不正常。

虽然我写了一系列的 WiX 安装包入门教程来帮助大家避坑，还写了一些常见问题的解决方法，但大家遇到的问题总会比我整理的要多。所以教大家

---

<div id="toc"></div>

## 查看日志

很多时候，看日志能帮助你快速找到原因。以下是查看日志的方法：

- [如何查看用 WiX 制作的安装包的日志](/post/how-to-view-wix-burn-installer-logs.html)

## `Debugger.Launch()`

如果安装过程能执行到你编写的 C# 代码中，那么可以在入口处加上 `Debugger.Launch()` 来启动调试器。

```diff
    public class Program : BootstrapperApplication
    {
        protected override void Run()
        {
++          if (Environment.GetCommandLineArgs().Contains("-debug", StringComparer.OrdinalIgnoreCase))
++          {
++              Debugger.Launch();
++          }

            // 省略其他启动代码。
        }
    }
```

这里我加上了一个命令行参数的判断，即如果启动安装包 exe 的时候带上了 `-debug` 参数，那么就启动调试器。（我用一个 `-` 而不是 `--` 或者 `/` 的原因是 burn 引擎用的就是单个短线。）

![选择调试器](/static/posts/2021-07-16-16-41-05.png)

## 对比测试

如果出现的问题日志上说明不明显，代码也没执行到自定义引导程序部分，那么可以考虑对照正常状态的 WiX 项目替换组件调查。这可以快速将问题范围定位到某个文件甚至是某行代码上。

例如在[制作 WPF 安装包界面的教程](https://blog.walterlv.com/post/getting-started-with-wix-toolset-create-a-wpf-installer-ui.html)中，我们有四个项目。这个示例[已经开源到 GitHub 上了](https://github.com/walterlv/Walterlv.WixInstallerDemo/tree/1b6600bb694c593894fc20cea76154b61ccf0c1f)。于是我们可以尝试将出问题的项目中的部分模块替换成这个正常的项目对应部分。当最终能正常工作时，最近替换的模块便最有可能是问题模块。

![制作 WPF 安装包界面教程中的项目](/static/posts/2021-07-15-16-23-19.png)
