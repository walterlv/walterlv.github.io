---
title: "git 的合并原理"
date: 2019-02-12 19:59:56 +0800
categories: git
position: principle
---

如果 git 只是一行行比较，然后把不同的行报成冲突，那么你在合并的时候可能会遇到大量的冲突；这显然不是一个好的版本管理工具。

本文介绍 git 合并分支的原理。

---

<div id="toc"></div>

### git 的冲突表示

例如我们有这样的三个提交 a、b、c。a、b 是在 master 上的其他修改，c 是我自己基于 master 上的 a 的修改。

现在，将 master 分支合并到我自己的 t/walterlv 分支：

![git 提交树](/static/posts/2019-02-12-21-09-19.png)

a 提交：

```csharp
Console.WriteLine("Hello World!");
```

b 提交：

```csharp
Console.WriteLine("Hello Master!");
```

c 提交：

```csharp
Console.WriteLine("Hello Walterlv!");
```

于是现在将 c 提交合并到 master 的时候就会出现冲突。冲突的表示会是这样：

```
<<<<<<< HEAD
Console.WriteLine("Hello Walterlv!");
=======
Console.WriteLine("Hello Master!");
>>>>>>> master
```

以 `<<<<<<<` 表示冲突开头，`>>>>>>>` 表示冲突结尾，`=======` 分隔冲突的不同修改。上面是 HEAD，也就是在合并之前的工作目录上的最近提交；下面是合并进来的分支，通常是来自其他人的修改。

### 三路合并算法

加入上面的 b 提交修改的是其他文件。然后依然按照前面的方式进行合并。

当出现冲突时，如果你只能看到不同的两行，那么你根本不知道究竟应该如何修改的。就像下面这样：

```
<<<<<<< HEAD
Console.WriteLine("Hello Walterlv!");
=======
Console.WriteLine("Hello World!");
>>>>>>> master
```

只看这点你怎么知道两行应该采用哪一行？这是二路合并算法带来的问题。在此算法下，你的每次拉取代码可能都会带来大量的冲突；这显然是不能接受的。

三路合并算法会找到合并的这两个提交的共同祖先。在这里也就是 a 提交。master 的此文件对 a 没有修改，而当前分支 t/walterlv 对此文件有修改，于是就会应用此分支的修改。

当然，前一节的问题依然会冲突，因为两个分支相对于共同的祖先节点 a 对同一个文件都有修改。

---

#### 参考资料

- [version control - Why is a 3-way merge advantageous over a 2-way merge? - Stack Overflow](https://stackoverflow.com/q/4129049/6233938)
- [Guiffy SureMerge - A Trustworthy 3-Way Merge](http://www.guiffy.com/SureMergeWP.html)
- [git merge - Which version of the git file will be finally used: LOCAL, BASE or REMOTE? - Stack Overflow](https://stackoverflow.com/q/11133290/6233938)
