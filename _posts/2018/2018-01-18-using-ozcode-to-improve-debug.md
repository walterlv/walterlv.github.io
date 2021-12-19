---
title: "推荐近乎免费的调试神器——OzCode"
publishDate: 2018-01-18 08:43:27 +0800
date: 2018-05-22 09:47:14 +0800
tags: visualstudio
---

当一只断点打在 Visual Studio 的代码编辑器中，程序命中断点的那一刻，调试才刚刚开始……这个时候忙碌的手在键盘和鼠标之间来回跳跃，试图抓住每一次单步执行带来的状态改变。

如果命中断点的那一刻多数我需要的状态都自动呈现，偶尔需要的状态能够快速定位，那该多好！于是，有了 OzCode……

---

OzCode 的官网在这里：[OzCode: Innovative debugging extension for Visual Studio](https://www.oz-code.com/)。

<div class="video-container">
<iframe src="https://www.youtube.com/embed/EcsxK01G1bw" frameborder="0" allow="encrypted-media" allowfullscreen></iframe>
</div>

OzCode 有这些非常吸引我的地方：

- 当程序进入断点的时候，OzCode 会用红黄绿三色指示程序即将进入的分支
- OzCode 会在每一个局部变量上方标注它现在的值（不过这一功能 Visual Studio 15.5 开始也提供了）
- 调试 UI 对象时，常常的属性列表在 OzCode 的帮助之下可以快速搜索
- 长长的 linq 语句可以利用 OzCode 看到集合中的每一项对结果的影响（通过滚轮查看）

![分支着色](/static/posts/2018-01-18-08-37-56.png)  
▲ 分支着色（图片来源于官网）

![搜索属性](/static/posts/2018-01-18-08-40-44.png)  
▲ 搜索属性（图片来源于官网）

官网下载的时候会看到提示——**一个月免费试用**。但事实上，每次 Visual Studio 更新，OzCode 都会重置试用天数。事实上 Visual Studio 2017 开始，更新间隔基本上都在一个月以内。也就是说——**只要勤更新 VS，OzCode 几乎一直免费**！

![近乎免费](/static/posts/2018-01-10-09-05-27.png)  
▲ 每次更新 Visual Studio 之后，OzCode 都会重置
