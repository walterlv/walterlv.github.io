---
title: "使用 Xamarin 在 iOS 真机上部署应用进行调试"
date: 2019-01-27 21:17:07 +0800
categories: xamarin dotnet csharp ios
position: starter
---

虽然 Xamarin 可以在 Windows 操作系统上编写和调试，但如果开发 iOS 应用，那么我们依然需要一台安装有 XCode 和 Visual Studio for Mac 的 Mac 电脑。做真机部署不是像平时使用太阳系第一 IDE Visual Studio 那样方便。

所以本文需要介绍如何使用 Xamarin 在 iOS 真机上部署应用进行调试，然后顺便说一些注意事项。

---

<div id="toc"></div>

### 准备一台 Mac 电脑

如果你没有 Mac 电脑，那我只能很不幸地告诉你：本文读下去已经没有什么用了，你不会成功的……当然你也可以考虑使用 Mac OS 虚拟机，但成功率太低，本文不会涉及。

在 Mac 电脑上安装以下两款必备应用：

1. XCode：从苹果应用商店安装
2. Visual Studio for Mac：在这里下载 <https://visualstudio.microsoft.com/vs/mac/>

这两款应用的体积都很大，如果你没有很好的网络代理设置，安装一整天都是可能的。所以还是强烈建议你有一个稳定的代理网络来下载。

本文接下来的内容都假设你已经安装好了这两款应用。

### 背景知识

你需要知道一些背景知识，不然后面真机部署的时候失败了都不知道怎么回事。

1. 你的账号必须是苹果开发者账号
    - 只需要注册 [Apple Developer Portal](https://developer.apple.com/register/)，不需要注册 Apple Developer Program
1. 只有 XCode 才能生成开发者的 provisioning profiles
1. 只有 XCode 才能在 iOS 真机上部署全新的应用

也就是说，你必须有一些操作是在 XCode 中完成；只使用 Visual Studio for Mac 是无法完成部署任务的。

### 在 XCode 中准备

1. 在 XCode 中新建一个空白 iOS 项目（什么类型都可以），这个项目随时可以丢弃。
1. 选择你新建的项目，会出现这个项目的信息可以填，默认在 General 标签中。
1. *[重要] 修改 Bundle Identifier。
    - 将这个 Bundle Identifier 修改为你希望部署的应用的 Bundle Identifier。比如你在 Xamarin 的 Info.plist 中写的 Bundle Identifier 是 `com.walterlv.CloudKeyboard`，那么这里也必须写 `com.walterlv.CloudKeyboard`。
1. *[重要] 一定要让这个 Bundle Identifier 文本框失焦（比如按下 Tab 或在其他文本框中点一下）。
    - 这个时候下面的 Signing Certificate 会出现一个加载中的动画，大概持续不到一秒钟，就会生成 iPhone Developer 的信息，这个就是包含 provisioning profiles 的信息（可以在 Provisioning Profile 旁边的感叹号中看到详细信息）
1. 在 Mac 上插入你的 iPhone，解锁 iPhone，等待左上角出现你 iPhone 的名称和图标。
1. 点击 XCode 左上角的运行按钮，等待这个空白的应用部署到你的手机上。

![在 XCode 中进行设置](/static/posts/2019-01-27-20-51-52.png)

*[重要] 额外的，如果你开发的是 iOS 扩展，有两个或者更多的包，那么你需要重复步骤 3 到 6。也就是不断地修改 Bundle Identifier，等待生成新的 Developer 信息，然后部署这个空的应用

### 在 Visual Studio for Mac 中部署

1. *[重要] 请回到你的 iPhone 手机，删除刚刚部署的应用
    - 如果你刚刚部署了多个空白应用，那么都要删除
1. 回到 Visual Studio for Mac 并打开你的 Xamarin 项目，然后打开准备部署的应用的 Info.plist 文件
1. 检查 Bundle Identifier，一定要确认跟前面 XCode 中填入的是同一个 Bundle Identifier
    - 额外的，如果你是开发 iOS 扩展，有两个或更多包，那么每个包都需要进入 Info.plist 文件检查 Bundle Identifier
1. 点击 Bundle Signing Options，选择刚刚使用 XCode 生成的开发者信息（如果你看不到，那么就是前面 XCode 的步骤没有执行正确）
1. 在 Mac 上插入你的 iPhone，解锁 iPhone，等待左上角出现你 iPhone 的名称和图标。
    - 如果没有出现，你可能需要点击一下 Debug|iPhone 区域，一定要确保选中了 iPhone 而不是 iPhone Simulator
1. 点击 Visual Studio for Mac 左上角的运行按钮，等待你 Xamarin 的应用部署到你的手机上（可能需要数十秒到数分钟）。

![检查 Bundle Identifier](/static/posts/2019-01-27-21-01-09.png)

![设置 Bundle Signing Options](/static/posts/2019-01-27-21-06-50.png)

![运行与部署](/static/posts/2019-01-27-21-10-28.png)

理论上经过以上步骤，你就可以在你的 iPhone 上看到你用 Xamarin 开发的应用了。但其实是无法运行的。

如果部署过程中发生了任何错误，请：

1. 检查你的步骤与本文是否有出入；
2. 参考：[使用 Xamarin 开发 iOS 应用中需要注意的若干个问题](/post/tips-for-developing-xamarin-ios-app.html)

### 在 iPhone 上操作

1. 打开设置 -> 通用 -> 设备管理
1. 点开 [自己的开发者账号]，点击 [信任]

如果你是首次进行此操作（实际上阅读本文操作的应该也就是首次了），那么信任自己的开发者账号可能会花比较长的时间，Visual Studio for Mac 的部署调试可能会因为等待超时而调试失败。不过这不重要，你只需要在 Visual Studio for Mac 上点击停止调试，然后再次重来就可以了。

还需要注意，如果你删除了你部署的应用，那么下次部署的时候在 iPhone 上的操作部分需要重新进行。

还需要注意，可能每过 6 天，本文所述的所有步骤都需要重新进行一遍。
