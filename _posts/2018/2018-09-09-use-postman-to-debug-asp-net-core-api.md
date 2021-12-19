---
title: "使用 Postman 调试 ASP.NET Core 开发的 API"
publishDate: 2018-09-09 20:38:19 +0800
date: 2019-03-09 09:07:59 +0800
tags: dotnet csharp asp
coverImage: /static/posts/2018-09-09-19-54-25.png
permalink: /posts/use-postman-to-debug-asp-net-core-api.html
---

使用 ASP.NET Core 开发简单的后台 API 还是非常容易的。涉及到 GET 请求的调试我们可以用浏览器简单搞定，那么 POST/PUT/DELETE 这样的请求呢？

本文将使用 Postman 来调试这些请求。

---

<div id="toc"></div>

## 简单的 ASP.NET Core 程序

如果你还不清楚如何编写一个 ASP.NET Core 程序，可以阅读 [win10 uwp 手把手教你使用 asp dotnet core 做 cs 程序](https://blog.lindexi.com/post/win10-uwp-%E6%89%8B%E6%8A%8A%E6%89%8B%E6%95%99%E4%BD%A0%E4%BD%BF%E7%94%A8-asp-dotnet-core-%E5%81%9A-cs-%E7%A8%8B%E5%BA%8F.html) 学习做一个最简单的版本。

我们的重点不是写一个 ASP.NET Core 程序，所以我只贴出最简单的路由地址的处理。

```csharp
using Microsoft.AspNetCore.Mvc;
using Walterlv.WebApi.Rssman.Models;

namespace Walterlv.WebApi.Rssman.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RssController : ControllerBase
    {
        private readonly RssFeedContext _context;

        public RssController(RssFeedContext context)
        {
        }

        // GET: api/Rss
        [HttpGet]
        public ActionResult<List<RssFeedItem>> Get()
        {
            // 省略实现。
        }

        // GET: api/Rss/5
        [HttpGet("{id}", Name = "Get")]
        public ActionResult<RssFeedItem> Get(long id)
        {
            // 省略实现。
        }

        // POST: api/Rss
        [HttpPost]
        public IActionResult Post([FromBody] RssFeedItem item)
        {
            // 省略实现。
        }

        // PUT: api/Rss/5
        [HttpPut("{id}")]
        public IActionResult Put(long id, [FromBody] RssFeedItem item)
        {
            // 省略实现。
        }

        // DELETE: api/ApiWithActions/5
        [HttpDelete("{id}")]
        public IActionResult Delete(long id)
        {
            // 省略实现。
        }
    }
}
```

以上代码是省略了所有实现的，完整的实现可以看这里：[RssController](https://github.com/walterlv/Rssman/blob/master/Rssman.Api/Controllers/RssController.cs)。相关数据模型类的定义可以看这里：

- [RssFeedItem.cs](https://github.com/walterlv/Rssman/blob/master/Rssman.Api/Models/RssFeedItem.cs)
- [RssFeedContext.cs](https://github.com/walterlv/Rssman/blob/master/Rssman.Api/Models/RssFeedContext.cs)

以上程序如果在 Visual Studio 里进行调试，可以在本地搭建一个可访问的 Url。比如: https://localhost:44395/ 。

## 模拟 GET 请求

我们通过浏览器就可以模拟 GET 请求，比如我们在 Chrome / Microsoft Edge / Firefox 中访问 https://localhost:44395/api/rss 会在浏览器中显示结果的 json 字符串：

```json
[
    {
        "id": 1,
        "name": "walterlv",
        "feedUrl": "https://blog.walterlv.com/feed.xml",
        "siteUrl": "https://blog.walterlv.com/"
    },
    {
        "id": 2,
        "name": "lindexi",
        "feedUrl": "https://blog.lindexi.com/feed.xml",
        "siteUrl": "https://blog.lindexi.com/"
    }
]
```

![Chrome 浏览器访问](/static/posts/2018-09-09-19-54-25.png)  
▲ Chrome 浏览器访问

当然，实际上浏览器访问时是没有这些空白字符的，这样可以节省带宽。特别的，Internet Explorer 在访问时会提示保存 rss.json 文件

![IE 浏览器访问](/static/posts/2018-09-09-19-53-57.png)  
▲ IE 浏览器访问

很明显不用去管被时代淘汰的 IE 浏览器。

## 下载安装 Postman

[Postman](https://www.getpostman.com/) 的下载地址在这里 <https://www.getpostman.com/apps>，

![选择你需要的平台](/static/posts/2018-09-09-19-58-04.png)  
▲ 选择你需要的平台

Postman 的安装是极简的，没有任何设置。当启动后，注册或登录你的个人账号，然后填写一些个性化设置即可。

如果你是本地 https 的调试，记得在 Postman 里关掉 SSL 证书验证，不然这种自己签署的证书是无法成功完成请求的。

![关闭 SSL 证书验证](/static/posts/2018-09-09-20-04-23.png)  
▲ 关闭 SSL 证书验证

## 模拟 POST 请求

在 Postman 的主界面，创建一个 HTTP POST 请求只需要几个小步骤：

![创建一个 POST 请求](/static/posts/2018-09-09-20-08-33.png)  
▲ 创建一个 POST 请求

“Send” 按钮点击后，我们便可以在右侧看到此请求的响应：

![请求响应](/static/posts/2018-09-09-20-10-52.png)  
▲ 请求响应

注意，如果你看到的是下面这样的响应界面，记得回到前面的步骤去关闭 SSL 证书验证。

![无法获取响应](/static/posts/2018-09-09-20-11-59.png)  
▲ 无法获取响应

如果你在 Visual Studio 中打了断点，那么现在应该已经进入了断点了：

![Visual Studio 中进入断点](/static/posts/2018-09-09-20-14-24.png)  
▲ Visual Studio 中进入断点

于是你就能调试 POST 请求了。

## 模拟 PUT / PATCH / DELETE / … 请求

同样的，你也可以用 Postman 模拟其他种类的 HTTP 请求。

![模拟其他请求](/static/posts/2018-09-09-20-16-11.png)  
▲ 模拟其他请求

## 关于本文调试的 ASP.NET 程序 Rssman

[Rssman](https://github.com/walterlv/rssman) 是用来管理 RSS 订阅的 ASP.NET 程序，目前正在开发中。


