---
layout: post
title:  "减速动画 AnimationShiftKey"
date:   2014-12-28 15:57:00 +0800
categories: Windows
---

想不想让你 Windows 自带的各种动画都变得缓慢？这可别有一番风味啊！顺便还能观察下系统的动画是怎么实现的呢。

---

修改注册表即可实现：

```
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Software\Microsoft\Windows\DWM]
"AnimationsShiftKey"=dword:00000001
```