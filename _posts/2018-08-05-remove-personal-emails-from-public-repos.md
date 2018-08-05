---
title: "在 GitHub 公开仓库中隐藏自己的私人邮箱地址"
date: 2018-08-05 16:56:26 +0800
categories: git github
---

GitHub 重点在开方源代码，其本身还是非常注重隐私的。这一点与面向企业的 GitLab 很不一样。

不过，你依然可能在 GitHub 上泄露隐私信息，例如企业内部所用的电子邮箱。

---

### GitHub 对个人隐私的尊重

git 的设定，开发者需要设置自己的邮箱：

![git 的邮箱设置](/static/posts/2018-08-05-14-56-56.png)  
▲ git 的邮箱设置（即便是公开的邮箱，我也不在博客里贴出来）

而在 GitLab 上，我们可以很直接地在提交上面看到提交者的邮箱：

![GitLab 上的提交信息](/static/posts/2018-08-05-14-49-29.png)  
▲ GitLab 上的提交信息（图片已被魔改，毕竟邮箱是隐私）

但是在 GitHub 上，同样的行为是看不到邮箱的：

![GitHub 上的提交信息](/static/posts/2018-08-05-14-59-22.png)  
▲ GitHub 上的提交信息（图片原封不动）

不止是提交信息，在其他的很多页面中，你都不会看到 GitHub 暴露邮箱地址。

### 依然能看到的邮箱地址

在 GitHub 上可以单独看提交信息，比如你可以去这里看看：<https://github.com/walterlv/Whitman/commit/1088973f71466aaed1eff7a5fdf00eb7f4604620>。里面依然没有邮箱地址。

然而，当你在地址的最后面加上 `.patch` 之后，就变得不一样了：<https://github.com/walterlv/Whitman/commit/1088973f71466aaed1eff7a5fdf00eb7f4604620.patch>。

```diff
- https://github.com/walterlv/Whitman/commit/1088973f71466aaed1eff7a5fdf00eb7f4604620
+ https://github.com/walterlv/Whitman/commit/1088973f71466aaed1eff7a5fdf00eb7f4604620.patch
```

```
From 1088973f71466aaed1eff7a5fdf00eb7f4604620 Mon Sep 17 00:00:00 2001
From: walterlv <lvyi@example.com>
Date: Sat, 4 Aug 2018 17:37:01 +0800
Subject: [PATCH] Use Segoe MDL2 Assets font.

---
 src/Whitman.Wpf/Themes/Window.Universal.xaml | 24 +++++++-------------
 1 file changed, 8 insertions(+), 16 deletions(-)

diff --git a/src/Whitman.Wpf/Themes/Window.Universal.xaml b/src/Whitman.Wpf/Themes/Window.Universal.xaml
index 8b78e41..522ab51 100644
--- a/src/Whitman.Wpf/Themes/Window.Universal.xaml
+++ b/src/Whitman.Wpf/Themes/Window.Universal.xaml
```

注意第二行，出现了我的邮箱地址。为了脱敏，我将内容替换成了 `lvyi@example.com`；如果你想看真正的邮箱地址，请前往真实的网页查看。

GitHub 在这一点上已经为我们做了很多了，至少查看邮箱地址已经不是普通人可以看得到的了。

### 添加隐私邮箱

GitHub 提供了两种方法来保护我们的邮箱隐私：

1. 在推送时发现隐私邮箱则阻止推送；
1. 使用 GitHub 专用的替代邮箱。

前往 <https://github.com/settings/emails> 可以对自己的邮箱地址进行设置。在 Primary email address 一栏，我们能看到 GitHub 为我们提供了一个专用的用于在 git 中配置的邮箱地址。

![Primary email address](/static/posts/2018-08-05-16-45-54.png)

![邮箱列表](/static/posts/2018-08-05-16-43-46.png)

继续往 GitHub 邮箱设置页面往下看，可以看到两个隐私设置。

- 隐私地址转换：如果发现以上列表中的邮箱地址，则会转换为 GitHub 专用的邮箱地址。
- 阻止推送：如果发现暴露了邮箱地址，则阻止推送。

![隐私设置](/static/posts/2018-08-05-16-51-15.png)

---

#### 参考资料

- [Email settings](https://github.com/settings/emails)
