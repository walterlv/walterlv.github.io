---
layout: post
title:  "为程序签名"
date:   2015-03-31 16:46:00 +0800
categories: Windows WPF
---

给应用程序签名，可以让系统知道你的程序是受信任的程序。一部分操作，系统只会为受信任的程序开启。

创建私人证书

```
makecert -r -pe -n "CN=Test Certificate - For Internal Use Only" -ss PrivateCertStore testcert.cer
```

安装私人证书

```
certmgr.exe -add testcert.cer -s -r localMachine root
```

给程序集签名

```
SignTool sign /v /s PrivateCertStore /n "Test Certificate - For Internal Use Only" /t http://timestamp.verisign.com/scripts/timestamp.dll APP.exe
```
