---
title: "将 UWP 的有效像素（Effective Pixels）引入 WPF"
date: 2017-11-14 00:08:53 +0800
categories: wpf uwp xaml
published: false
---

在很久很久以前，WPF 诞生之初，有一个神奇的单位，它的名字叫做——设备无关单位（DIP，Device Independent Unit）。微软给它描绘了一片美好的愿景——在任何显示器上显示的尺寸是相同的。

What the ** is this unit!!! 神 TM 相同！！！

UWP 采用有效像素（Effective Pixels）来描述尺寸，这是才是能够自圆其说的一套尺寸描述；WPF 的尺寸机制与 UWP 完全就是同一套，使用有效像素才能解释 WPF 尺寸变化上的各种特性！

---

<div id="toc"></div>

<div class="video-container">
<iframe class="video" src="https://www.youtube.com/embed/X_03JKvnIls" frameborder="0" gesture="media" allowfullscreen></iframe>
</div>

▲ 如果此处看不到视频，请前往 Youtube 观看：[Designing Universal Windows Platform apps - YouTube](https://www.youtube.com/watch?v=X_03JKvnIls)。

---

#### 参考资料

- [Introduction to Universal Windows Platform (UWP) app design (Windows apps) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/basics/design-and-ui-intro)
