---
title: "关于 git 合并解冲突的各种概念和方法：了解了这些，解冲突会更加准确不易出错"
date: 2019-02-11 15:37:27 +0800
categories: git
position: knowledge
---

不清楚 git 冲突的表示方法，不了解 git 的合并原理，不知道 git 解冲突的多种策略。即便如此，大多数人依然可以正常使用 git 完成合并、拉取操作，并且解一些冲突。这得益于 git 默认情况下的合并方式可以处理大多数情况下的正常合并。

然而，你是否遭遇 git 自动合并炸掉的情况？命名提示没有冲突，代码却早已无法编译通过。

本文将带你了解 git 合并和解冲突的各种概念和方法。

---

<div id="toc"></div>

### git 合并的种类

git 合并有以下几种：

1. Fast-forward (快进式合并)
1. Recursive
1. rebase

### git 合并策略

典型的使用指定 git 合并策略的命令这么写：

```bash
$ git merge 要合并进来的分支名 --strategy=合并策略
```

或者使用简写 `-s`，例如：

```bash
$ git merge origin/master -s resolve
```

可以指定的合并策略有：

- resolve
- recursive
- ours
- subtree

不过，如果要说明这些合并策略的含义，需要


---

#### 参考资料

- [Git - merge-strategies Documentation](https://git-scm.com/docs/merge-strategies)
- [When would you use the different git merge strategies? - Stack Overflow](https://stackoverflow.com/a/366940/6233938)
- [git-merge完全解析 - 简书](https://www.jianshu.com/p/58a166f24c81)
