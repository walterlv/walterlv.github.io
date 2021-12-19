---
title: "如何设置 ASP.NET Core 程序监听的 IP 和端口"
publishDate: 2020-01-12 21:31:22 +0800
date: 2020-01-13 08:04:22 +0800
tags: dotnet web
position: starter
---

Web 服务需要配置监听的 IP 和端口才可以对外提供真正的服务。本文介绍如何设置 ASP.NET Core 程序监听的 IP 和端口。

---

ASP.NET Core 程序默认集成了 Kestrel 服务器，可以直接对外提供 Web 服务。虽然可以直接提供服务，但通常建议使用反向代理服务器来间接提供服务。因此，本文建议的大多数设置监听 IP 和端口的方法都是“临时方法”，即那种“配置出来”的方法，而不会直接写死在代码中。

<div id="toc"></div>

## 如何选择应该监听的 IP 和端口？

一般来说，监听的 IP 可以选择本地回环地址，特定的 IP 以及任意 IP，分别是：

- `127.0.0.1` `127.0.0.2` `127.0.0.3`…… 本地回环地址
- `101.199.96.22` 特定的 IP
- `0.0.0.0` 任意 IP

监听本地回环地址时，则访问仅限于本机应用程序，不需要管理员权限来添加防火墙配置。如果在本地计算机配置了反向代理服务器，则强烈推荐使用本地回环地址。如果打算直接让服务对外公开提供，则需要设置为 `0.0.0.0` 任意 IP。

一台计算机上不同的应用不能使用相同的端口，对于端口的选择只要不重复即可。如果希望让 ASP.NET Core 程序自动选择一个不重复的端口，则将其指定为 0。

## 配置方法

### 方法一：直接在项目中设置

在项目上右击属性，在调试标签下可以修改应用的启动 URL。虽然这里修改的是项目的设置，最终生成的 ASP.NET Core 程序并不会使用这个设置，但每次通过项目打开时仍然可以使用这个设置。

![在项目中设置](/static/posts/2020-01-12-21-08-49.png)

这种方式仅仅影响调试时候采用的域名 / IP 和端口号。因此，仅在调试期间生效，待发布后，可以直接接入到反向代理服务器中。

### 方法二：使用 Kestrel 服务器的配置（不推荐）

直接使用 Kestrel 服务器可以在没有反向代理服务器的情况下直接对外提供 ASP.NET Core 的 Web 服务。

如果仅对外提供 http 服务，则设置非常简单：

```diff
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build().Run();
    }

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
++              webBuilder.ConfigureKestrel(serverOptions =>
++              {
++                  serverOptions.Listen("0.0.0.0", 5000);
++              })
                .UseStartup<Startup>();
            });
```

如果希望加上 https 的支持，可以阅读我的另一篇博客：

- [使用 Kestrel 为你的 ASP.NET Core 服务添加 https 支持](/post/add-https-support-for-asp-dotnet-using-kestrel)

### 方法三：使用命令行参数指定

使用命令行参数 `--urls` 可以为 ASP.NET Core 程序指定监听的 URL。

```powershell
dotnet ./blog.walterlv.com.exe --urls http://0.0.0.0:13800
```

这个 URL 中的几个信息都会用到：http 协议，监听任意 IP 地址，监听端口 13800。

通常建议为反向代理的服务选用 http，让 https 的支持交给反向代理服务器去做，参见：

- [三种方法为 ASP.NET Core 对外服务添加 https 支持（kestrel / frp / nginx）](/post/add-https-support-for-asp-dotnet)

### 方法四：设置环境变量

设置环境变量 `ASPNETCORE_URLS` 即可为 ASP.NET Core 程序指定监听的 URL，格式与上面使用命令行参数是一样的。

注意，这里说的环境变量是单独为某一个程序设置的环境变量，而不是为用户账户或者操作系统设置的环境变量（那样显然会让所有 ASP.NET Core 程序冲突）。所以通常都是用来在反向代理服务器中配置的。
