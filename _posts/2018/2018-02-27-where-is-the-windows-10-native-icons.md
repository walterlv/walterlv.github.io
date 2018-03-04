---
title: "Windows 10 自带那么多图标，去哪里找呢？"
date: 2018-02-27 23:11:21 +0800
categories: windows personalize
tags: Windows10 Win10
---

无意间发现我的 D 盘根目录中大部分的文件夹都是系统专用文件夹，有自己的独特图标，偶有一两个开发用的文件夹是默认图标。于是想把它们改成独特样式，**而且是 Windows 10 那些新图标样式**！

---

这是我的文件夹，我希望把最上面几个文件夹的图标改成下面那些风格。

![我的文件夹](/static/posts/2018-02-27-21-50-42.png)

大家都知道在文件夹上右键，选择 `属性` → `自定义` → `更改图标`，这里可以选择很多图标，但用了很多年看腻了，Windows 10 中还自带有那么多，它们又在哪里呢？

![属性 → 自定义 → 更改图标](/static/posts/2018-02-27-21-53-16.png)

Windows 10 自带的图标几乎都在 `%systemroot\system32\*.dll` 中，主要是这些：

- Windows 10 风格
    - `%systemroot\system32\ddores.dll`
    - `%systemroot\system32\dmdskres.dll`
    - `%systemroot\system32\imageres.dll`
    - `%systemroot\system32\mmres.dll`
    - `%systemroot\system32\networkexplorer.dll`
    - `%systemroot%\system32\pnidui.dll`
    - `%systemroot%\system32\sensorscpl.dll`
    - `%systemroot%\system32\setupapi.dll`
    - `%systemroot%\system32\shell32.dll`
    - `%systemroot%\system32\wmploc.dll`
    - `%systemroot%\system32\wpdshext.dll`

- Windows 7 风格
    - `%systemroot\system32\accessibilitycpl.dll`
    - `%systemroot\system32\dsuiext.dll`
    - `%systemroot\system32\gameux.dll`
    - `%systemroot\system32\ieframe.dll`
    - `%systemroot\system32\mstscax.dll`
    - `%systemroot\system32\netcenter.dll`

- Windows 早期风格
    - `%systemroot\system32\compstui.dll`
    - `%systemroot\system32\mmcndmgr.dll`
    - `%systemroot\system32\moricons.dll`
    - `%systemroot\system32\pifmgr.dll`

我们一起来看看它们都是什么样的吧！

#### Windows 10 风格

![ddores.dll](/static/posts/2018-02-27-22-00-05.png)  
▲ ddores.dll 包含各种硬件图标

![dmdskres.dll](/static/posts/2018-02-27-22-51-23.png)  
▲ dmdskres.dll 磁盘管理所用图标

![imageres.dll](/static/posts/2018-02-27-22-19-06.png)  
▲ imageres.dll 各种各样 Windows 10 风格的图标，涵盖各种用途

![mmres.dll](/static/posts/2018-02-27-22-20-21.png)  
▲ mmres.dll 音频设备图标

![networkexplorer.dll](/static/posts/2018-02-27-22-30-42.png)  
▲ networkexplorer.dll 网络和共享中心图标

![pnidui.dll](/static/posts/2018-02-27-22-41-54.png)  
▲ pnidui.dll 不要被这些空白迷惑了，这都是白色的网络指示图标（有线、无线、飞行模式等）

![sensorscpl.dll](/static/posts/2018-02-27-22-44-03.png)  
▲ sensorscpl.dll 各种传感器图标（如温度、亮度、声音、指纹、地理位置等）

![setupapi.dll](/static/posts/2018-02-27-22-45-48.png)  
▲ setupapi.dll 为各种硬件安装程序提供的图标

![shell32.dll](/static/posts/2018-02-27-22-31-42.png)  
▲ shell32.dll 这个是点开“更改图标”按钮后查看的默认图标库，也包含各种各样 Windows 10 风格的图标，涵盖各种用途

![wmploc.dll](/static/posts/2018-02-27-22-47-30.png)  
▲ wmploc.dll 各种媒体设备、媒体文件、媒体文件夹

![wpdshext.dll](/static/posts/2018-02-27-22-48-40.png)  
▲ wpdshext.dll

#### Windows 7/Vista 风格

![accessibilitycpl.dll](/static/posts/2018-02-27-21-56-53.png)  
▲ accessibilitycpl.dll 辅助功能图标

![dsuiext.dll](/static/posts/2018-02-27-22-52-08.png)  
▲ dsuiext.dll 服务器或网络服务所用图标

![gameux.dll](/static/posts/2018-02-27-22-18-05.png)  
▲ gameux.dll 游戏图标

![ieframe.dll](/static/posts/2018-02-27-22-50-34.png)  
▲ ieframe.dll IE 所用的图标（部分图标其实已经更新成 Windows 10 风格，给 Edge 用）

![mstscax.dll](/static/posts/2018-02-27-22-52-53.png)  
▲ mstscax.dll 远程桌面连接所用图标（部分图标其实已经更新成 Windows 10 风格）

![netcenter.dll](/static/posts/2018-02-27-22-29-57.png)  
▲ netcenter.dll Windows 7 风格的网络和共享中心所用图标

#### Windows XP/2000/9X/3.X 风格

![compstui.dll](/static/posts/2018-02-27-22-49-36.png)  
▲ compstui.dll

![mmcndmgr.dll](/static/posts/2018-02-27-22-19-40.png)  
▲ mmcndmgr.dll 古老的图标

![moricons.dll](/static/posts/2018-02-27-22-20-54.png)  
▲ moricons.dll 古老的图标

![netshell.dll](/static/posts/2018-02-27-23-06-22.png)  
▲ netshell.dll 古老的网络连接图标

![pifmgr.dll](/static/posts/2018-02-27-22-31-12.png)  
▲ pifmgr.dll Windows 95 时代古老的图标

![wiashext.dll](/static/posts/2018-02-27-22-54-05.png)  
▲ wiashext.dll 各种图片、照片和媒体设备图标

一个说明：你会发现有些图标是空白的，这个不是 BUG，是微软的无奈……因为有些古老的不负责任的程序会依赖于这些老旧的被微软淘汰的图标，如果微软删掉了这些图标，那么这些程序会崩溃。哎……
