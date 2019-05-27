---
title: "C# 中新增类型的命名空间只需部分与其他命名空间名称相同即可破坏源码兼容性"
date: 2019-05-27 22:48:03 +0800
categories: csharp dotnet visualstudio
position: problem
published: false
---

我只是增加库的一个 API，比如增加几个类而已，应该不会造成兼容性问题吧。

对于编译好的二进制文件来说，不会造成兼容性问题；但——可能造成源码不兼容。

本文介绍可能的源码不兼容问题。

---

<div id="toc"></div>

## 标题

---

**参考资料**