---
title: "使用 SoftEther VPN 在 VPS 和个人电脑之间搭建 VPN 网络"
publishDate: 2020-02-07 09:48:36 +0800
date: 2020-03-23 11:35:30 +0800
tags: linux network
position: starter
coverImage: /static/posts/2020-01-29-23-09-12.png
permalink: /posts/build-vpn-on-vps-using-soft-ether.html
---

VPN 全称是 Virtual Private Network（虚拟专用网络），可以在多台设备之间建立安全的通信网络。VPS 是 Virtual Private Server，虚拟专用服务器，指的是一台虚拟的电脑，用于提供服务。

注意，本文不会谈及科学上网相关的内容。本文建立 VPN 网络单纯是为了对外提供服务。

---

<div id="toc"></div>

## VPN 虚拟专用网络

### 为什么我们需要一个 VPS

为了对公众提供服务，我们需要：

1. 一台 24×7 小时不关机的计算机
1. 一个可被互联网访问到的 IP（公网 IP）

对个人家用电脑来说，你可以做到 24 小时不关机，但你拿不到一个稳定的公网 IP。中国电信可以在办网的时候提供公网 IP，但此 IP 会经常改变，因此几乎无法对外提供服务。虽然可以使用 DDNS（动态域名解析服务），但因为域名解析存在缓存，所以当 IP 改变的时候，你会有数分钟到数小时不等的时间无法访问到正确的 IP。

因此，个人电脑是无法稳定对外提供服务的——**我们需要一个 VPS**——它有固定的公网 IP。

### 反向代理

实际上，只需要一个 VPS 我们就能直接对外提供服务了——将服务部署到 VPS 上就可以。但我们也可以将服务部署到另一台计算机上，甚至这台计算机可以没有公网 IP。于是 VPS 上只需要部署一个反向代理服务器即可。

如果使用 FRP 这种反向代理服务器，那么不需要固定公网 IP 就能反向代理。然而 FRP 也有一些不能满足的要求，这时部署反向代理服务器，我们需要真实提供服务的计算机也具有固定的 IP。而 VPN 网络可以提供这一点。

### 虚拟专用网络（VPN）

如果我们将 VPS 和其他散布在内网或者非固定 IP 的公网计算机连接起来，组成一个专用的网络，那么这个就是“虚拟专用网络”（VPN）。这样，无论这些电脑散布在哪些地方，在哪些网络中，对于对方来说都是“内网”中的另一台电脑，这是可以有固定（内网）IP 的，于是可以做很多事情。

我画了一张简单的图来描述一个简单的 VPN 网络。

![虚拟专用网络](/static/posts/2020-01-29-23-09-12.png)

接下来，本文将介绍如何搭建一个如图所示的 VPN 网络。

## VPS 端 - 服务端

以 Debian 系统的 VPS 为例，除了包管理工具和文本编辑工具，其他各种操作都是大同小异。

我们要在 VPS 端安装一个 SoftEther 的服务端和一个客户端。服务端用于连接整个 VPN 网络，而客户端用于将此 VPS 主机组成此 VPN 网络中的第一台计算机。

### 下载 SoftEther VPN

下载地址

- [Download - SoftEther VPN Project](https://www.softether.org/download)

下载有很多的种类可选。考虑到我们会部署到多台计算机上，所以建议选择最末尾的一个 `ZIP CD-ROM Image Package of SoftEther VPN`。这样，我们可以从一个文件夹中取出所有我们想要的运行环境。

![选择最大的一个下载](/static/posts/2020-01-30-16-33-11.png)

### 安装 SoftEther VPN Server

在安装 SoftEther VPN 的服务端之前，我们需要确保你的 Linux 系统上有这些工具：

- make
- gcc
- net-tools

如果是 Debian 系统，可以运行命令安装：

```bash
apt-get install make
apt-get install gcc
apt-get install net-tools
```

接下来的安装过程有编译步骤，所以需要用到以上工具。

将我们下载下来的 `\VPN-CD-v4.30-9696-beta-2019.07.08\Linux\SoftEther_VPN_Server\64bit_-_Intel_x64_or_AMD64\softether-vpnserver-v4.30-9696-beta-2019.07.08-linux-x64-64bit\vpnserver` 文件夹上传到 Linux 系统中，建议 `/opt/SoftEther` 目录，如下：

![上传 vpnserver 文件夹](/static/posts/2020-01-30-20-26-51.png)

然后，进入 vpnserver 文件夹，运行 `.install.sh`：

```bash
cd vpnserver
bash .install.sh
```

![运行 .install.sh](/static/posts/2020-01-30-20-33-49.png)

### 配置 SoftEther VPN Server 服务

现在，前往 `/etc/init.d` 目录，这个目录存放了各种系统服务的启用和停用脚本。我们需要将 VPN Server 服务放到这个目录下。

你可以在官方文档 [7.3 Install on Linux and Initial Configurations - SoftEther VPN Project](https://www.softether.org/4-docs/1-manual/7._Installing_SoftEther_VPN_Server/7.3_Install_on_Linux_and_Initial_Configurations) 找到服务脚本。

记得将下面 DAEMON 中的路径改成你自己的路径。改好之后，命名成 `vpnserver`，放到 `/etc/init.d` 目录下。

```bash
#!/bin/sh
# chkconfig: 2345 99 01
# description: SoftEther VPN Server
DAEMON=/opt/SoftEther/vpnserver/vpnserver
LOCK=/var/lock/subsys/vpnserver
test -x $DAEMON || exit 0
case "$1" in
start)
$DAEMON start
touch $LOCK
;;
stop)
$DAEMON stop
rm $LOCK
;;
restart)
$DAEMON stop
sleep 3
$DAEMON start
;;
*)
echo "Usage: $0 {start|stop|restart}"
exit 1
esac
exit 0
```

请确保此文件的行尾符是 CL，而不是 Windows 系统中的 CLRF。

将此文件放入 `/etc/init.d` 后，记得修改文件的属性：

```bash
chmod 755 vpnserver
```

![准备好服务](/static/posts/2020-01-30-21-15-32.png)

### 配置 SoftEther VPN Server 开机启动

Ubuntu 或者 Debian 系统的开机启动项脚本位于 `/etc/rcN.d/` 目录中，我们可以使用以下命令设置其开机启动。

```bash
update-rc.d vpnserver defaults
```

### 启动 SoftEther VPN Server

使用以下命令启动服务：

```bash
/etc/init.d/vpnserver start
```

## VPS 端 - 客户端

VPS 主机也需要安装运行 SoftEther VPN 客户端，这样这台主机才会成为 VPN 网络的其中一台主机。

安装方法与服务端非常类似，所以下面的介绍会简略一些。

### 安装 SoftEther VPN Client

将我们下载下来的 `\VPN-CD-v4.30-9696-beta-2019.07.08\Linux\SoftEther_VPN_Client\64bit_-_Intel_x64_or_AMD64\softether-vpnclient-v4.30-9696-beta-2019.07.08-linux-x64-64bit\vpnclient` 文件夹上传到 Linux 系统中，建议 `/opt/SoftEther` 目录，如下：

![上传 vpnclient 文件夹](/static/posts/2020-01-30-21-44-22.png)

然后，进入 vpnclient 文件夹，运行 `.install.sh`：

```bash
cd vpnclient
bash .install.sh
```

![运行 .install.sh](/static/posts/2020-01-30-20-33-49.png)

### 配置 SoftEther VPN Client 服务

现在，前往 `/etc/init.d` 目录，这个目录存放了各种系统服务的启用和停用脚本。我们需要将 VPN Client 服务放到这个目录下。

记得将下面 DAEMON 中的路径改成你自己的路径。改好之后，命名成 `vpnclient`，放到 `/etc/init.d` 目录下。

```bash
#!/bin/sh
# chkconfig: 2345 99 01
# description: SoftEther VPN Client
DAEMON=/opt/SoftEther/vpnclient/vpnclient
LOCK=/var/lock/subsys/vpnclient
test -x $DAEMON || exit 0
case "$1" in
start)
$DAEMON start
touch $LOCK
;;
stop)
$DAEMON stop
rm $LOCK
;;
restart)
$DAEMON stop
sleep 3
$DAEMON start
;;
*)
echo "Usage: $0 {start|stop|restart}"
exit 1
esac
exit 0
```

将此文件放入 `/etc/init.d` 后，记得修改文件的属性：

```bash
chmod 755 vpnclient
```

### 配置 SoftEther VPN Client 开机启动

使用以下命令设置其开机启动。

```bash
update-rc.d vpnclient defaults
```

### 启动 SoftEther VPN Client

使用以下命令启动服务：

```bash
/etc/init.d/vpnclient start
```

启动后，会出现一些提示：

```bash
The SoftEther VPN Server service has been started.

Let's get started by accessing to the following URL from your PC:

https://**.**.**.**:5555/
  or
https://**.**.**.**/

Note: IP address may vary. Specify your server's IP address.
A TLS certificate warning will appear because the server uses self signed certificate by default. That is natural. Continue with ignoring the TLS warning.
```

这里会提示你 VPN 服务器的 IP 和端口号。我们接下来在配置客户端的时候会用到这个 IP 和端口号。

## 个人电脑端

这里个人电脑端我们使用 Windows 系统。

### 安装

将我们下载下来的 `\VPN-CD-v4.30-9696-beta-2019.07.08\Windows\SoftEther_VPN_Server_and_VPN_Bridge安装服务端管理工具` 文件夹打开，运行里面的 exe 安装：

![安装服务端管理工具](/static/posts/2020-01-31-13-52-03.png)

▲ 我们将用这个工具来管理我们在 VPS 上部署的 VPN Server

将我们下载下来的 `\VPN-CD-v4.30-9696-beta-2019.07.08\Windows\SoftEther_VPN_Client` 文件夹打开，运行里面的 exe 安装：

![安装 Windows 端](/static/posts/2020-01-30-21-55-55.png)

![安装管理工具和客户端](/static/posts/2020-01-31-10-23-22.png)

▲ 我们将用这个工具来管理我们在 VPS 上部署的 VPN Client 以及在本机上部署的 VPN Client

### 配置 VPS 上的 VPN Server

启动“SE-VPN Server Manager (Tools)”：

![SE-VPN Server Manager (Tools)](/static/posts/2020-01-31-13-55-55.png)

我们将使用此工具配置我们在 VPS 上的 VPN Server。

第一步：设置新连接，输入设置名、主机名和端口（就是我面前面在 VPS 上输出的 IP 和端口）。输入完之后点确定。

![设置设置名、主机名和端口](/static/posts/2020-01-31-14-05-46.png)

第二步：连接这个设置，第一次连接会提示设置管理员密码，请自己设置一个。

![设置管理员密码](/static/posts/2020-01-31-14-11-15.png)

第三步：安装和配置 VPN Server

设置过程是一步步来的，你可以考虑按照下图依次设置。

![安装 VPN Server](/static/posts/2020-01-31-14-09-34.png)

▲ 远程访问 VPN Server

![动态 DNS](/static/posts/2020-01-31-14-13-42.png)

▲ 设置好主机名后，直接点退出

![IPsec 设置](/static/posts/2020-01-31-14-17-41.png)

▲ 启用 L2TP 服务器功能，并设置好 IPsec 预共享密钥

![VPN Azure 服务设置](/static/posts/2020-01-31-14-19-21.png)

▲ 禁用 VPN Azure

![创建新用户](/static/posts/2020-01-31-14-22-42.png)

▲ 创建新用户

至此，服务端就设置完毕。接下来我们设置客户端。

<!-- 启动 SoftEther VPN 命令行实用工具(vpncmd)。

![SoftEther VPN 命令行实用工具(vpncmd)](/static/posts/2020-01-31-11-19-49.png)

我们需要配置 VPN Server 的密码。按下图，我们依次选择“VPN Server 或 VPN Bridge 的管理”，VPN Server 的 IP 地址。在最后问 HUB 名称的时候，因为我们没有创建，所以直接回车（不用输入）。

这时，会进入 VPN Server 控制台。

![进入 VPN Server 控制台](/static/posts/2020-01-31-11-19-00.png) -->

### 配置本地的 VPN Client

启动 SoftEther VPN Client 管理工具，我们即将使用此工具管理本机的客户端和刚刚配好的 VPS 主机上的客户端。

![启动 SoftEther VPN Client 管理工具](/static/posts/2020-01-31-10-26-11.png)

点击“添加新的 VPN 连接”。首次点击的时候会提示创建虚拟网络适配器，点击“是”让它创建即可。

![创建虚拟网络适配器](/static/posts/2020-01-31-10-38-15.png)

![正在创建虚拟网络适配器](/static/posts/2020-01-31-10-38-42.png)

随后，添加新的 VPN 连接：

![添加新的 VPN 连接](/static/posts/2020-01-31-16-20-23.png)

设置连接信息。

- 连接设置名：随便填写
- 主机名：前面我们启动 VPN Server 时输出的 IP
- 端口号：前面我们启动 VPN Server 时输出的端口号
- 虚拟 HUB 名：前面我们填完之后，这里就会自动出现了，选择即可
- 用户认证设置：我们前一步设置用户的时候设置的用户名和密码

![设置连接信息](/static/posts/2020-01-31-16-22-56.png)

### 配置 VPS 上的 VPN Client

启动“管理远程电脑上的 SoftEther VPN Client”程序：

![管理远程电脑上的 SoftEther VPN Client](/static/posts/2020-01-31-16-37-26.png)

输入我们前面 VPS 上的 IP 地址：

![输入计算机名](/static/posts/2020-01-31-16-38-42.png)

……

<!-- 
---

**参考资料** -->


