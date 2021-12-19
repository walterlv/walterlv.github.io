---
title: "Windows/Linux 系统中获取端口被哪个应用程序占用"
publishDate: 2020-03-11 15:38:02 +0800
date: 2020-05-23 20:21:49 +0800
tags: windows linux powershell
position: starter
coverImage: /static/posts/2020-03-11-15-04-19.png
permalink: /post/get-port-owning-process.html
---

管理服务程序的时候，可能会查询某个端口当前被哪个进程占用。不仅能找出有问题的进程将其处理掉，也可以用来辅助检查某个程序是否开启了服务并在监听端口。

---

<div id="toc"></div>

## Windows 系统

Windows 系统上可以使用 PowerShell 命令来查询占用某个端口的程序。

比如，我们需要查询 5000 端口被占用的进程是谁，可以在 PowerShell 中输入命令：

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
```

![查询占用某端口的进程](/static/posts/2020-03-11-15-04-19.png)

## Linux 系统

在终端中输入命令 `lsof` 可以查询占用某个端口的进程。

```powershell
lsof -i:端口号
```

比如，我们需要查询 5000 端口被占用的进程是谁，可以在中断中输入命令：

```bash
walterlv@localhost:~# lsof -i:5000
COMMAND        PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
dotnet_serve   731 root    3u  IPv6  12890      0t0  TCP *:5000
```

或者使用 netstat 查询。

```bash
netstat -tunpl | grep 端口号
```

举例：

```bash
walterlv@localhost:~# netstat -tunpl | grep 35412
tcp6   0   0 :::5000     :::*             731/dotnet_serve
```


