---
title: "快速在 Windows 上搭建 Jekyll 开发环境"
date: 2018-03-04 13:30:14 +0800
categories: jekyll
---

Jekyll 是一个不错的静态博客工具，本文将提供快速在 Windows 系统上搭建 Jekyll 开发环境的方法。

---

<div id="toc"></div>

### For 老手

其实所需的命令只有少数几个而已：

```bash
# 全局命令：安装 Ruby 所需的依赖
ridk install
# 全局命令：安装 Jekyll
gem install jekyll bundler
# 工作目录命令：安装博客仓库中所需的依赖
bundle install
# 工作目录命令：将本地博客仓库跑起来
jekyll serve
```

### For 新手

#### 下载必要的软件

考虑到我们的网络环境，为了提升本文的阅读效率，建议一边下载一边阅读。我为大家提供两种不同的下载源：1. 官方源；2. 加速源。

1. 官方源
    - [Ruby（挑最新的下载即可）](https://rubyinstaller.org/downloads/)
    - [MSYS2（虽然这不是必要的，但能大大提高配置环境的成功率和速度）](http://repo.msys2.org/distrib/x86_64/msys2-x86_64-20161025.exe)

2. 加速源（感谢小伙伴[林德熙](https://lindexi.github.io/lindexi/)）
    - [ruby](http://lindexi.ml:8080/index.php/s/L9LuTD14Y3pKadV)
    - [MSYS2](http://lindexi.ml:8080/index.php/s/qn2EbO5xhy86xlf)

#### 安装 Ruby 和 Jekyll

1. 分别安装下载好的 Ruby 和 MSYS2 安装包，一路下一步，直到两者都安装结束；

1. 一般安装完 Ruby 后会自动弹出一个新的命令行安装界面，我们需要在里面选择 3，然后回车。  
![ridk install](/static/posts/2018-03-04-12-14-41.png)
    - *如果上一步没有提前下载安装 MSYS2，那么这里会因为众所周知的网络原因速度奇慢无比，或者以失败告终。*
    - *如果没有弹出命令行安装界面或者把它关掉了，那么也可以在任意的命令行中输入 `ridk install` 来再次进入命令行安装界面。*
    - *如果网络状况良好，能够一次装成功。（如果不幸失败。则一直再次选 3 继续安装直到全部成功为止。）*
    ```bash
    Install MSYS2 and MINGW development toolchain succeeded
    ```

1. 再打开一个新的命令行窗口（cmd/powershell/bash/msys2 都行），输入以下命令安装 jekyll：
```bash
gem install jekyll bundler
```

自此，Jekyll 开发环境就搭建完成了。

#### 让自己的博客跑起来

如果你已经有了自己的 Jekyll 博客，希望在本地能够编译运行，那么就继续阅读本节。

可能你的博客来源于这些地方：
- 从 [Jekyll Themes](http://jekyllthemes.org/) 挑选并下载了一款主题；
- 克隆了[自己或别人的博客站点](https://lindexi.gitee.io/post/%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8%E6%9C%AC%E6%A8%A1%E6%9D%BF%E6%90%AD%E5%BB%BA%E5%8D%9A%E5%AE%A2.html)，准备改改自己用；

那么我们开始。首先在博客的根目录打开命令行，接下来的操作都在命令行中。

1. 安装依赖包
```bash
bundle install
```

1. 将 Jekyll 服务跑起来
```bash
jekyll serve
```

这就完成了！

不过，如果上述第 2 个步骤发生了错误，通常是依赖包的版本不匹配所致，运行命令更新依赖包：

```bash
bundle update
```

随后再次 `jekyll serve` 即可。

<!--
### For 懒人

懒人也不要太懒啊，最起码得翻到这篇文章的最末尾吧？
-->

### Ruby 跨版本升级的坑

如果你之前安装过 Ruby 的旧版本，现在需要跨大版本号升级，那么你会遇到很多问题：

- `ruby` 命令对应新旧哪个版本是不明确的
- 如果你覆盖安装了 `ruby`，那么之前安装自动设置的那些环境变量（例如 `gem`）就会丢失

这会导致你试图编译你的博客时遇到各种各样奇怪的错误。

所以，你需要做的是：

- 卸载掉之前的 `ruby`
- 再次安装 `ruby`
