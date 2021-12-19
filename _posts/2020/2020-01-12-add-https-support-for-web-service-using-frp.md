---
title: "使用 Frp 为你的 Web 服务添加 https 支持"
publishDate: 2020-01-12 19:27:28 +0800
date: 2020-01-13 08:03:28 +0800
tags: web
position: starter
coverImage: /static/posts/2020-01-12-19-15-53.png
---

> frp 是一个可用于内网穿透的高性能的反向代理应用，支持 tcp, udp 协议，为 http 和 https 应用协议提供了额外的能力，且尝试性支持了点对点穿透。

在众多反向代理应用中，frp 的最大特点就在于内网穿透。所以，如果你有将内网对外提供 Web 服务的需求，就可以考虑使用 frp 为你的 Web 服务提供 https 支持。

---

<div id="toc"></div>

## 下载 frp

前往 GitHub 下载 frp：

- [Releases · fatedier/frp](https://github.com/fatedier/frp/releases)

有适用于各种不同操作系统的 frp，如果你对外提供的公网服务器和实际提供 Web 服务的服务器不是同一台机器的话，需要为各自机器下载对应版本的 frp。

## 准备好 Web 服务和 SSL 证书

你可以用任何方式开发你的 Web 服务，注意你的 Web 服务需要监听一个本机端口。

对于准备 SSL 证书，你可以参考我的另一篇博客：

- [使用 freessl.org 为你的域名申请免费的 SSL 证书](/post/apply-for-free-ssl-certificates-using-freessl)

对于本文的后续内容，你需要将证书导出成 Nginx 格式，即一个 crt 文件和一个 key 文件。

## 配置 frp

你需要准备运行一个 frp 服务端和一个 frp 客户端。它们可以运行在不同的机器上，也可以运行在同一台机器上。

鉴于 frp 的内网穿透的优势，如果你将这两个端部署在不同的机器上，就能够实现 https 支持的同时也做到内网穿透——即你可以将 NAT 网络中的一台电脑对全球公开的互联网提供服务。

当然，你也可以部署到同一台机器上，这样的优势就是一个端口可以服务很多的 Web 服务，同时支持 https。

接下来的描述中，我用 A 机器表示 frp 服务端（也就是对公众开放服务的一端），B 机器表示 frp 客户端（提供 Web 服务的一端）。它们可以是同一台机器，也可以是不同的机器。

### 反向代理服务端

A 机器需要修改 frps.ini 文件：

```ini
[common]
bind_port = 7000
vhost_http_port = 80
vhost_https_port = 443
```

▲ bind_port 是 frp 服务端口，客户端如果要使用 frp 服务则连接这个端口；vhost_http_port 是代理 http 的端口；vhost_https_port 是代理 https 的端口

配置完成之后，运行 frp 程序：

```powershell
./frps -c ./frps.ini
```

▲ 对于 Linux 系统

```powershell
./frps.exe -c ./frps.ini
```

▲ 对于 Windows 系统

于是，A 机器就配置好了。

### 反向代理客户端

B 机器的配置将是 https 支持的重点：

```ini
[common]
# 这里填写 A 机器的 IP 或者域名
server_addr = 100.13.*.*
# 填写 A 机器开放的 frp 服务端口，也就是 frps.ini 配置文件中 bind_port 的值
server_port = 7000

[walterlv_example_http]
# 依然支持 http 访问
type = http
# 本地 Web 服务的端口
local_port = 10000
# 需要反向代理的域名（当访客通过此域名访问 A 机器时，才会将请求反向代理到此 Web 服务）
custom_domains = example.walterlv.com

[walterlv_example]
# 配置 https 访问
type = https
# 本地 Web 服务的端口（与前面的配置一样，都对应同一个 Web 服务）
local_port = 10000
# 需要反向代理的域名（当访客通过此域名访问 A 机器时，才会将请求反向代理到此 Web 服务）
custom_domains = example.walterlv.com

# 接下来的配置是支持 https 的重点配置
# 配置插件，将 https 请求转换成 http 请求后再发送给本地 Web 服务程序
plugin = https2http
# 转换成 http 后，发送到本机的 10000 端口
plugin_local_addr = 127.0.0.1:10000
# 可能是 frp 的 Bug？这里必须写成 127.0.0.1，稍后解释
plugin_host_header_rewrite = 127.0.0.1
# 指定代理方式为 frp
plugin_header_X-From-Where = frp
# 指定成你在前面部分导出的证书的路径
plugin_crt_path = C:/Samples/_.walterlv.com_chain.crt
plugin_key_path = C:/Samples/_.walterlv.com_key.key
```

这就是 frp 的特色，重点配置都放到了反向代理的客户端中。这样的配置方式安全性自然成了问题，但也正因为如此，才可以真正实现带有内网穿透的反向代理。

接下来介绍以下这个文件里面为什么是这样配置的。

`[Common]` 节点是为了与 frp 服务端取得联系的。所以 `server_addr` 和 `server_port` 自然成了必要，毕竟连接一个 Web 服务这是两个必要的参数。如果你的两个端部署在同一台电脑上，那么这里可以填写 `127.0.0.1`。

`[walterlv_example_http]` 节点和 `[walterlv_example]` 两个节点的名称是随便取的，不需要满足什么规律。唯一的要求是，连接到此 frp 服务端的所有客户端之间，这个名称都不能重复。frp 的服务端通过此名称来区分不同的客户端配置。因此，通常将这个名称命名成域名或者功能名。

`[walterlv_example_http]` 节点配置来兼容 http 访问。如果不配置这一个节点，那么使用 http 访问的访客将得到 frp 服务器返回的 403 状态码。这里的三项配置表示，如果使用 http 协议访问此 frp 服务端，且访问域名是 `example.walterlv.com`（http 头里写的），那么将此请求转发到 frp 客户端本机的 `10000` 端口。

`[walterlv_example]` 节点的前三项与 `[walterlv_example_http]` 一样，含义也是一样的。接下来就是启用 `https2http` 插件，将访问 frp 服务端的 https 流量全部转换成 http 流量，然后转发给本机的 http 服务。`plugin_local_addr` 就是指定转发到本机的 `10000` 端口。当然你也可以写成非本机的 http 服务，例如 `walterlv.github.io:80`，这样，https 流量转换成 http 流量后会发给对应的机器。`plugin_host_header_rewrite` 在目前（frp 0.31.1 版本），这个值必须写成 `127.0.0.1`，否则会出现错误的重定向（例如，如果指定成 `example.walterlv.com` 会导致流量回流到 frp 服务端，这绝对是反向代理的一个 Bug！）这个值的含义是修改 http 的请求头，将请求头中的域名部分改写成 `127.0.0.1`（在改写之前，头是 `example.walterlv.com`）。`plugin_crt_path` 和 `plugin_key_path` 指定为 SSL 证书的路径。`plugin_header_X-From-Where` 则不是必须的。

## 工作原理

使用 frp 让 Web 服务支持 https 的流程是一个典型的反向代理服务器的工作流程。

![frp 反向代理支持 https 的流程](/static/posts/2020-01-12-19-15-53.png)

访客在浏览器中输入网址 <https://blog.walterlv.com> 后，浏览器会查询 <blog.walterlv.com> 的 IP，查询到之后，向此 IP 的 443 端口发送 https 请求。frp 服务端收到此请求后检查访问的域名，发现曾经连接此 frp 服务端的一个客户端配置了此域名的反向代理。于是将请求转发给此客户端。frp 客户端在收到转发的 https 请求后，使用 SSL 证书将 https 解密成 http 请求，然后修改 http 头添加或修改额外的信息。最后，frp 客户端将修改后的 http 请求转发给本机的真正的 Web 服务程序。当 Web 服务程序处理完 Web 请求后，响应沿着原路返回。

这里值得注意的是，由于 frp 反向代理系统中，使用 SSL 证书的一端在 frp 客户端，这意味着 frp 服务端完全无法得知此 https 请求的内容。于是在转发后也无法得知此请求的真实来源（访客 IP），这样，真实的 Web 服务将无法得知真实的访客信息。这也是 frp 在此设计下必然出现的缺陷。

如果你希望你的 Web 服务在 https 下破除这些限制，那么建议使用其他的反向代理服务器。关于其他配置 https 的方法，你可以阅读：

- [三种方法为 ASP.NET Core 对外服务添加 https 支持（kestrel / frp / nginx）](/post/add-https-support-for-asp-dotnet)
- [使用 Kestrel 为你的 ASP.NET Core 服务添加 https 支持](/post/add-https-support-for-asp-dotnet-using-kestrel)
- [使用 Nginx 为你的 Web 服务添加 https 支持](/post/add-https-support-for-web-service-using-nginx)

除了 frp 以外的方法都可以获得真实的访客信息。

---

**参考资料**

- [frp/README_zh.md at master · fatedier/frp](https://github.com/fatedier/frp/blob/master/README_zh.md)

