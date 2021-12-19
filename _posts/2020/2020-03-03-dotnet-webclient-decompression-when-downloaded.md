---
title: ".NET WebClient 类下载部分文件会错误？可能是解压缩的锅"
publishDate: 2020-03-03 16:26:02 +0800
date: 2020-03-11 17:02:19 +0800
tags: dotnet
position: problem
coverImage: /static/posts/2020-03-11-17-01-05.png
---

一直在使用 `WebClient` 下载文件，.NET 已经封装好，所以用起来代码非常简洁；但直到今天发现有一个文件一直不能正确下载下来。

本文介绍这个问题的原因和解决方法，更重要的是给出调查方法。

---

<div id="toc"></div>

本文所涉及到的域名已经过敏感信息处理，所以实际上你是无法访问到的；但这不影响本文对调查方法的描述。

## 问题

我原本是使用如下的代码去下载任意文件的（参数经过简化）。

```csharp
private static async Task DownloadFileAsync()
{
    var url = "http://localhost:5000/walterlv-icon.svg";
    var fileName = @"C:\Users\lvyi\Desktop\TEST\walterlv-icon.svg";

    using var webClient = new WebClient();
    webClient.DownloadFile(new Uri(url), fileName);
}
```

现在，下载一个 svg 的时候，原本应该是如下的图片：

![walterlv-icon.svg](/static/posts/2020-03-03-walterlv-icon.svg)

然而实际上下载下来之后却是这样的：

![walterlv-icon.svg](/static/posts/2020-03-03-walterlv-icon-downloaded.svg)

原本大小是 992 字节，实际下载下来后是 508 字节，而且固定是 508 字节。你可以通过右键复制图片地址，然后分别把两张图下载下来看。

## 调查

显然，`WebClient` 没有抛出任何异常，而且每次下载下来都是固定的 508 字节，说明肯定不是网络不通或程序提前退出导致的，也不是线程安全相关的问题。基本可以认定为问题出在服务器的配置，或者客户端的请求上。

### 使用其他“正常”下载器尝试

拿 Chrome 跑以上地址，拿专用下载工具跑以上地址，甚至是拿 Postman 跑以上地址，都可以成功显示或者下载到正确的图片。

这几乎可以肯定，问题出在 .NET 的 WebClient 上，可能是请求不对，或者对响应的后续处理不对。

### 使用 Postman 和 WebClient 对比测试

为了对比请求和响应，我使用的是 Fiddler 抓包。

`WebClient` 请求：

```yaml
GET http://localhost:5000/walterlv-icon.svg HTTP/1.1
Host: localhost:5000
Connection: Keep-Alive
```

`WebClient` 响应（因为内含乱码，会让网页显示不正常，所以放截图）：

![WebClient 响应](/static/posts/2020-03-11-17-01-05.png)

Postman 请求：

```yaml
GET http://localhost:5000/walterlv-icon.svg HTTP/1.1
Content-Type: application/json
User-Agent: PostmanRuntime/7.22.0
Accept: */*
Cache-Control: no-cache
Postman-Token: 05bb3d80-d7a7-4c0d-bdd1-9cd65d79ecab
Host: localhost:5000
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```

Postman 响应（因为内含乱码，会让网页显示不正常，所以放截图）：

![Postman 响应](/static/posts/2020-03-11-17-02-13.png)

请求和响应贴得很长，这可以让比较感兴趣的小伙伴仔细比较。但这里我直接给出我比较后的结论：

1. Postman 的请求会发送比较多的头
2. 两者的响应几乎相同（包括文件大小和内容）

由于响应几乎相同，所以实际上前面请求头的不同可以忽略了（至少说明返回的内容没有因为请求的不同而有所变化），我们能够拿到完整的整个文件。

那么问题基本确定就是在 WebClient 对这个响应的处理上了。

可以注意到 Postman 的请求中有 `Accept-Encoding`，两折的响应中都有 `Content-Encoding`，指定了 `gzip`。然而这是 Linux 中用来压缩文件的命令。响应中指定了内容编码方式为 `gzip` 是否意味着我们下载下来的文件实际上是一个 gzip 压缩文件呢？

于是我将下载下来的文件扩展名改为 gzip，用压缩文件打开，于是真的可以解压出来真实的图片。

于是确认问题的原因是 `WebClient` 在处理响应的时候没有根据 `Content-Encoding` 的值解压缩下载下来的文件。

## 解决

解决的思路：

- 使 `WebClient` 支持下载文件后解压缩
<!-- 2. 不要使用 `WebClient` 下载 -->

### 使 `WebClient` 支持下载文件后解压缩

各种检查后发现，`WebClient` 竟然没有提供设置解压缩相关的属性。庆幸的是，在网上搜索 `WebClient` 和 `gzip` 关键字后，找到了这一篇答案：[.net - Automatically decompress gzip response via WebClient.DownloadData - Stack Overflow](https://stackoverflow.com/a/4914874/6233938)。

我们需要重写 `WebClient.GetWebRequest` 方法，然后改写 `AutomaticDecompression` 属性。此属性可以改成 `gzip`、`deflate` 和 `br` 或者它们的组合，这与 Postman 发请求时声明支持的值是完全一样的。

```csharp
class AutoDecompressionWebClient : WebClient
{
    protected override WebRequest GetWebRequest(Uri address)
    {
        var baseRequest = base.GetWebRequest(address);
        if (baseRequest is HttpWebRequest httpWebRequest)
        {
            httpWebRequest.AutomaticDecompression = DecompressionMethods.All;
        }
        return baseRequest;
    }
}
```

另外，也可以在拉取到响应的流后自己去做解压，可以参见：

- [.net - How do you download and extract a gzipped file with C#? - Stack Overflow](https://stackoverflow.com/a/16856/6233938)

---

**参考资料**

- [.net - Automatically decompress gzip response via WebClient.DownloadData - Stack Overflow](https://stackoverflow.com/a/4914874/6233938)
- [c# - WebClient.DownloadFile File Corrupt - Stack Overflow](https://stackoverflow.com/questions/19227156/webclient-downloadfile-file-corrupt)
- [Download file using Webclient shows Wrong Data - CodeProject](https://www.codeproject.com/Questions/620959/Download-file-using-Webclient-shows-Wrong-Data)
- [[Solved] WebClient DownloadFile method downloads damaged PDF files - CodeProject](https://www.codeproject.com/Questions/604484/WebClient-DownloadFileplusdownloadsplusdamagedplus)

