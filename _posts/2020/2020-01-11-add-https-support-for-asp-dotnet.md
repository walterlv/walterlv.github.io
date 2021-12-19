---
title: "三种方法为 ASP.NET Core 对外服务添加 https 支持（kestrel / frp / nginx）"
date: 2020-01-11 20:10:25 +0800
tags: dotnet web
position: starter
---

虽然使用 Visual Studio 创建 ASP.NET Core 程序的时候可以选择是否添加 https 支持，不过这种方式只添加了 `localhost` 的证书，只有本地访问时浏览器才会承认。真正对外公开服务的时候这样是绝对没法儿提供 https 服务的。

本文介绍使用三种不同的方式添加 https 的支持，三种方法各有优劣，本文会进行比较并给出不同的适用场景。你自己选择就好。

---

<div id="toc"></div>

## 你需要有一个证书

如果你还没有证书，可以考虑去 <https://freessl.org/> 免费申请一个。可以为泛域名申请 3 个月有效期的证书（Let's Encrypt），或者为单域名申请 6 个月有效期的证书（buypass）。

如果不知道如何操作，可以参考我的另一篇博客：

- [使用 freessl.org 为你的域名申请免费的 SSL 证书](/post/apply-for-free-ssl-certificates-using-freessl)

你可以在以上博客中得到四种不同格式的证书（Nginx/Apache/IIS/Tomcat），下面的方法中每一种方法会使用到其中的一种证书。

## 方法

实际上，只要是一个 Web 服务器就可以为 ASP.NET Core 服务程序提供 https 的支持，不过本文只会介绍下面这三种方法：

- Kestrel
    - 这是 ASP.NET Core 自带提供的 Web 服务器
- Frp
    - 这是一个开源即将收费的反向代理服务
- Nginx
    - 这是非常强大的 Web 服务器，同时也是强大的反向代理服务器

Kestrel 最简单，几句代码即可配完。Frp 相对来说也很简单。而 Nginx 非常强大，几乎适用于各种 Web 服务场景。

Nginx 支持 http2，Kestrel 的 Windows 和 Linux 版本支持 http2。

---

发现写成一篇博客会模糊这些方法之间的步骤，所以我将它们分别写成了几篇博客：

- [使用 Kestrel 为你的 ASP.NET Core 服务添加 https 支持](/post/add-https-support-for-asp-dotnet-using-kestrel)
- [使用 Frp 为你的 Web 服务添加 https 支持](/post/add-https-support-for-web-service-using-frp)
- [使用 Nginx 为你的 Web 服务添加 https 支持](/post/add-https-support-for-web-service-using-nginx)
