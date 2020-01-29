---
title: "收集的 Linux VPS 在线重装系统脚本"
date: 2020-01-29 21:58:13 +0800
categories: linux
position: starter
---

因为 VPS 上预装的操作系统我并不习惯，所以打算重装一个。有的 VPS 服务商提供了较多种类的系统选择，有的却没有。如果你发现你希望重装的系统服务商没有提供，可以考虑自己安装。

---

<div id="toc"></div>

## 重装脚本 - 来自萌咖

以下是来自萌咖的一键重装脚本的发布贴：

- [[ Linux VPS ] Debian(Ubuntu)网络安装/重装系统一键脚本 - 萌咖](https://moeclub.org/2017/03/25/82/?spm=79.7)
- [[ Linux VPS ] CentOS 网络安装/重装系统一键脚本 纯净安装 - 萌咖](https://moeclub.org/2018/03/26/597/)

### CentOS -> Debian

第一步：先确保安装所需的软件。

```bash
yum install -y gawk sed grep
```

```bash
[root@walterlv ~]# yum install -y gawk sed grep
Loaded plugins: fastestmirror
Determining fastest mirrors
epel/x86_64/metalink                                      | 9.5 kB  00:00:00
 * base: mirror.xtom.com.hk
 * epel: my.mirrors.thegigabit.com
 * extras: mirror.xtom.com.hk
 * updates: mirror.xtom.com.hk
base                                                                                                                                                                | 3.6 kB  00:00:00     
epel                                                                                                                                                                | 5.3 kB  00:00:00     
extras                                                                                                                                                              | 2.9 kB  00:00:00     
updates                                                                                                                                                             | 2.9 kB  00:00:00     
(1/7): base/7/x86_64/group_gz                             | 165 kB  00:00:01
(2/7): extras/7/x86_64/primary_db                         | 159 kB  00:00:00
(3/7): epel/x86_64/group_gz                               |  90 kB  00:00:01
(4/7): epel/x86_64/updateinfo                             | 1.0 MB  00:00:03
(5/7): base/7/x86_64/primary_db                           | 6.0 MB  00:00:04
(6/7): updates/7/x86_64/primary_db                        | 5.9 MB  00:00:03
(7/7): epel/x86_64/primary_db                             | 6.9 MB  00:06:01
Package gawk-4.0.2-4.el7_3.1.x86_64 already installed and latest version
Package sed-4.2.2-5.el7.x86_64 already installed and latest version
Package grep-2.20-3.el7.x86_64 already installed and latest version
Nothing to do
```

第二步：下载脚本。

```bash
wget --no-check-certificate -qO DebianNET.sh 'https://moeclub.org/attachment/LinuxShell/DebianNET.sh' && chmod a+x DebianNET.sh
```

第三步：全自动安装 Debian 9

```bash
bash DebianNET.sh -d 9 -v 64 -a
```

这里的 `-a` 是自动安装。如果不指定或者指定为 `-m` 则需要去 VNC 手动安装。

可以设置安装时 root 用户的密码：

```bash
bash DebianNET.sh -d 9 -v 64 -a -p WalterlvPwd
```

![自动安装](/static/posts/2020-01-29-21-14-23.png)

如果你希望设置更多的安装选项，也可以选择手动安装。第三步我们修改命令。

第三步：手动安装系统 Debian 9

```bash
[root@walterlv ~]# bash DebianNET.sh -d 9 -v 64
```

安装过程和交互如下：

```bash
# Install

Do you want to install os manually?[y/n] y
Manual Mode insatll [Debian] [stretch] [amd64] in VNC.

[Debian] [stretch] [amd64] Downloading...

It will reboot!
Please connect VNC!
Select Install OS [stretch amd64] to install system.
```

在以上命令重启 Linux 后，前往 VNC 界面选择启动的操作系统：

![InstallOS](/static/posts/2020-01-29-20-57-28.png)

随后会进入安装和设置界面。

![安装界面](/static/posts/2020-01-29-20-57-46.png)
