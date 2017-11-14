---
title: "将 UWP 的有效像素（Effective Pixels）引入 WPF"
date: 2017-11-14 09:54:10 +0800
categories: wpf uwp xaml
published: false
---

在很久很久以前，WPF 诞生之初，有一个神奇的单位，它的名字叫做——设备无关单位（DIP，Device Independent Unit）。微软给它描绘了一片美好的愿景——在任何显示器上显示的尺寸是相同的。

What the ** is this unit!!! 神 TM 相同！！！

UWP 采用有效像素（Effective Pixels）来描述尺寸，这是才是能够自圆其说的一套尺寸描述；WPF 的尺寸机制与 UWP 完全就是同一套，使用有效像素才能解释 WPF 尺寸变化上的各种特性！

---

<div id="toc"></div>

### 统一概念

在继续讨论之前，我们必须统一几个概念。不能说那些意义不明确的词，尤其是“宽高”“大小”“尺寸”“更大”。试想你说一个按钮的宽高是 200，那么它的宽高到底是多少呢？一个屏幕上的按钮和另一个屏幕上的按钮哪个更大呢？

在本文中，对于尺寸，我们只说三个概念：

- 物理尺寸（单位：厘米）
- 显示器像素个数（单位：个）
- 有效像素（即 WPF 中最常用的那个单位；在本文结束之前，这应该是一个未定义的概念）

如果我们说 A 按钮比 B 按钮的物理宽度更大，那么无论它们显示在哪个显示器上，都具备相同的关系——因为我们可以拿尺子来量。

如果我们说 A 按钮比 B 按钮在宽度上占用的显示器像素个数更多，我们也可以拿放大镜去屏幕上一个点一个点地数——当然，各种截图工具已经在**最佳分辨率**下具备数像素个数的功能了（这里一定要突出最佳分辨率）。

而有效像素（Effective Pixels，本文记其为 epx）就是本文从 UWP 中引入的尺寸概念。当我们说按钮的有效像素宽度为 200 时，指的是你在 WPF 的 XAML 或 C# 代码中写下了 `Width="200"`。

接下来，我们所有对于尺寸的描述都只按照这三个概念进行比较。

---

### 从愿景看有效像素的意义

有效像素单位的诞生一定是为了解决某种尺寸问题，而且是因为现有的尺寸单位无法简单地描述这一问题。而我们就要准确描述这一问题，并将得到的单位定义成“有效像素”。

#### 吐槽 DIP

WPF 曾经说自己用的是“设备无关单位”（DIP），愿景是在所有显示器上显示的物理尺寸相同。比如你在代码中写了 `Width="96"` 的按钮，那么在所有显示器上其尺寸为 1 英寸。

其实简单测试就不难发现这是一个根本无法自圆其说的愿景，具体无法自圆其说的点有两个。

1. WPF 说自己的开发无需考虑 DPI 缩放，因为它会自己做缩放。那么当你写下 `Width="96"` 时，到底缩放还是不缩放呢？缩放就迁就了 DPI 缩放的特性，违背了物理尺寸相同的特性；不缩放就迁就了物理尺寸相同的特性，丢失了 DPI 缩放的特性。
1. 在非 PC 设备（手机、平板电脑、大屏幕电视）上，如果依然保持物理尺寸相同，那么 PC 上显示合适的 3cm 的按钮在手机上将占据大半个屏幕，在电视上将小得几乎看不见。怎么能让一个 UI 框架做出这么脑残的设计呢？

#### 有效像素（epx）的愿景

有效像素概念的出现，就摒除了 WPF 物理尺寸相同这样荒谬而无法自圆其说的设定。但为了给有效像素设下定义，我们来看看微软到底期望这样的尺寸单位带来哪些方便吧：

<div class="video-container">
<iframe class="video" src="https://www.youtube.com/embed/X_03JKvnIls" frameborder="0" gesture="media" allowfullscreen></iframe>
</div>  
▲ 如果此处看不到视频，请前往 Channel 9 观看：[Designing Universal Windows Platform apps](https://channel9.msdn.com/Blogs/One-Dev-Minute/Designing-Universal-Windows-Platform-apps)。

具体说来，对于手机和平板电脑（笔记本、Surface）这些近距离观看的设备，其物理尺寸可以更小；对于客厅摆放的大屏幕电视，去观看距离较远，物理尺寸应该更大。相同的界面元素在不同设备上显示时，呈现出来的效果在视野角度上是相近的，这才是人眼观看比较舒适的尺寸概念的设计。

![视野角度相近](/static/posts/2017-11-14-09-48-42.png)  
▲ 图片来自于微软 UWP 设计指导文档 [Introduction to Universal Windows Platform (UWP) app design (Windows apps)](https://docs.microsoft.com/en-us/windows/uwp/design/basics/design-and-ui-intro)

可以看出，有效像素的出现解决了我在 [以上吐槽](#%E5%90%90%E6%A7%BD-dip) 中列举出无法自圆其说的第 2 点。认识到一个优秀的屏幕显示单位并不是按物理尺寸定义，而是根据不同的使用场景有所不同。第 1 点也部分得到了缓解——接受 DPI 缩放的特性，放弃承认物理尺寸相同的设定。

不过，一个好的概念除了要清楚自己的愿景，同时也要看清自己的局限性。

#### 有效像素（epx）的局限性



---

#### 参考资料

- [Introduction to Universal Windows Platform (UWP) app design (Windows apps) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/basics/design-and-ui-intro)
