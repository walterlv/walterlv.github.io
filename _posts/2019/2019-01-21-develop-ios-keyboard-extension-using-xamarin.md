---
title: "使用 Xamarin 开发 iOS 键盘扩展（含网络访问）"
publishDate: 2019-01-21 22:32:48 +0800
date: 2019-03-04 22:15:47 +0800
tags: xamarin dotnet csharp xaml ios
position: starter
---

作为一位 .NET 技术的死忠，开发 iOS 应用当然要使用 Xamarin 啦！

本文用我的阅读的文档和实践为素材，介绍如何使用 Xamarin 开发一个 iOS 的键盘扩展。

---

你可以在 [Walterlv.CloudKeyboard](https://github.com/walterlv/Walterlv.CloudKeyboard) 仓库中获得本文所述的全部源代码。

<div id="toc"></div>

## 搭建环境

本文不会花篇幅来讲如何搭建 Xamarin iOS 开发的环境，不然这篇文章就没有重点。

于是，请阅读这一篇来了解如何搭建 Xamarin iOS 的开发环境：

1. 安装调试工具：Mac 部分 [Xamarin开发(Mac开发)环境搭建 - 简书](https://www.jianshu.com/p/abb9ae9df631)
1. 安装调试工具：Windows 部分 [vs2017开发IOS（vs2017 xamarin 连接mac） - ManGo.XYZ - CSDN博客](https://blog.csdn.net/qq756288646/article/details/78967532)
1. 申请开发者账号：<https://developer.apple.com/register/>，[阅读这里了解坑](/post/tips-for-developing-xamarin-ios-app)
1. 准备一根 Type-C 到 Lightning 的数据线，用于 Mac 从 Mac 部署到真机进行调试

## 你需要了解的 iOS 键盘扩展的背景知识

了解以下背景知识，有助于我们接下来开发的时候少踩一些坑。*当然我不会在这里说 iOS 应用开发的所有背景知识，只会说与 iOS 键盘扩展相关的部分。*

1. iOS 键盘扩展是 iOS 扩展的一种，而 iOS 扩展是 iOS 8.0 才开始引入的概念。
1. iOS 扩展需要有一个 iOS 普通应用作为容器一起打包；所以，你需要创建两个项目来完成 iOS 键盘扩展的开发。
    - 在后文，我们将直接使用 iOS 容器应用来描述这个概念
    - 扩展的包标识符（Bundle Identifier）必须以容器应用的包标识符字符串作为开头
1. iOS 扩展和 iOS 容器应用会被视为两款完全不同的应用，互相之前不能共享任何数据。
    - 如果真的要共享数据，就需要像其他两款不同应用共享数据一样的处理方式
1. iOS 键盘扩展默认是不能访问网络的，你需要声明允许访问网络，并获得用户的同意才行。

## 创建 iOS 键盘扩展项目

### 第一步：创建 Xamarin.Forms 项目。

这个不用太在意里面的实现，因为它只是我们的“容器项目”（前面有介绍）。实际上在本文我们完全不会碰这个项目里面的代码，只是为了配置我们的 iOS 应用包而已。未来你可以在这个容器应用里面做键盘的个性化设置。

![创建 Xamarin.Forms 项目](/static/posts/2019-01-21-19-43-40.png)

然后，选择 iOS 平台。

我们只需要 iOS 端。因为对于键盘，不同系统的实现差异很大，之间共享的代码只能是非键盘部分的代码了。

![我们只选择 iOS 平台](/static/posts/2019-01-21-19-48-09.png)

### 第二步：创建 iOS 键盘扩展项目

![创建新项目](/static/posts/2019-01-21-19-50-52.png)

![创建 Custom Keyboard Extension 项目](/static/posts/2019-01-21-19-57-10.png)

![创建完成之后的三个项目](/static/posts/2019-01-21-19-58-16.png)

当你创建完之后，你会看到三个不同的项目。

你可能发现 Walterlv.KeyboardExtension.Keyboard 项目有些奇怪，里面有 Main 函数和 AppDelegate，按道理这是一个主程序包。然而实际测试中单独有这个项目是跑不起来的（这可能是一个 Bug，如果修复了，请在下面评论或者邮件告知我，谢谢了）。

于是，Main 和 AppDelegate 这两个文件是可以删除的。如果你强迫症，就删掉吧。当然不删掉也不影响，不过我删掉了。

### 第三步：引用 iOS 键盘扩展项目

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

## 配置包信息

iOS 应用的包信息存储在 plist 中。所以在这一节，你需要正确配置两个项目的 plist。

没错！是两个项目。还记得前面背景知识里面我们说到容器项目和扩展项目就是两个不同的应用吗？

配置 plist 的方法，就是在 Visual Studio 里面双击这个文件。

按照下图这样配置：

![配置两个项目的 plist 文件](/static/posts/2019-01-21-21-02-57.png)

说明：

1. Application Name 对应 plist 中的 CFBundleDisplayName 属性，也就是应用的显示名称。
    - 对于容器应用，就是 iOS 图标下面的名称，对于键盘，就是切换键盘的时候所用的名称。
    - 下图中 iOS 应用图标下面的名称 CloudKeyboard 就是我在 [Walterlv.CloudKeyboard](https://github.com/walterlv/Walterlv.CloudKeyboard) 项目中的容器应用的名称。
    - 下图中在 iOS 切换键盘时，Cloud 就是我在 [Walterlv.CloudKeyboard](https://github.com/walterlv/Walterlv.CloudKeyboard) 项目中的键盘名称。
1. 扩展项目的 Bundle Identifier 名称必须以容器项目的 Bundle Identifier 名称作为前缀。
    - 如果不满足要求，部署时扩展将不会生效。

![iOS 应用图标](/static/posts/2019-01-21-20-58-48.png)

![iOS 上切换键盘](/static/posts/2019-01-21-20-56-47.png)

至此，你的项目可以直接编译了。如果你有真机部署环境，都可以直接部署到真机上看效果了。

## 真机部署调试

本文不会花篇幅来讲如何真机部署调试，不然这篇文章就没有重点。

但是你可以阅读：[使用 Xamarin 在 iOS 真机上部署应用进行调试](/post/deploy-and-debug-ios-app-using-xamarin)

当然这是 Mac 版本的（毕竟我在 Windows 上实际也没有成功真机调试过，我是 git 同步到 Mac 上用 Visual Studio for Mac 来真机调试的）。

只是你需要注意做这些内容：

1. 你需要同意一份开发者证书（不然打不开应用）：
    - 设置 -> 通用 -> 设备管理 -> [自己的开发者账号] -> 信任
1. 还需要打开这个键盘（不然看不到键盘）：
    - 设置 -> 通用 -> 键盘 -> 添加新键盘... -> [选择我们刚刚开发的键盘]

下面是我部署到真机上之后，在亮暗两种不同的界面下的键盘截图（就是上面的项目，没有改任何代码）：

![键盘真机部署后的运行效果](/static/posts/2019-01-21-22-07-21.png)

## 处理键盘的文字输入、退格和确定

我们把 Walterlv.CloudKeyboard.iOS.Extension 也就是那个键盘扩展项目删除得只剩下 KeyboardViewController.cs 了，我们也只需要在这个类中写代码而已。

要控制文字输入，就是使用 `TextDocumentProxy` 实例。我们的 `KeyboardViewController` 继承自 `UIInputViewController`，于是我们能够在类中直接使用 `TextDocumentProxy` 实例。

在光标处插入文字：

```csharp
TextDocumentProxy.InsertText("walterlv");
```

如果要插入换行或者确认输入，则使用：

```csharp
TextDocumentProxy.InsertText("\n");
```

在光标处删除前一个字：

```csharp
TextDocumentProxy.DeleteBackward();
```

如果想要清空文本，则可以循环删除：

```csharp
while (TextDocumentProxy.HasText)
{
    TextDocumentProxy.DeleteBackward();
}
```

你没有办法删除后一个字，也不能获取到用户输入的任何内容。

**关于换行，特别注意：**如果文本框被设置为发送或者其他非换行的功能，那么使用 `InsertText` 单独插入换行时才能正常执行这些功能。如果调用此代码之前还有其他的插入文字，那么最终就只会是换行，而不会执行其他的功能。实际上我在这一点上踩了坑，导致在 QQ 或者其他工具中只能实现换行，而无法发送消息。

iOS 的键盘有不同种类的确认，需要键盘针对 `TextDocumentProxy.`
我还没有找到办法直接完成文本的输入，例如执行确认按钮的逻辑。而确认按钮有这么些不同的情况：

```csharp
// 我当然是写 C# 语言版本的枚举，而不是 Object-C 版本的啦。
public enum UIReturnKeyType : long
{
    Default,
    Go,
    Google,
    Join,
    Next,
    Route,
    Search,
    Send,
    Yahoo,
    Done,
    EmergencyCall,
    Continue,
}
```

## 添加键盘的网络访问支持

### 允许完全访问（包括网络）

纯本地的键盘很难在打字速度上获得优势，各种主流的输入法也通常借助网络来提高自身的输入准确度。

用户需要在键盘设置里面开启键盘的“允许完全访问”才能让对应的输入法获得网络访问的权限。如果用户没有给权限，那么网络访问的时候键盘扩展就会出现异常，然后闪退。

![允许完全访问](/static/posts/2019-01-21-21-26-33.png)

然而如果你去我们刚刚开发的输入法中看，你会发现我们的输入法没有提供这样的选项可以设置。那么如何能够添加这个设置以便进行网络访问呢？

方法是修改键盘扩展项目的 Info.plist 文件。这个时候的修改，我们就不能使用 Visual Studio 中自带的 plist 编辑器了，我们需要使用文本编辑器来编辑 plist 文件。

在你的 Info.plist 文件中找到 `RequestsOpenAccess` 属性，然后将它分值从 `false` 改为 `true`：

```diff
    <key>RequestsOpenAccess</key>
--  <false/>
++  <true/>
```

这个属性设为 `true` 之后，再次部署，你将可以在你的键盘设置里面看到“允许完全访问”的设置项。开启之后，你就能在你的键盘里面访问网络了。

### 允许访问 http 不安全网络

一般来说你不用阅读这一小节的内容。因为现在基本上各种服务都已经是 https 了，http 基本已经绝迹。但是如果你需要临时部署一个服务，没来得及申请 https 证书的话，那么就需要使用本小结的内容让你的键盘支持 http 的访问。

继续打开你的键盘扩展项目的 Info.plist 文件，在根字典的最后添加一个完整的字典属性 `NSAppTransportSecurity`：

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>walterlv.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

特别注意，里面的 `walterlv.com` 需要换成你自己的域名。是域名，不用包含端口号。

这样，你就能在键盘中访问 [http://walterlv.com](https://walterlv.com) 了。

## 本文总结

1. 本文介绍了使用 Xamarin 开发 iOS 键盘插件的背景知识。
    - 必须了解这些知识才不会在一些不太重要的坑上耗费太长时间。
1. 本文教大家如何开发 iOS 键盘插件，主要是项目组织以及写代码。
    - 至少，使用文本编写出来的代码，能够在不作任何修改的情况下部署到真机。（实际上我们只在 KeyboardViewController.cs 中加了寥寥几行代码。）
1. 本文不涉及到搭建开发环境，不涉及如何连接真机调试。
    - 你可能需要配合这些博客才能完成部署以及调试：
    - [Xamarin开发(Mac开发)环境搭建 - 简书](https://www.jianshu.com/p/abb9ae9df631)
    - [vs2017开发IOS（vs2017 xamarin 连接mac） - ManGo.XYZ - CSDN博客](https://blog.csdn.net/qq756288646/article/details/78967532)

如果你还遇到了一些其他诡异的问题：

- 欢迎阅读 [使用 Xamarin 开发 iOS 应用中需要注意的若干个问题](/post/tips-for-developing-xamarin-ios-app)。
- 欢迎在评论区评论或者向我发邮件。

---

**参考资料**

- [iOS Extensions in Xamarin.iOS - Xamarin - Microsoft Docs](https://docs.microsoft.com/en-us/xamarin/ios/platform/extensions)
- [iOS 8 Custom Keyboard Tutorial: How to Create A Third-Party Keyboard Extension | iPhone and iOS App UI Design Templates](http://www.appdesignvault.com/ios-8-custom-keyboard-extension/#a_aid=mdev)
- [如何使用Xamarin开发iOS输入法 - 简书](https://www.jianshu.com/p/228e28bc5eab)
- [ios - Make HTTP Request from Custom Keyboard App Extension - Stack Overflow](https://stackoverflow.com/questions/42301827/make-http-request-from-custom-keyboard-app-extension)
- [ios - Transport security has blocked a cleartext HTTP - Stack Overflow](https://stackoverflow.com/questions/31254725/transport-security-has-blocked-a-cleartext-http)
- [iOS - 输入框有值时才能点击键盘上的returnkey(enablesReturnKeyA... - 简书](https://www.jianshu.com/p/0e345aec3689)
- [objective c - Handling Return key in iOS 8 keyboard extension - Stack Overflow](https://stackoverflow.com/questions/25739312/handling-return-key-in-ios-8-keyboard-extension)
- [objective c - Handling Return key in iOS 8 keyboard extension - Stack Overflow](https://stackoverflow.com/questions/25739312/handling-return-key-in-ios-8-keyboard-extension)
- [iphone - iOS keyboard with "Go" button instead of return - Stack Overflow](https://stackoverflow.com/questions/4489879/ios-keyboard-with-go-button-instead-of-return)
- [Custom Keyboards - Extensions - iOS - Human Interface Guidelines - Apple Developer](https://developer.apple.com/design/human-interface-guidelines/ios/extensions/custom-keyboards/)
- [Creating a Custom Keyboard In IOS… – Swift India – Medium](https://medium.com/swift-india/creating-a-custom-keyboard-in-ios-a75e7d5cc5ef)
