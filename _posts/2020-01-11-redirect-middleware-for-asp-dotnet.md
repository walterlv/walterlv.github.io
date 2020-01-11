---
title: "为 ASP.NET Core 程序制作 URL 的 301/302 跳转"
date: 2020-01-11 17:33:51 +0800
categories: dotnet web blazor
position: starter
---

如果你有一些需要重定向网页 URL 的情况，可以返回 HTTP 状态码 301/302 告诉浏览器或者搜索引擎访问新的 URL。本文描述如何在 ASP.NET Core 中进行重定向。

---

<div id="toc"></div>

## HTTP 状态码 301/302

301 表示“Moved Permanently”，即永久移动。通过返回此状态码可以告知浏览器或者搜索引擎此 URL 已经永久移动到了新的 URL 地址。搜索引擎会使用新的 URL 来更新自己的搜索结果，而浏览器会将此 URL 重定向缓存起来，下次访问的时候直接使用新的 URL 来访问。

302 表示“Found”，发现；原始描述为“Moved Temporarily”，即临时移动。通过返回此状态码可以告知浏览器或者搜索引擎此 URL 临时移动到了新的 URL 地址。搜索引擎会使用此新的 URL 来抓取页面的内容但不会更新此 URL，而浏览器会访问新的 URL 但不会缓存此 URL 重定向。

还有其他的重定向的 HTTP 状态码，不过并不常用：

- 303 See Other
- 307 Temporary Redirect
- 308 Permanent Redirect

## ASP.NET Core

ASP.NET Core 的 Blazor 框架生成的页面在路由的时候是不识别 `.html` 后缀的，而带有 `.html` 后缀的 URL 会被识别为静态文件。于是，如果创建了一个空的 Blazor 应用，当访问 <https://blog.walterlv.com/post/redirect-middleware-for-asp-dotnet.html> 网址的时候，会返回 404 Not Found，而不是路由到我的博客页面。

如果我们将此 URL 重定向到不带后缀的 URL，则可以被 Blazor 框架识别并正确显示对应的博客页面。

我们有两个不同的方式来实现这种 URL 的重定向：

1. 做一个重定向的控制器 `Controller`，然后在控制器中重定向所有的博客页面
2. 做一个重定向的中间件，对所有包含 `.html` 后缀的博客页面重定向到没有 `.html` 后缀的博客页面

不过，写一个 `Controller` 会要求这个 `Controller` 路由到几乎所有的 URL 上，对其他功能很不利，所以中间件是最合适的方式。

## 重定向中间件

```diff
    public class Startup
    {
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
++          app.UseAutoRemoveHtmlExtension();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapBlazorHub();
                endpoints.MapFallbackToPage("/_Host");
            });
            app.UseStaticFiles();
        }
    }
```

在 `Startup` 类的 `Configure` 方法中可以添加中间件。为了实现去掉 `.html` 后缀的中间件，我添加了一个自己的扩展方法 `UseAutoRemoveHtmlExtension`。

```csharp
/// <summary>
/// 自动移除所有的 .html 后缀，并永久重定向到没有 .html 后缀的网页。
/// </summary>
/// <param name="app"><see cref="IApplicationBuilder"/>。</param>
/// <returns><see cref="IApplicationBuilder"/>。</returns>
public static IApplicationBuilder UseAutoRemoveHtmlExtension(this IApplicationBuilder app) => app.Use(async (context, next) =>
{
    var urlPath = context.Request.Path.HasValue
        ? context.Request.Path.Value
        : "";
    if (urlPath.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
    {
        // 去掉 .html 后缀
        var url = urlPath[0..^5];
        context.Response.Redirect(url);
        context.Response.StatusCode = 301;
        return;
    }
    await next().ConfigureAwait(false);
});
```

实现自己的中间件实际上直接调用 `IApplicationBuilder` 中的 `Use` 方法即可，传入一个委托用来在 URL 处理过程中添加一个步骤。

两个参数，`context` 中包含了本次请求的一些上下文，包括域名、URL 路径，返回的 HTTP 状态码。调用 `context.Response.Redirect` 方法可以进行 302 跳转。如果需要改成 301 跳转，则直接设置 `context.Response.StatusCode` 方法即可。

接下来，对于不需要重定向的网址，我们直接交给后面的中间件处理，调用 `await next()`。

## 重定向

如果你希望做其他种类的跳转，你也可以添加新的中间件，比如：

1. 将 HTTP 重定向到 HTTPS（谷歌建议使用 301 跳转）
2. 你可以在打开某个网页之前要求登录，于是做一个 302 跳转到登录页面；
3. 你可以将一些已经过时的网页进行 301 跳转到新的网页；
    - 比如我将一些之前不太规范的博客 URL 重定向到统一的格式；
4. 你可以在迁移服务的时候临时做一个 302 跳转。

## 小心缓存

请注意，301 重定向会被浏览器缓存。也就是说如果你重定向到了一个错误的网址，那么再次访问的话浏览器将直接访问这个错误的网址。如果希望浏览器停止重定向到这个错误的网址，需要清除浏览器的缓存。所以使用 301 的时候需要谨慎一些。

---

**参考资料**

- [HTTP 302 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/HTTP_302)
