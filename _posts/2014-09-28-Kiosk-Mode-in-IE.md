---
layout: post
title:  "IE 的 Kiosk 模式"
date:   2014-09-28 23:18:00 +0800
categories: Windows IE
---

```
C:\Program Files\Internet Explorer\iexplore.exe -k  "http://cn.bing.com/"
```

使用 -k 参数可以使 IE 工作在一个看起来全屏的模式，但这里的全屏模式和在 IE 里面按 F11 键得到的全屏模式不同。-k 启动的全屏模式是无法切换回窗口模式的，除非 Alt+F4 或者 Alt+Tab 或者 Ctrl+Alt+Del 强行退出或者切换。 这种模式常被应用于应用于机场、图书馆等公共场合的的查询终端机，所以我们把这种模式称为 Kiosk Mode (-k 指的就是 Kiosk )。
