---
title: "对于无边框窗口，可通过处理 NCHITTEST 消息重新支持窗口标题栏拖拽以及调节窗口大小"
date: 2020-04-30 11:40:17 +0800
tags: windows dotnet csharp
position: problem
published: false
permalink: /post/handle-nchittest-message-to-support-resize.html
---

做一个无边框窗口后，原来鼠标在标题栏的操作以及在窗口边缘拖拽调节窗口大小的操作可能就失效了。有很多现成的方案可以来解决这样的问题，本文介绍通过处理底层的 Windows 消息来继续让这些功能正常使用。

---

<div id="toc"></div>

## 

---

**参考资料**
