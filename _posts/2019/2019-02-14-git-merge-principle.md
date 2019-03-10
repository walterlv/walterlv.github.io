---
title: "git 的合并原理（递归三路合并算法）"
date: 2019-02-14 21:03:00 +0800
categories: git
position: principle
---

如果 git 只是一行行比较，然后把不同的行报成冲突，那么你在合并的时候可能会遇到大量的冲突；这显然不是一个好的版本管理工具。

本文介绍 git 合并分支的原理。

---

<div id="toc"></div>

## git 的冲突表示

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

## 三路合并

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

## 递归三路合并

从上面我们可以看到三路合并解决了二路合并中对于相同行不知道用哪一个的问题。不过实际的 git 提交树会更加复杂，就像下图那样纵横交错：

![纵横交错的 git 提交树](/static/posts/2019-02-14-20-44-32.png)

相比于本文一开始，我们只是新增了两个提交而已，现在 f 提交是我们正在合并的提交。

如果现在找 e 和 d 的共同祖先，你会发现并不唯一，b 和 c 都是。那么此时怎么合并呢？

1. git 会首先将 b 和 c 合并成一个虚拟的提交 x，这个 x 当作 e 和 d 的共同祖先。
1. 而要合并 b 和 c，也需要进行同样的操作，即找到一个共同的祖先 a。

我们这里的 a、b、c 只是个比较简单的例子，实际上提交树往往更加复杂，这就需要不断重复以上操作以便找到一个真实存在的共同祖先，而这个操作是递归的。这便是“递归三路合并”的含义。

这是 git 合并时默认采用的策略。

## 快进式合并

git 还有非常简单的快进式（Fast-Forward）合并。快进式合并要求合并的两个分支（或提交）必须是祖孙/父子关系。例如上面的 e 和 d 并不满足此关系，所以无法进行快进式合并。

在上面的例子合并出了 f 之后，如果将 t/walterlv 合并到 master，那么就可以使用快进式合并。这时，直接将 master 分支的 HEAD 指向 f 提交即完成了合并。当然，可以生成也可以不生成新的 g 提交，但内容与 f 的内容完全一样。

---

**参考资料**

- [version control - Why is a 3-way merge advantageous over a 2-way merge? - Stack Overflow](https://stackoverflow.com/q/4129049/6233938)
- [Guiffy SureMerge - A Trustworthy 3-Way Merge](http://www.guiffy.com/SureMergeWP.html)
- [git merge - Which version of the git file will be finally used: LOCAL, BASE or REMOTE? - Stack Overflow](https://stackoverflow.com/q/11133290/6233938)
- [Git merge strategy options & examples - Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials/using-branches/merge-strategy)
- [git-merge-base (1) - Find as good common ancestors as possible for a merge](https://www.unix.com/man-page/linux/1/git-merge-base/)
