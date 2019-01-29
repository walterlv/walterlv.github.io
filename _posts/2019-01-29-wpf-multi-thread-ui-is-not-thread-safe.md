---
title: "WPF 支持的多线程 UI 并不是线程安全的"
date: 2019-01-29 10:45:32 +0800
categories: wpf dotnet
position: problem
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/wpf-multi-thread-ui-is-not-thread-safe-en.html
---

WPF 支持创建多个 UI 线程，跨窗口的或者窗口内的都是可以的；但是这个过程并不是线程安全的。

你有极低的概率会遇到 WPF 多线程 UI 的线程安全问题，说直接点就是崩溃。本文将讲述其线程安全问题。

---

<div id="toc"></div>

### 标题

---

#### 参考资料