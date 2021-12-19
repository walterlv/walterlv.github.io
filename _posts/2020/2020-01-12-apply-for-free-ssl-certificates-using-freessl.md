---
title: "全民 https！使用 FreeSSL 申请免费的 https 证书"
publishDate: 2020-01-12 20:38:55 +0800
date: 2020-01-13 08:05:30 +0800
tags: web
position: starter
coverImage: /static/posts/2020-01-12-19-55-56.png
permalink: /posts/apply-for-free-ssl-certificates-using-freessl.html
---

到现在还不为你的网站添加 https 的话，浏览器已经会非常显眼地显示“不安全”了。

感谢 Let's Encrypt，感谢 buypass，个人使用申请 https 证书的话已经可以免费了。

---

<div id="toc"></div>

## 关于域名

我们使用 FreeSSL.org 申请的是域名证书，对一个或多个域名生效。所以，你至少需要拥有一个域名。如果没有，去 <https://tld-list.com/> 输入你心仪的域名，然后找到最便宜的一家买一个吧！

## 第一步：输入域名

打开 <https://freessl.org/>，在输入框中输入你想要申请证书的域名，然后点击“创建免费的SSL证书”。

![FreeSSL.org](/static/posts/2020-01-12-19-55-56.png)

下面有提供商的选择，选 Let's Encrypt V2 的话，我们可以申请泛域名证书，但有效期只有 3 个月。也就是说 3 个月之后你需要重新申请（重新申请的步骤可以简化，后面会说）。选择 buypass 的话，不能申请泛域名证书，但一次申请可以管 6 个月，比较省事儿。

可能需要解释一下泛域名。泛域名是带通配符的域名，例如 `*.walterlv.com` 就是一个泛域名。值得注意的是，这只能代表所有的二级域名。

`com` 是一个顶级域名，`walterlv.com` 是一个一级域名，<blog.walterlv.com> 是一个二级域名。而泛域名 `*.walterlv.com` 范围涵盖了二级域名 <blog.walterlv.com>，但是不包含一级域名 `walterlv.com` 和三级域名 `s.blog.walterlv.com`。

所以你不能指望申请一个泛域名适用你的所有网站。但是！**FreeSSL.org** 自动为你的泛域名创建两个证书，对我们初学者来说非常友好，不容易出错！如下图所示。

![自动补全](/static/posts/2020-01-12-20-11-16.png)

▲ 当输入了一个泛域名之后，点击“创建免费的SSL证书”，会自动把上一级域名也自动生成了。

## 第二步：填写邮箱

输入你自己的邮箱，然后点击“点击创建”。

![输入邮箱](/static/posts/2020-01-12-20-12-57.png)

## 第三步：安装并用 KeyManager 打开

![提示用 KeyManager 打开](/static/posts/2020-01-12-20-16-35.png)

推荐下载安装 [KeyManager](https://keymanager.org/)，这可以在接下来的步骤当中省去一堆手工配置，也为将来重新申请证书带来更高的效率。

下载安装完成后，如果打开 KeyManager 的提示已经消失，可以点击“再次尝试启动KeyManager”打开：

![再次尝试启动KeyManager](/static/posts/2020-01-12-20-20-06.png)

打开 KeyManager 后不需要任何操作，直接回到浏览器中刚刚的页面即可。（当然，如果提示登录或设置密码，则需要输入密码）

![打开 KeyManager 不需要任何操作](/static/posts/2020-01-12-20-21-28.png)

回到浏览器后点击“继续”：

![继续](/static/posts/2020-01-12-20-22-41.png)

### 第四步：验证域名

[FreeSSL.org](https://freessl.org/) 需要验证这个域名确实是你自己的，按照它的说明，去你的域名管理页面中配置一个或两个记录（取决于你申请几个证书）。

![按照提示配置域名](/static/posts/2020-01-12-20-24-48.png)

你需要前往你购买域名的域名提供商的网页里去设置。如果你已经改了域名服务器，就需要去改了之后的域名服务商那里设置。

设置方法是添加一个新的设置，类型是 TXT，名称是和值是上面页面中给你提供的值。

![设置 TXT 记录值](/static/posts/2020-01-12-20-29-23.png)

### 第五步：点击验证

回到 [FreeSSL.org](https://freessl.org/) 页面，点击“点击验证”，如果通过，这时会继续提示进入 KeyManager 软件。如果没有通过，不要紧，等几分钟再试，不同的域名服务器生效的时间有差异。

### 第六步：导出证书

在 KeyManager 的证书管理页面，点击单个域名最右边的“…”按钮，点击“详情”，拉倒最下面点击“查看证书”，再点击“导出证书”。

![证书详情](/static/posts/2020-01-12-20-33-06.png)

![查看证书](/static/posts/2020-01-12-20-33-54.png)

![导出证书](/static/posts/2020-01-12-20-34-30.png)

选择你希望导出的证书平台，决定是否要为证书设置密码，点击“导出”。

![选择导出平台](/static/posts/2020-01-12-20-35-38.png)

我应该选择哪个平台？

如果你使用 Nginx 或 frp 反向代理服务器，那么导出为 Nginx 平台。参见：

- [使用 Frp 为你的 Web 服务添加 https 支持](/post/add-https-support-for-web-service-using-frp)
- [使用 Nginx 为你的 Web 服务添加 https 支持](/post/add-https-support-for-web-service-using-nginx)

如果你使用 IIS 反向代理服务器，或者直接使用 Kestrel 对外提供 https 粉刷说，那么导出为 IIS 平台。参见：

- [使用 Kestrel 为你的 ASP.NET Core 服务添加 https 支持](/post/add-https-support-for-asp-dotnet-using-kestrel)

如果你使用 Apache 或者 Tomcat 作为 Web 服务器，则选择对应的平台。

### 最后

将证书用于你的 Web 服务器，参见：

- [三种方法为 ASP.NET Core 对外服务添加 https 支持（kestrel / frp / nginx）](/post/add-https-support-for-asp-dotnet)


