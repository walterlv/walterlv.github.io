---
title: "迫不及待地体验了一把 C#8.0 中的可空引用类型（Nullable Reference）"
publishDate: 2017-12-18 21:41:56 +0800
date: 2017-12-19 08:36:41 +0800
categories: csharp
---

在我之前的一篇博客 [NullReferenceException，就不应该存在！](/post/wipe-out-null-reference-exception.html) 中，我吐槽了 C# 中 null 的弊端以及避免 null 的方法；事实上这本都是现代高级语言中极力推崇的做法。Kotlin 和 Swift 自诞生之日起引用类型就不能为空，C# 背着历史的包袱直到 8.0 才开始这么做……

---

<p id="toc"></p>

### 安装可空引用类型预览包

现在 C#8.0 还没有发布，但微软已经提供了预览的扩展包，让大家体验效果并[予以反馈](https://github.com/dotnet/csharplang/wiki/Nullable-Reference-Types-Preview#feedback)。

扩展包下载地址：[2017年11月5日版本](https://roslyninfra.blob.core.windows.net/compilers/nonnull/Roslyn_Nullable_References_Preview_11152017.zip) - [最新版](https://github.com/dotnet/csharplang/wiki/Nullable-Reference-Types-Preview#installing)

下载解压后直接双击 install.bat 安装即可体验（安装前退出所有 Visual Studio）。**这还是预览版，还有很多已知 BUG，修复后才会发布哦！**

![安装](/static/posts/2017-12-18-21-17-42.png)

---

### 体验可空引用类型的作用

现在，再写一个新类的时候，Visual Studio 会为我们提示非空引用类型未初始化，并给出建议。

![建议](/static/posts/2017-12-18-21-22-30.png)

![修改](/static/posts/2017-12-18-21-24-34.png)

采纳它的建议，生成构造函数：

![生成构造函数](/static/posts/2017-12-18-21-25-23.png)

![生成的构造函数](/static/posts/2017-12-18-21-25-55.png)

如果我们认为这个属性可以为 null，那么就可以添加 `?` 使此属性的类型变为可空引用类型。

![可空引用类型](/static/posts/2017-12-18-21-27-44.png)

这时，如果在非 null 的地方使用此属性，则会要求判空。

![可空引用类型使用前需要判空](/static/posts/2017-12-18-21-29-35.png)

---

### 丢不掉的兼容性包袱

由于有兼容性的包袱*（至少得让你写了数月几年的项目编译通过吧）*，所以 C#8.0 的可空引用类型仅仅是“**契约**”的作用，并不能在编译级别阻止对非空引用类型的 null 赋值。而且目前为止也没有提供编译级别报错的选项。

已有的程序集没有标记那些非空哪些可空，那么 C#8.0 又怎么看呢*（其实应该问 Roslyn 怎么看）*？它只能默认所有的类型都是非空的，于是会给你警告，就像这样：

![已有程序集的警告](/static/posts/2017-12-18-21-39-41.png)

很明显，`string.IsNullOrEmpty` 是接受 `null` 值的，然而改不了现有程序集，于是这样的标记也没有用。

从现在看来，我们只能把它当作 [Code Contracts](https://docs.microsoft.com/en-us/dotnet/framework/debug-trace-profile/code-contracts) 的语法版本。

---

#### 参考资料

- Nullable Reference
    - [Nullable Reference Types Preview · dotnet/csharplang Wiki](https://github.com/dotnet/csharplang/wiki/Nullable-Reference-Types-Preview)
    - [What's New In C# 7.1 And 7.2](http://www.c-sharpcorner.com/article/whats-new-in-c-sharp-7-1-and-7-2/)
