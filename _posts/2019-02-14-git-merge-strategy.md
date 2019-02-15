---
title: "git 合并策略"
publishDate: 2019-02-14 22:13:36 +0800
date: 2019-02-15 14:21:50 +0800
categories: git
position: knowledge
---

不清楚 git 冲突的表示方法，不了解 git 的合并原理，不知道 git 解冲突的多种策略。即便如此，大多数人依然可以正常使用 git 完成合并、拉取操作，并且解一些冲突。这得益于 git 默认情况下的合并方式可以处理大多数情况下的正常合并。

然而，你是否遭遇 git 自动合并炸掉的情况？命名提示没有冲突，代码却早已无法编译通过。

本文将介绍 git 的合并策略，你可能可以更好的使用不同的策略来解决冲突。

---

<div id="toc"></div>

### git 合并策略

典型的使用指定 git 合并策略的命令这么写：

```bash
$ git merge 要合并进来的分支名 --strategy=合并策略
```

例如：

```bash
$ git merge origin/master --strategy=resolve
```

或者使用简写 `-s`，例如：

```bash
$ git merge origin/master -s resolve
```

可以指定的合并策略有：

- resolve
- recursive
- octopus
- ours
- subtree

### resolve

这使用的是三路合并算法。不过我们在 [git 的合并原理（递归三路合并算法）](/post/git-merge-principle.html) 中说过，普通的三路合并算法会存在发现多个共同祖先的问题。此策略会“仔细地”寻找其中一个共同祖先。

由于不需要递归合并出虚拟节点，所以此方法合并时会比较快速，但也可能会带来更多冲突。不敢说带来更多冲突是好事还是坏事，因为自动合并成功并不一定意味着在代码含义上也算是正确的合并。所以如果自动合并总是成功但代码含义上会失败，可以考虑此合并策略，这将让更多的冲突变成手工合并而不是自动合并。

### recursive

这是默认的合并策略，如果你不指定策略参数，那么将使用这个合并策略。这将直接使用递归三路合并算法进行合并，详见：[git 的合并原理（递归三路合并算法）](/post/git-merge-principle.html)。

当指定为此策略时，可以额外指定下面的这些参数，方法是：

```bash
$ git merge 要合并进来的分支名 --strategy=合并策略 -X diff-algorithm=参数
```

例如：

```bash
$ git merge origin/master -s recursive -X diff-algorithm=patience
```

#### ours

如果不冲突，那么与默认的合并方式相同。但如果发生冲突，将自动应用自己这一方的修改。

注意策略里面也有一个 ours，与这个不同的。

#### theirs

这与 ours 相反。如果不冲突，那么与默认的合并方式相同。但如果发生冲突，将自动应用来自其他人的修改（也就是 merge 参数中指定的那个分支的修改）。

#### patience

此策略的名称叫“耐心”，因为 git 将话费更多的时间来进行合并一些看起来不怎么重要的行，合并的结果也更加准确。当然，使用的算法是 recursive 即递归三路合并算法。

不过此名称也难以准确描述到底如何准确，不过可以举一个例子来说明：

```csharp
int Foo()
{
    // 一些省略的代码。
}

int Baz()
{
    // 一些省略的代码。
}
```

然后在这两个函数中增加另一个函数：

```csharp
int Bar()
{
    // 一些省略的代码。
}
```

默认情况下 git 会认为修改是这样的：

```diff
+ }
+
+ int Bar()
+ {
+     // 一些省略的代码。
```

然而使用 `patience` 策略后，git 将认为修改是这样的：

```diff
+ int Bar()
+ {
+     // 一些省略的代码。
+ }
+
```

如果你经常合并出现这些括号丢失或者符号不再匹配的问题，可以考虑使用 `patience` 策略进行合并。

#### no-renames

默认情况下 git 会识别出你重命名或者移动了文件，以便在你移动了文件之后依然可以与原文件进行合并。如果指定此策略，那么 git 将不再识别重命名，而是当作增加和删除了文件。

#### 其他的参数

- `diff-algorithm=[patience|minimal|histogram|myers]`
- `renormalize`
- `no-renormalize`
- `find-renames[=<n>]`
- `rename-threshold=<n>`
- `subtree[=<path>]`

### octopus

又是一个奇怪的名字——章鱼。章鱼有很多的触手，此合并策略就像这么多的触手一样。

此策略允许合并多个 git 提交节点（分支）。不过，如果会出现需要手工解决的冲突，那么此策略将不会执行。

此策略就是用来把多个分支聚集在一起的。

```bash
$ git merge t/lvyi t/walterlv -s octopus
error: Merge requires file-level merging
Trying really trivial in-index merge...
Nope.
Merge with strategy octopus failed.
```

### ours

在合并的时候，无论有多少个合并分支，当前分支就直接是最终的合并结果。无论其他人有多少修改，在此次合并之后，都将不存在（当然历史里面还有）。

你可能觉得这种丢失改动的合并策略没有什么用。但如果你准备重新在你的仓库中进行开发（程序员最喜欢的重构），那么当你的修改与旧分支合并时，采用此合并策略就非常有用，你新的重构代码将完全不会被旧分支的改动所影响。

注意 recursive 策略中也有一个 ours 参数，与这个不同的。

### subtree

此策略使用的是修改后的递归三路合并算法。与 recursive 不同的是，此策略会将合并的两个分支的其中一个视为另一个的子树，就像 git subtree 中使用的子树一样。

---

#### 参考资料

- [Git merge strategy options & examples - Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials/using-branches/merge-strategy)
- [diff - Any example to use git merge patience strategy? - Stack Overflow](https://stackoverflow.com/questions/47146379/any-example-to-use-git-merge-patience-strategy?noredirect=1&lq=1)
- [Git - merge-strategies Documentation](https://git-scm.com/docs/merge-strategies)
- [When would you use the different git merge strategies? - Stack Overflow](https://stackoverflow.com/a/366940/6233938)
