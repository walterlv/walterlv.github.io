---
title: "为 .NET 各种开发工具设置网络代理，提升在大陆的网络性能"
publishDate: 2020-01-03 09:41:16 +0800
date: 2020-05-13 10:09:47 +0800
categories: dotnet
position: knowledge
---

git、nuget、scoop 如何设置网络代理提升网络访问速度呢？

---

<div id="toc"></div>

在下面的博客正文中，都假设我的本机搭设了代理服务，其中 SOCKS5 代理服务的端口号是 7777，HTTP 代理服务的端口号是 7778。

## git

### 使用命令行设置

git 支持设置 http 代理和 socks5 代理，http 的代理和 https 的代理是分开设置的。

设置方法：

1. 打开任意一个命令行工具；
1. 在命令行中输入以下两个命令并回车。

```powershell
git config --global http.proxy http://127.0.0.1:7778
git config --global https.proxy http://127.0.0.1:7778
```

或者：

```powershell
git config --global http.proxy socks5://127.0.0.1:7777
git config --global https.proxy socks5://127.0.0.1:7777
```

在设置完成之后，**你无需担心内网访问的问题**，因为 Git 会自动在代理的时候过滤掉内网代理。

### 直接修改配置文件

git 全局配置文件的路径在：

- `%USERPROFILE%\.gitconfig`

在这个文件中，你需要添加以下几行：

```diff
    [user]
        name = walterlv
        email = walter.lv@qq.com
+   [http]
+       proxy = http://127.0.0.1:7778
+   [https]
+       proxy = http://127.0.0.1:7778
```

或者：

```diff
    [user]
        name = walterlv
        email = walter.lv@qq.com
+   [http]
+       proxy = socks5://127.0.0.1:7777
+   [https]
+       proxy = socks5://127.0.0.1:7777
```

添加完成之后，你的 git 访问就会走代理，对于 GitHub 的访问，快速克隆大型仓库是非常有帮助的。

### 使用 TortoiseGit 设置

以上命令行的方法是最简单的，然而你也可以使用其他的工具设置，比如 TortoiseGit。

设置方法：

1. 在任意的文件夹中打开 TortoiseGit 的设置页面，然后定位到网络一栏中，勾选“使用代理服务器”。
1. 输入服务器地址和端口号，确定即可。

![在 TortoiseGit 中设置](/static/posts/2020-01-03-08-04-35.png)

## NuGet

使用 NuGet 直接拉取 <nuget.org> 的内容也是很慢的，如果有一个代理服务器的设置那么也能大大提速。

### 在命令行中设置

```powershell
> nuget config -set http_proxy=http://127.0.0.1:7778
```

### 直接修改配置文件

git 全局配置文件的路径在：

- `%APPDATA%\NuGet\NuGet.Config`

在这个文件中，你需要添加以下几行：

```diff
    <?xml version="1.0" encoding="utf-8"?>
    <configuration>
      <packageSources>
        <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
      </packageSources>
      <config>
+       <add key="http_proxy" value="http://127.0.0.1:7778" />
      </config>
    </configuration>
```

如果这么设置了，那么 NuGet 会为所有的包源设置代理。然而内部部署的包源并不需要代理，于是还需要设置 `no_proxy`：

```diff
    <configuration>
      <config>
        <add key="http_proxy" value="http://127.0.0.1:7778" />
+       <add key="no_proxy" value="localhost,127.0.0.1,*.walterlv.com" />
      </config>
    </configuration>
```

## Scoop

Scoop 是一款优秀的包管理工具，可以以绿色的方式安装各种工具。

```powershell
scoop config proxy 127.0.0.1:7778
```

## Chocolatey / ChocolateyGUI

Chocolatey 是 Windows 上非常著名的包管理工具。它支持的代理设置方法非常多，你可以去它的官网了解所有的设置代理的方法：[Chocolatey Software - Proxy Settings for Chocolatey](https://chocolatey.org/docs/proxy-settings-for-chocolatey)。

这里简单搬运一下直接的设置方法。

```powershell
choco config set proxy 127.0.0.1:7778
```

同时，它也支持 `http_proxy` `https_proxy` 和 `no_proxy` 这样全局的环境变量设置。

另外，不喜欢命令行版的 `choco` 和命令行版代理设置的同学，可以考虑用 ChocolateyGUI：

- [chocolatey/ChocolateyGUI: A delicious GUI for Chocolatey](https://github.com/chocolatey/ChocolateyGUI)

![ChocolateyGUI 中的代理设置](/static/posts/2020-05-13-10-07-48.png)

---

**参考资料**

- [nuget.config File Reference - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/nuget-config-file)
- [no_proxy containing wildcard breaks nuget · Issue #3776 · NuGet/Home](https://github.com/NuGet/Home/issues/3776)
- [Using Scoop behind a proxy · lukesampson/scoop Wiki](https://github.com/lukesampson/scoop/wiki/Using-Scoop-behind-a-proxy)
- [github - Only use a proxy for certain git urls/domains? - Stack Overflow](https://stackoverflow.com/a/41623825/6233938)
- [Configure Git to use a proxy](https://gist.github.com/evantoli/f8c23a37eb3558ab8765)
- [Chocolatey Software - Proxy Settings for Chocolatey](https://chocolatey.org/docs/proxy-settings-for-chocolatey)
