---
title: "Unity OpenVR 虚拟现实入门二：一个最简单的虚拟现实游戏/程序"
date: 2021-05-15 20:10:58 +0800
categories: unity openvr
position: starter
---

在 Unity 的帮助下，虚拟现实应用的开发非常容易。不过国内竟然还是没有什么教程，所以这里就来一点入门的，适合新手。

本文将开发一个最简单的虚拟现实应用。

---

<div id="toc"></div>

## 安装 SteamVR

出于性能考虑，Unity 编辑器已经把“资源商店”（Assets Store）从编辑器里面移到了浏览器。所以大家可以去 <https://assetstore.unity.com/> 下载资源。

搜索“Steam VR”，找到“SteamVR Plugin”插件（<https://assetstore.unity.com/packages/tools/integration/steamvr-plugin-32647>），直接点“添加至我的资源”。（如果需要登录，就登录一下。）然后，顶部会弹出在 Unity 编辑器中打开的提示，选“是”就好了。

[![](/static/posts/2021-05-15-20-44-30.png)](https://assetstore.unity.com/packages/tools/integration/steamvr-plugin-32647)

在 Unity 编辑器中，如果网络状况不太好，可能需要等待非常久的时间才能刷出 SteamVR 插件的导入界面。

![](/static/posts/2021-05-15-20-48-35.png)

当成功显示了 SteamVR 下载界面后，点击右下角的“下载”按钮。等待下载完成后，点击“导入”按钮。这样，你的项目中就有了 SteamVR 的插件了。

接下来，我们将利用 SteamVR 插件来开发我们的第一个虚拟现实应用。

## 第一个虚拟现实应用

因为我们刚刚安装了 SteamVR 插件，所以我们可以在界面的资产面板中看到“SteamVR”文件夹，定位到“SteamVR”-“InteractionSystem”->“Core”->“Prefabs”，找到“Player”，然后将它拖入到场景中（如图）。

![](/static/posts/2021-05-15-20-51-41.png)

然后，点击顶部的“▶”按钮开始调试你的第一个虚拟现实应用。

![](/static/posts/2021-05-15-20-53-43.png)

如果询问你还没有打开 SteamVR 的输入模拟窗格是否要打开时，点“是”。

![](/static/posts/2021-05-15-20-55-07.png)

随后，拿起你的头戴式显示器（HMD，Head-mounted display），享受你的第一个虚拟现实应用（也许是游戏）吧！

可以点开下面的视频看看我运行的效果：

[![](/static/posts/2021-05-15-21-02-24.png)](https://r302.cc/q0pQ321?platform=enpc&channel=copylink)
