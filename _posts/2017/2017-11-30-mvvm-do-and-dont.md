---
title: "当我们使用 MVVM 模式时，我们究竟在每一层里做些什么？"
date: 2017-11-30 01:29:14 +0800
tags: windows wpf uwp
---

这篇文章不会说 MVVM 是什么，因为讲这个的文章太多了；也不会说 MVVM 的好处，因为这样的文章也是一搜一大把。我只是想说说我们究竟应该如何理解 M-V-VM，当我们真正开始写代码时，应该在里面的每一层里写些什么。

---

MVVM，当然三层——M-V-VM。就凭这个“三层”结构，WPF/UWP 开发者们就能折腾出一个完整的程序出来。M——定义数据模型啊，V——视图啊，VM——视图模型。其中 M 和 V 的中文词语和英文单词是很好理解的，但是 VM 就不是个日常用词；于是各种不知道应该放在哪里的代码便一窝蜂全放进了 VM 中，最终导致了 VM 的无限膨胀，成百上千行也是司空见惯啊！

可是，若 VM 不膨胀，那让 M 或者 V 膨胀吗？当然不是，谁都不要膨胀！于是那么多的代码写到哪里呢？

答案：**MVVM 之外**。

<p id="toc"></p>

---

## 我们的代码不止 MVVM 三层

MVVM 不是应用程序架构，只是一个 GUI 类程序的开发模式而已。这意味着它只是用来解决我们应用程序中 GUI 部分的开发问题，并不能用来解决其他问题。而一个能持续发展的程序怎么能只有 GUI 呢？

- **MVVM 只是数据驱动型 GUI 程序建议的开发模式；无论是三层中的哪一层，本质上都是在解决 UI 问题。**  
而非 UI 问题根本就不在 MVVM 的讨论之列。

不知看到这里时你会不会喷我一脸——“V”解决 UI 问题也就算了，“VM”和“M”算什么 UI！

VM，视图模型。其本质是模型。什么的模型？“视图”的模型。这是为真实的 UI 做的一层抽象模型。也就是说，VM 其实是“抽象的 UI”。

接着喷——“V”和“VM”解决 UI 问题也就算了，“M”算什么 UI！

M，数据模型。作为数据驱动型 GUI 程序，这些数据是用于驱动 UI 的数据；比如网络请求的数据，本地文件储存的数据。定义这些数据模型是为了与其他组件、其他程序、其他设备传递数据，并将这些数据为视图模型所用。那些不驱动 UI 的数据根本不在此谈论之列。如果你觉得这样的解释有些牵强，那我也无话可说；但是当我们将它理解成“驱动 UI 的数据”时，我们将能够更容易地组织我们的代码，使之不容易发生混乱。

MVVM 模式按此理解后，我们将更能够将代码放到合适的位置，避免 VM 代码的膨胀：

1. 公共的控件或者辅助代码应该抽出来放到别处，比如形成公共组件
1. 一些非 UI 的业务功能单独做，独立于 MVVM 模式，对 VM 提供调用接口即可。

---

## MVVM，应该做什么，不应该做什么

这一节内容部分参考自：[MVVM standardization - W3Cgeek](http://w3cgeek.com/mvvm-standardization.html)。

### View

> 1. 想进行测试的逻辑都不要放到这里
> 1. 不止能是 `Window`/`Page`/`UserControl`，还能是 `Control`/`DataTemplate`
> 1. 可以考虑使用 `DataTrigger`、`ValueConverter`、`VisualState` 或者 `Blend` 中提供的 `Behivor` 机制来处理 ViewModel 对应的 UI 展现方式

### ViewModel

> 1. 这里需要保持抽象 UI 的状态，这样才可以在据此 ViewModel 创建多个 View 的时候，这些 View 能够完全一致而不用把此前逻辑再跑一边
> 1. 无论如何都不能引用 View，就算是接口也不行
> 1. 注意不要去调用一些单例类或者带状态的静态类，这样才好进行单元测试

### Model

> 1. 那些通过各种途径搜罗来的数据
> 1. 不能引用 View，也不能引用 ViewModel

### View 通知 ViewModel

> 1. 推荐用数据绑定
> 1. 尽量不要直接调用 ViewModel，但必要的时候也可以去调用

### ViewModel 通知 View

> 1. 属性绑定
> 1. 事件通知
> 1. 消息（比如 EventAggregator/Message/RX 框架）
> 1. 通过中间服务调用
> 1. 直接由 View 传入一个委托，ViewModel 去调用那个委托

---

**参考资料**

- [Recommendations and best practices for implementing MVVM and XAML/.NET applications « Rico Suter](https://blog.rsuter.com/recommendations-best-practices-implementing-mvvm-xaml-net-applications/)
- [MVVM standardization - W3Cgeek](http://w3cgeek.com/mvvm-standardization.html)
