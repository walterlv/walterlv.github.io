---
title: "0x800b0109 - 已处理证书链，但是在不受信任提供程序信任的根证书中终止。"
date: 2021-07-16 17:51:20 +0800
tags: dotnet msi wix
position: problem
coverImage: /static/posts/2021-07-16-17-41-15.png
---

有时在安装程序时无法安装出现错误，或者在更新某些系统组件时也遇到同样的错误：“已处理证书链，但是在不受信任提供程序信任的根证书中终止。”。

本文介绍其原因和解决方法。

---

<div id="toc"></div>

## 错误

![错误提示 - 来自 .NET Framework](/static/posts/2021-07-16-17-41-15.png)  
▲ 错误提示 - 来自 .NET Framework

![错误提示 - 来自 WiX 入门教程](/static/posts/2021-07-16-17-34-52.png)  
▲ 错误提示 - 来自[WiX 入门教程](/post/getting-started-with-wix-toolset)

错误码：`0x800b0109`。

> 已处理证书链，但是在不受信任提供程序信任的根证书中终止。

> A certificate chain processed, but terminated in a root certificate which is not trusted by the trust provider.

[使用 err 工具来查询此错误码](https://blog.walterlv.com/post/hresult-in-windows.html) 也能得到相同的提示：

```powershell
❯ err 800b0109
# for hex 0x800b0109 / decimal -2146762487
  CERT_E_UNTRUSTEDROOT                                           winerror.h
# A certificate chain processed, but terminated in a root
# certificate which is not trusted by the trust provider.
# 1 matches found for "800b0109"
```

## 原因

操作系统中不含此 .NET Framework 版本需要验证的在有效时间内的微软根证书（Microsoft Root Certificate Authority 2011）。

目前已知最新版的 Windows 7 SP1 (x86) 系统在未安装系统所需补丁的情况下不带此证书，而 Windows 7 SP1 (x64) 系统的最新版带有此证书。其他更(gèng)新的 Windows 8、Windows 10 全系都带有此证书。

## 解决

为系统安装有效的微软证书即可。

第一步：[下载证书 MicrosoftRootCertificateAuthority2011.zip](/static/attachments/MicrosoftRootCertificateAuthority2011.zip)，下载完后解压得到 MicrosoftRootCertificateAuthority2011.cer 文件。（你也可以从其他已安装证书的电脑上导出。）

第二步：双击安装证书。

1. 点击“安装证书”，下一步；
1. 选择“将所有的证书放入下列存储”，然后选择“浏览...”；
1. 选择“受信任的证书办法机构”，然后选择“下一步”；
1. 在“安全性警告”中，点击“是”。

![双击证书文件](/static/posts/2021-07-16-17-44-14.png)

![打开导入向导](/static/posts/2021-07-16-17-44-23.png)

![选择存储位置](/static/posts/2021-07-16-17-44-29.png)

最后，重新安装 .NET Framework 或者其他程序即可。

