---
title: "使用 Xamarin 开发 iOS 键盘扩展（含网络访问）"
date: 2019-01-21 20:11:03 +0800
categories: xamarin dotnet csharp xaml ios
position: starter
---

作为一位 .NET 技术的死忠，开发 iOS 应用当然要使用 Xamarin 啦！

本文用我的阅读的文档和实践为素材，介绍如何使用 Xamarin 开发一个 iOS 的键盘扩展。

---

你可以在 [Walterlv.CloudKeyboard](https://github.com/walterlv/Walterlv.CloudKeyboard) 仓库中获得本文所述的全部源代码。

<div id="toc"></div>

### 搭建环境

本文不会花篇幅来讲如何搭建 Xamarin iOS 开发的环境，不然这篇文章就没有重点。

于是，请阅读这一篇来了解如何搭建 Xamarin iOS 的开发环境：

1. 安装调试工具：Mac 部分 [Xamarin开发(Mac开发)环境搭建 - 简书](https://www.jianshu.com/p/abb9ae9df631)
1. 安装调试工具：Windows 部分 [vs2017开发IOS（vs2017 xamarin 连接mac） - ManGo.XYZ - CSDN博客](https://blog.csdn.net/qq756288646/article/details/78967532)
1. 申请开发者账号：<https://developer.apple.com/register/>，[阅读这里了解坑](https://walterlv.com/post/tips-for-developing-xamarin-ios-app.html)
1. 准备一根 Type-C 到 Lightning 的数据线，用于 Mac 聪 Mac 部署到真机进行调试

### 你需要了解的 iOS 键盘扩展的背景知识

了解以下背景知识，有助于我们接下来开发的时候少踩一些坑。*当然我不会在这里说 iOS 应用开发的所有背景知识，只会说与 iOS 键盘扩展相关的部分。*

1. iOS 键盘扩展是 iOS 扩展的一种，而 iOS 扩展是 iOS 8.0 才开始引入的概念。
1. iOS 扩展需要有一个 iOS 普通应用作为容器一起打包；所以，你需要创建两个项目来完成 iOS 键盘扩展的开发。
    - 在后文，我们将直接使用 iOS 容器应用来描述这个概念
    - 扩展的包标识符（Bundle Identifier）必须以容器应用的包标识符字符串作为开头
1. iOS 扩展和 iOS 容器应用会被视为两款完全不同的应用，互相之前不能共享任何数据。
    - 如果真的要共享数据，就需要像其他两款不同应用共享数据一样的处理方式
1. iOS 键盘扩展默认是不能访问网络的，你需要声明允许访问网络，并获得用户的同意才行。

### 创建 iOS 键盘扩展项目

#### 第一步：创建 Xamarin.Forms 项目。

这个不用太在意里面的实现，因为它只是我们的“容器项目”（前面有介绍）。实际上在本文我们完全不会碰这个项目里面的代码，只是为了配置我们的 iOS 应用包而已。未来你可以在这个容器应用里面做键盘的个性化设置。

![创建 Xamarin.Forms 项目](/static/posts/2019-01-21-19-43-40.png)

然后，选择 iOS 平台。

我们只需要 iOS 端。因为对于键盘，不同系统的实现差异很大，之间共享的代码只能是非键盘部分的代码了。

![我们只选择 iOS 平台](/static/posts/2019-01-21-19-48-09.png)

#### 第二步：创建 iOS 键盘扩展项目

![创建新项目](/static/posts/2019-01-21-19-50-52.png)

![创建 Custom Keyboard Extension 项目](/static/posts/2019-01-21-19-57-10.png)

![创建完成之后的三个项目](/static/posts/2019-01-21-19-58-16.png)

当你创建完之后，你会看到三个不同的项目。

你可能发现 Walterlv.KeyboardExtension.Keyboard 项目有些奇怪，里面有 Main 函数和 AppDelegate，按道理这是一个主程序包。然而实际测试中单独有这个项目是跑不起来的（这可能是一个 Bug，如果修复了，请在下面评论或者邮件告知我，谢谢了）。

于是，Main 和 AppDelegate 这两个文件是可以删除的。如果你强迫症，就删掉吧。当然不删掉也不影响，不过我删掉了。

#### 第三步：引用 iOS 键盘扩展项目

在 iOS 容器应用上面添加键盘扩展项目作为引用。

![在 iOS 容器应用上添加引用](/static/posts/2019-01-21-20-04-39.png)

![引用键盘扩展项目](/static/posts/2019-01-21-20-05-35.png)

如果你感兴趣去查看 Walterlv.KeyboardExtension.iOS 项目中对 Walterlv.KeyboardExtension.Keyboard 项目的引用节点的话，你会发现 Xamarin 已经自动为这个项目标记上了 `<IsAppExtension />`。只有加上了 AppExtension 标记，Xamarin 才会把这个项目作为 iOS 扩展项目进行打包。

```xml
<ProjectReference Include="..\..\Walterlv.KeyboardExtension.Keyboard\Walterlv.KeyboardExtension.Keyboard.csproj">
    <Project>{d6f006e7-3c98-4b97-b2d5-4d2e3bc2f945}</Project>
    <Name>Walterlv.KeyboardExtension.Keyboard</Name>
    <IsAppExtension>true</IsAppExtension>
    <IsWatchApp>false</IsWatchApp>
</ProjectReference>
```

在以上三个步骤完成之后，理论上你是可以正常编译此项目的。

![可以编译通过](/static/posts/2019-01-21-20-10-58.png)

### 配置包信息



---

#### 参考资料

- [iOS Extensions in Xamarin.iOS - Xamarin - Microsoft Docs](https://docs.microsoft.com/en-us/xamarin/ios/platform/extensions)
- [iOS 8 Custom Keyboard Tutorial: How to Create A Third-Party Keyboard Extension | iPhone and iOS App UI Design Templates](http://www.appdesignvault.com/ios-8-custom-keyboard-extension/#a_aid=mdev)
- [如何使用Xamarin开发iOS输入法 - 简书](https://www.jianshu.com/p/228e28bc5eab)
- [ios - Make HTTP Request from Custom Keyboard App Extension - Stack Overflow](https://stackoverflow.com/questions/42301827/make-http-request-from-custom-keyboard-app-extension)
- [ios - Transport security has blocked a cleartext HTTP - Stack Overflow](https://stackoverflow.com/questions/31254725/transport-security-has-blocked-a-cleartext-http)
- [iOS - 输入框有值时才能点击键盘上的returnkey(enablesReturnKeyA... - 简书](https://www.jianshu.com/p/0e345aec3689)
- [objective c - Handling Return key in iOS 8 keyboard extension - Stack Overflow](https://stackoverflow.com/questions/25739312/handling-return-key-in-ios-8-keyboard-extension)
