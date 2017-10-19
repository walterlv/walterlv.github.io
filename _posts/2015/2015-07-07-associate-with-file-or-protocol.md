---
layout: post
title:  "关联一个文件扩展名或协议"
date:   2015-07-07 20:00:00 +0800
categories: windows
permalink: /windows/2015/07/07/associate-with-file-or-protocol.html
---

在 Windows 中关联程序或协议是通过注册表项实现的，编写任意一个程序甚至只是个脚本来写注册表即可实现。

---

注册表项的位置在这里：  
```
HKEY_CLASSES_ROOT\XXX\shell\open\command
```

![关联到文件](/static/posts/2015-07-07-file.png)

![关联到协议](/static/posts/2015-07-07-protocol.png)
