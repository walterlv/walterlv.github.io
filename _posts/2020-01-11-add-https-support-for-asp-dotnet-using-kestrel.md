---
title: "使用 Kestrel 为你的 ASP.NET Core 服务添加 https 支持"
date: 2020-01-11 20:10:40 +0800
categories: dotnet web
position: starter
---

Kestrel 是一个跨平台的适用于 ASP.NET Core 的 Web 服务器。它内置集成在了 ASP.NET Core 项目模板中，所以编写和对外开放一个 Web 服务会非常简单。

虽然不推荐直接使用 Kestrel 对外提供 Web 服务，但为了简单的话，临时使用也是非常不错的选择。

---

Kestrel 是一个跨平台的适用于 ASP.NET Core 的 Web 服务器。

Kestrel 只是一个 Web 服务器，能够提供对外的 Web 服务；但它没有反向代理功能。也就是说当你使用 Kestrel 指定了一个端口后，这个端口的所有流量将被 Kestrel 处理，不能再与其他 Web 服务程序共用端口了。当然还有一些其他的原因（比如 Web 安全防护），所以通常并不推荐直接使用 Kestrel 对外提供 Web 服务。

但有一点——Kestrel 内置集成在了 ASP.NET Core 项目模板中，所以编写和对外开放一个 Web 服务会非常简单，这也使得 Kestrel 值得被临时使用一下。

<div id="toc"></div>

## 配置 Kestrel

当你使用 dotnet 命令或者 Visual Studio 创建 ASP.NET Core 项目后，在 `ConfigureWebHostDefaults` 扩展方法的委托参数中，使用 `webBuilder` 对象可以用来配置 Kestrel 服务器。

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
++                  // 在这里设置 Kestrel 的一些配置属性。
++              })
                .UseStartup<Startup>();
            });
```

## 配置 https

配置 Kestrel 时，只需要调用 `serverOptions` 的 `Listen` 方法设置监听的 IP 和端口。并且，可以额外写一个委托用来设置监听参数。

使用 `listenOptions.UseHttps` 即可使用 SSL 证书来支持 https 协议。

```diff
    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.ConfigureKestrel(serverOptions =>
                {
++                  serverOptions.Listen(IPAddress.Any, 5000, listenOptions =>
++                  {
++                      listenOptions.UseHttps(
++                          @"D:\blog.walterlv.com\ssl\blog-walterlv-com.pfx",
++                          "Hqh#Q*QqV%@aCnx41UB%M31H");
++                  });
                })
                .UseStartup<Startup>();
            });
```

**这种把密码写在代码中的做法一定要拖出去打**！

不过我需要做博客中介绍以下这里是传入密码的，你可以采用其他的方式将密码存起来。比如放入 Windows 凭据管理器中，或者以其他加密的方式存在服务器/个人电脑上。

如果不指定证书，也可以使用 https，不过这使用的是默认的配置，只能用在 `localhost` 中。

另外，如果你还没有 SSL 证书，可以先阅读我的另一篇博客了解如何申请免费的 SSL 证书：

- [使用 freessl.org 为你的域名申请免费的 SSL 证书](/post/apply-for-free-ssl-certificates-using-freessl)

至此，你的 ASP.NET Core 服务已经可以通过 https 对外提供服务了。

## 更多配置

除了在 `Startup` 中使用上文提供的配置代码之外，还可以为 https 配置其他参数。

```csharp
webBuilder.ConfigureKestrel(serverOptions =>
{
    serverOptions.ConfigureEndpointDefaults(listenOptions =>
    {
        // 配置终结点
    });

    serverOptions.ConfigureHttpsDefaults(listenOptions =>
    {
        listenOptions.SslProtocols = SslProtocols.Tls12;
    });
});
```

如果你的 Kestrel 服务面向多个域名，那么也可以配置不同的域名使用不同的证书配置：

```csharp
webBuilder.ConfigureKestrel(serverOptions =>
{
    serverOptions.Listen(IPAddress.Any, 5000, listenOptions =>
    {
        listenOptions.UseHttps(httpsOptions =>
        {
            var certificates = new Dictionary<string, X509Certificate2>(StringComparer.OrdinalIgnoreCase)
            {
                {
                    "localhost",
                    CertificateLoader.LoadFromStoreCert("localhost", "My", StoreLocation.CurrentUser, true)
                },
                {
                    "walterlv.com",
                    CertificateLoader.LoadFromStoreCert("walterlv.com", "My", StoreLocation.CurrentUser, true)
                },
                {
                    "blog.walterlv.com",
                    CertificateLoader.LoadFromStoreCert("blog.walterlv.com", "My", StoreLocation.CurrentUser, true)
                }
            };

            httpsOptions.ServerCertificateSelector = (connectionContext, name) =>
                name != null && certificates.TryGetValue(name, out var cert)
                    ? cert
                    : certificates["walterlv.com"];
        });
    });
})
```

## 使用更强大的方法配置 https

其实我本不应该在博客后面贴上“更多配置”一章的，因为如果需要实现更强大的功能，配置带有反向代理功能的 Web 服务器会强大得多。

可以阅读：

- [三种方法为 ASP.NET Core 对外服务添加 https 支持（kestrel / frp / nginx）](/post/add-https-support-for-asp-dotnet)
- [使用 Frp 为你的 Web 服务添加 https 支持](/post/add-https-support-for-web-service-using-frp)
- [使用 Nginx 为你的 Web 服务添加 https 支持](/post/add-https-support-for-web-service-using-nginx)

---

**参考资料**

- [ASP.NET Core 中的 Kestrel Web 服务器实现 - Microsoft Docs](https://docs.microsoft.com/zh-cn/aspnet/core/fundamentals/servers/kestrel?view=aspnetcore-3.1)
