---
title: "屏幕上那个灰色带有数字的框是什么？看着好难受！"
date: 2018-03-16 13:40:41 +0800
categories: dotnet csharp
---

为什么屏幕上出现了一个灰框，里面有黑色数字，而且还不消失？强迫症难以忍受啊！

---

![各种背景下的灰框](/static/posts/2018-03-16-13-07-51.png)  
▲ 就是这个置于所有窗口最顶层，怎么也去不掉的灰色数字框

强迫症晚期请直接前往[最后一节](#%E8%A7%A3%E5%86%B3%E9%97%AE%E9%A2%98)把它消灭好了，非强迫症晚期的我们一起来探究下它到底是什么。

<div id="toc"></div>

### 使用 Spy++

想探究一个界面属于哪个进程，当然少不了 Spy++。现在，我们去 Visual Studio 中找到并打开 Spy++。

![启动 Spy++](/static/posts/2018-03-16-13-10-02.png)

于是，我们会看到一个丑的不得了的 Spy++ 的界面：

![Spy++](/static/posts/2018-03-16-13-12-07.png)

紧接着，我们点击查找窗口（![查找窗口](/static/posts/2018-03-16-13-14-00.png) ）按钮开始查找窗口：

![查找窗口](/static/posts/2018-03-16-13-13-21.png)

我们发现，当我们将那个瞄准靶心指向灰色小窗口上时，这个窗口的句柄和其他信息已经显示。

![查找窗口](/static/posts/2018-03-16-13-17-47.png)

于是，点击“确定”来查看这个窗口的信息。

![居然是 Visual Studio 的某个子窗口](/static/posts/2018-03-16-13-23-37.png)  
▲ 居然是 Visual Studio 的某个名为 CandidateWindow 的子窗口

### 猜测和搜索

现在我们得到了这些线索：

- 这是 Visual Studio 的窗口
- 这个窗口的类名叫做 `CandidateWindow`
- 这一定是 Visual Studio 的 BUG，可以被我们疯狂吐槽

现在我们有了搜索关键字：Gray Box，Candidate Window，Visual Studio。

搜索果然能发现有人遇到了这个问题（特别吐槽没有中文的，于是才有了本文）。有用的搜索资料见本文最后的 [参考资料](#%E5%8F%82%E8%80%83%E8%B5%84%E6%96%99)。

### 解决问题

从搜索的结果中，我们可以得知，这是 Visual Studio 用来在 CodeLens 上显示辅助提示的指示窗口。解决方法便是**在代码编辑窗口中长按 Alt 键重新打开辅助指示窗口，然后松开 Alt 键关掉这些窗口**。

试一试长按 Alt 键，果然出现了一模一样的窗口：

![长按 Alt 打开的指示窗口](/static/posts/2018-03-16-13-36-52.png)

松开 Alt 后，之前一直不消失的灰色数字窗口终于消失，世界顿时清静了。

### Alt 指示窗口是什么？

其实这是 Windows 提供的一项功能，用于在仅有键盘的设备上能够操作各种菜单。下图是在资源管理器中长按 Alt 出来的键盘按键提示，按下键盘对应的键可以进入对应的功能。

![资源管理器的 Alt 指示](/static/posts/2018-03-16-13-40-29.png)

---

#### 参考资料

- [Grey box with number sticks at top left corner of screen - Developer Community](https://developercommunity.visualstudio.com/content/problem/75736/grey-box-with-number-sticks-at-top-left-corner-of.html)
- [number in upper-left corner of screen - Developer Community](https://developercommunity.visualstudio.com/content/problem/118174/number-in-upper-left-corner-of-screen.html)
- [Visual Studio leaving numbers in tooltips on desktop - Developer Community](https://developercommunity.visualstudio.com/content/problem/190178/visual-studio-leaving-numbers-in-tooltips-on-deskt.html)
- [visual studio 2012 puts a small number in the top left corner of my screen - Stack Overflow](https://stackoverflow.com/questions/27101609/visual-studio-2012-puts-a-small-number-in-the-top-left-corner-of-my-screen)
