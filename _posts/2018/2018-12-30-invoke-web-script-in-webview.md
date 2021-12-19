---
title: "UWP 在 WebView 中执行 JavaScript 代码（用于模拟用户输入等）"
publishDate: 2018-12-30 22:08:37 +0800
date: 2019-03-09 09:10:11 +0800
tags: uwp javascript
position: starter
coverImage: /static/posts/2018-12-30-21-49-37.png
permalink: /post/invoke-web-script-in-webview.html
---

UWP 中使用 WebView 时可以在网页中额外执行一些代码。于是你几乎可以在网页上做任何事情，那些你可以在浏览器控制台中做的事情。

本文将介绍做法。

---

<div id="toc"></div>

## 准备环境

在页面（XAML）中放一个 `WebView`，然后取个名字，比如就叫做 `WebView`。

监听 `NavigationCompleted` 事件，然后导航到需要操作的页面。

```csharp
WebView.NavigationCompleted += OnNavigationCompleted;
WebView.Navigate(new Uri("https://blog.walterlv.com"));
```

```csharp
private async void OnNavigationCompleted(WebView sender, WebViewNavigationCompletedEventArgs e)
{
    // 我们接下来的代码都将在这里编写。
}
```

要执行 JavaScript 代码，必须要导航完成才行，所以我们接下来的代码都是写在 `NavigationCompleted` 事件处理函数中的。

## 执行 JavaScript 代码

### 模拟用户输入

下面这一句的代码是填充用户 Id 一栏：

```csharp
await WebView.InvokeScriptAsync("eval", new[]
{
    "document.getElementById('userId').value = 'walterlv';"
});
```

![登录页面](/static/posts/2018-12-30-21-49-37.png)

登录页面截图来自于 [码友网](https://codedefault.com/)。

### JavaScript eval(string) 函数

在上面的代码中，`eval` 是指执行 JavaScript 的 `eval` 函数，并且将后面的字符串数组作为它的参数传入。

在 JavaScript 中，`eval(string)` 函数可计算某个字符串，并执行其中的的 JavaScript 代码。在计算结束后，会返回一个字符串，就是参数中那个字符串执行完之后的返回值（如果有的话）。

于是意味着你可以通过这种方式拿到输入框中的值：

```csharp
var userId = await WebView.InvokeScriptAsync("eval", new[]
{
    "document.getElementById('userId').value;"
});
```

执行完后，可以得到 `userId` 的值是 `walterlv` 字符串；也就是我们上一步填充的那个值。

### 模拟用户登录

完整的输入用户名、密码，并点击登录按钮的代码则是这样的：

```csharp
await LoginWebView.InvokeScriptAsync("eval", new[]
{
    "document.getElementById('userId').value = 'walterlv';"
});
await LoginWebView.InvokeScriptAsync("eval", new[]
{
    "document.getElementById('password').value = '不想让你看见的密码';"
});
await Task.Delay(1000);
await LoginWebView.InvokeScriptAsync("eval", new[]
{
    "document.getElementById('submit').click();"
});
```

---

**参考资料**

- [JavaScript eval() 函数](http://www.w3school.com.cn/js/jsref_eval.asp)
- [win10 uwp 模拟网页输入](https://blog.lindexi.com/post/win10-uwp-%E6%A8%A1%E6%8B%9F%E7%BD%91%E9%A1%B5%E8%BE%93%E5%85%A5.html)


