---
title: "使用 Xamarin 开发 iOS 应用中需要注意的若干个问题"
publishDate: 2019-01-21 15:21:29 +0800
date: 2019-01-22 09:11:53 +0800
tags: xamarin ios
position: knowledge
coverImage: /static/posts/2019-01-21-15-19-55.png
permalink: /posts/tips-for-developing-xamarin-ios-app.html
---

本文收集整理使用 Xamarin 开发 iOS 应用时可能会遇到的各种问题。

---

<div id="toc"></div>

## 需要注册 Apple Developer Portal

不管你用什么开发 iOS 应用，成为一个 Apple 的开发者是必要的。

1. 访问：<https://developer.apple.com/register/>
1. 登录
1. 同意协议

完成！虽然简单，但是如果没有成为开发者，那么你在所有工具上都无法成功部署应用。

## Could not find any available provisioning profiles for iOS

这个错误可能出现在你是用 Visual Studio 或者 Visual Studio for Mac 部署真机调试的时候出现。

**只有 XCode 才能生成 provisioning profiles**！所以，如果你希望只使用 Visual Studio 或者 Visual Studio For Mac 或者 Xamarin 来部署是不可能的。

如果出现了此错误，你需要使用 XCode 提前生成一份 provisioning profiles 然后在 Visual Studio 中使用这份 profiles。

方法：

1. 在 XCode 中新建一个项目；
1. 填写 Bundle Identifier：
    - 注意：必须写成跟你待会儿用 Visual Studio 部署时项目一模一样的 Bundle Identifier！
    - 比如你在 Visual Studio for Mac 中准备部署的应用为 `com.walterlv.CloudKeyboard`，那么在这里也必须填写 `com.walterlv.CloudKeyboard`。
1. 在 XCode 中部署这个临时的项目；
    - 你必须确保真的成功部署到真机上了。
1. 换回 Visual Studio，理论上你现在就可以成功部署了。

至于那个在 XCode 中临时建的项目，你可以丢掉，也可以留着。毕竟这种方式创建的 provisioning profiles 只有 6 天的有效期。如果过期了，你就需要再来一次。

如果依然不能部署，你需要去项目中设置一下，Visual Studio 中的设置方法如下图：

![设置 Provisioning](/static/posts/2019-01-21-15-19-55.png)

Visual Studio for Mac 中的设置方法则是选中这个项目的 Info.plist 文件，然后点击 Bundle Signing，在对话框中选。

## 需要注册 Apple Developer Program

注意，注册 Apple Developer Program 需要付 $99 美元的年费。

即便没有注册，也可以部署真机调试，但如上文所说，只有 6 天的有效期。如果注册了，那么有一年。

---

**参考资料**

- [How to check whether Xcode downloaded all profiles? - Stack Overflow](https://stackoverflow.com/questions/44321291/how-to-check-whether-xcode-downloaded-all-profiles)


