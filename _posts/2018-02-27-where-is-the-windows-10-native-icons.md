---
title: "Windows 10 自带那么多图标，去哪里找呢？"
date: 2018-02-27 20:33:02 +0800
categories: windows personalize
tags: Windows10 Win10
published: false
---

无意间发现我的 D 盘根目录中大部分的文件夹都是系统专用文件夹，有自己的独特图标，偶有一两个开发用的文件夹是默认图标。于是想把它们改成独特样式。

大家都知道在文件夹上右键，选择 `属性` → `自定义` → `更改图标`，这里可以选择很多图标，但用了很多年看腻了，Windows 10 中还自带有那么多，它们又在哪里呢？

---

Windows 10 自带的图标几乎都在 `%systemroot\system32\*.dll` 中，主要是这些：

- `%systemroot\system32\accessibilitycpl.dll`
- `%systemroot\system32\ddores.dll`
- `%systemroot\system32\explorer.exe`
- `%systemroot\system32\gameux.dll`
- `%systemroot\system32\imageres.dll`
- `%systemroot\system32\mmcndmgr.dll`
- `%systemroot\system32\mmres.dll`
- `%systemroot\system32\moricons.dll`
- `%systemroot\system32\netcenter.dll`
- `%systemroot\system32\networkexplorer.dll`
- `%systemroot\system32\pifmgr.dll`
- `%systemroot\system32\shell32.dll`

我们一起来看看它们都是什么样的吧！
