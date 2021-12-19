---
title: "PasswordVault —— 在 UWP 应用中安全地保存密码"
publishDate: 2018-06-15 21:43:08 +0800
date: 2018-12-14 09:54:00 +0800
tags: uwp
permalink: /post/uwp-password-vault.html
---

只要你做过自动登录，一定会遇到密码的安全问题。现在大部分的网络服务都已经支持 Token 了，有些已经支持 OAuth2.0，这意味着客户端不怎么需要关心密码的安全保存问题。

但是，依然还有一些古老的服务和协议需要直接传输密码，比如邮件的 IMAP 协议。

---

我在 [ERMail](https://github.com/walterlv/ERMail) 应用的开发中就遇到了这样的问题，作为一款邮件客户端，IMAP 协议下的自动登录依然要在用户的本地保存密码。

无论你采用哪一种加密协议保存用户的密码，由于客户端与黑客的信息量都是相同的，所以客户端能解密出来黑客就一定能解密出来。所以，单纯地依靠应用自身是无法完成安全的密码保存的，利用操作系统、密码服务器或者其他硬件作为中转是一定需要采用的方案。

后两者的成本较高，采用操作系统自带的凭据管理器是成本较低的方案。于是我找到了 `PasswordVault`。

微软官网对 `PasswordVault` 有全面的介绍：[PasswordVault Class (Windows.Security.Credentials) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/uwp/api/windows.security.credentials.passwordvault)，使用起来也是非常简单的。通过 `Add(PasswordCredential)` 方法完成密码的保存，使用 `Retrieve(String, String?wt.mc_id=MVP)` 完成密码的读取。

每一个 UWP 应用之间的 `PasswordVault` 是独立且互相不可访问的，普通用户也无法直接获取到密码；对于黑客，如果无法黑掉用户账户，也是无法解密出密码的，所以在一般使用场景下，安全性是够的。

如果需要保存密码：

```csharp
var vault = new PasswordVault();
vault.Add(new PasswordCredential("Walterlv.Demo.Uwp", "walterlv", "t^vxR1kuR7@7*zZh"));
```

其中，`walterlv` 是保存的用户名，`t^vxR1kuR7@7*zZh` 是保存的密码。

如果需要获取此前保存的密码：

```csharp
var vault = new PasswordVault();
var credential = vault.Retrieve("Walterlv.Demo.Uwp", "walterlv");
var password = credential.Password;
```

得到的 `password` 即是密码字符串 `t^vxR1kuR7@7*zZh`。

在 [ERMail](https://github.com/walterlv/ERMail) 中，考虑到多数代码是跨平台的，所以我使用 `IPasswordManager` 接口来隔离这种 UWP 平台特定的方法。于是 [ERMail](https://github.com/walterlv/ERMail) 的 UWP 版本的密码管理实现就像如下这么简单：

```csharp
using Windows.Security.Credentials;
using Walterlv.ERMail.Mailing;

namespace Walterlv.ERMail.Utils
{
    internal class PasswordManager : IPasswordManager
    {
        private const string MailVaultResourceName = "Walterlv.ERMail";

        internal static IPasswordManager Current = new PasswordManager();

        string IPasswordManager.Retrieve(string key)
        {
            var vault = new PasswordVault();
            var credential = vault.Retrieve(MailVaultResourceName, key);
            return credential.Password;
        }

        void IPasswordManager.Add(string key, string password)
        {
            var vault = new PasswordVault();
            vault.Add(new PasswordCredential(MailVaultResourceName, key, password));
        }
    }
}
```

