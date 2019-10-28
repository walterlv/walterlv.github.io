---
title: "当我们在写事件 += 和 -= 的时候，方法是如何转换成事件处理器的"
date: 2019-10-28 08:50:10 +0800
categories: dotnet csharp
position: knowledge
published: false
---

在此处编辑 blog.walterlv.com 的博客摘要

---

<div id="toc"></div>

## 对象和对象之间的隐式转换

- 方法组
- 事件处理器（EventHandler）（基类 MultiCastDelegate）
- 重写 == 这样可以 -=
- 每次传入都是新创建的对象


- 验证 ConditionalWeakTable 是否会使用 == 或者 Equals

---

**参考资料**