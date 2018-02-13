---
title: "为 Web 页面添加 iPhone 固定标签页的图标"
date: 2017-10-28 00:16:52 +0800
categories: web ios
---

我曾经将一个 Web 标签页固定到 iPhone 的主屏幕上，发现居然有一个图标。当时没有留意，可直到今天发现我的博客页面在我的 iPhone 主屏幕上显示一片空白后，才想起来原来还可以自定义图标。

---

将 Web 页面图标固定到主屏幕：

![固定到主屏幕](/static/posts/2017-10-28-pin-a-web-tab.jpg)

方法非常简单，只需要在我 html 里的 head 中加入以下代码即可：

```xml
<link rel="apple-touch-icon" href="图标的链接.svg" />
```

对于我的博客，也就是这篇文章来说，我用了我的个人头像作为图标。

![我的头像]({{ site.baseurl }}{{ site.logo }})

最终固定到 iPhone 主屏幕的效果还不错！

![最终效果](/static/posts/2017-10-28-view-pinned-tab-icon.jpg)

#### 参考资料
- [Creating Pinned Tab Icons](https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html)
- [Configuring Web Applications](https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
