---
layout: post
title:  "解决XAML设计器中遇到的那些错误"
date:   2016-07-31 22:29:12 +0800
date_modified:   2016-08-02 14:33:38 +0800
categories: wpf
permalink: /wpf/2016/07/31/solve-xaml-designer-errors.html
---

使用 Visual Studio 开发 WPF 程序时，XAML 设计器能够极大提高我们的开发效率。不止是写出的代码无需运行就能看到效果，还有能够直接在设计器中点击定位元素以及拖拽改变属性。

---

但是，XAML 开发不总是那么幸运！
因为我们总能在设计器中看到这样的一幕：

![XAML 设计器错误](/static/posts/2016-07-31-exception-in-xaml-designer.png)

如果你看完之后无奈又无助，那这篇文章正好将帮你分析 XAML 设计器出错的各种可能原因以及解决这些问题的思路。

---

## XAML 设计器出错的种类
总结起来，XAML 设计器错误有这些种类：  
1. 加载错误；  
> 你会在设计器中看到各种各样的异常。  
2. 设计时类型不匹配；  
> 你会发现设计器异常提示无法将某种类型转换为另一种类型。  
3. 资源未找到；  
> 你会发现设计器里的控件样式变成了默认。  
4. 控件尺寸难以接受或相互重叠；  
> 有时你可能不得不将控件的尺寸设为 0；或者将多个控件放一起以至于重叠，看不见最底层的那个。  
5. 控件缺少用以显示的数据。  
> 这种情况多见于绑定 ViewModel，尤其是列表类控件。  

严格来说，只有前两种算是错误；但后三种也是让我们为设计器抓狂的罪魁祸首，所以也一并说了吧。

---

## 解决 XAML 设计器错误的一般思路
未完待续……

### 阅读并猜测异常发生的来源
未完待续……

### 用 VS 调试 VS
未完待续……

---

## 实战解决几个典型的 XAML 设计器错误
未完待续……

---

#### 参考资料

[MSDN - Troubleshooting Designer Load Failures](https://msdn.microsoft.com/en-us/library/jj871742.aspx)  
[MSDN - How to: Debug a Designer Load Failure](https://msdn.microsoft.com/en-us/library/ee856616.aspx)