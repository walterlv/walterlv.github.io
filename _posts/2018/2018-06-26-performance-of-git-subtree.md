---
title: "git subtree 不断增加的推送时间，解不玩的冲突！这篇文章应该能救你"
publishDate: 2018-06-26 10:32:21 +0800
date: 2018-09-01 08:01:01 +0800
tags: git
coverImage: /static/posts/2018-06-26-10-18-22.png
permalink: /post/performance-of-git-subtree.html
---

原生 git 对于公共组件那种类型的子仓库的支持并不怎么好，就是那种某个子文件夹是一个另外的 git 仓库，并被多个 git 父仓库使用的形式。实际使用的感受甚至是“糟糕透了”。

这种并不友好的子仓库支持可能与 git 的设计理念有关，不过，git 的开发者始终在打补丁以稍微优化这样的体验。

---

<div id="toc"></div>

## 不断增加的推送时间

如果你曾经在大仓库试过 `git subtree push`，你一定为下面这张图感到抓狂：

![](/static/posts/2018-06-26-long-time-of-git-subtree.gif)  
▲ 不断增加的推送时间

注意到总提交数了吗？注意到正在计算的提交数的变化了吗？你估算一下全部推送完毕需要多久？2~3 小时是跑不了的了。

最令人心痛的是，等待了 2~3 个小时之后，还有机会因为 Non-Fast-Forward 而遭受拒绝。

```bash
walterlv@LVYI MINGW64 /c/Users/OpenSource/Walterlv.Demo (temp/migrate)
$ git subtree push --prefix=SubFolder/Walterlv/ demo temp/from-main
git push using:  demo temp/from-main
fatal: ambiguous argument 'cb0580bb6ee76fa96f5bc3c7095303f9a33f5834^0': unknown revision or path not in the working tree.
Use '--' to separate paths from revisions, like this:
'git <command> [<revision>...] -- [<file>...]'
could not rev-parse split hash cb0580bb6ee76fa96f5bc3c7095303f9a33f5834 from commit 691c5a1531ff38d02cb62fa34c99231dbde050b3
To gitlab.gz.cvte.cn:iip-win/cvte-paint.git
 ! [rejected]              1d3913a2e0ec6e4c507dbe2baabae18ef4b8fab9 -> temp/from-main (non-fast-forward)
error: failed to push some refs to 'git@gitlab.gz.cvte.cn:iip-win/cvte-paint.git'
hint: Updates were rejected because a pushed branch tip is behind its remote
hint: counterpart. Check out this branch and integrate the remote changes
hint: (e.g. 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

## 永远也解不完的冲突

在下次执行 `git subtree pull` 的时候，不管两个仓库有什么样的新变化，只要两边的代码不一样——就是冲突。

![](/static/posts/2018-06-26-10-18-22.png)

## 原因

每次执行 subtree 的 push 命令的时候，总会重新为子目录生成新的提交。然而这造成了一些很麻烦的问题：

1. 每个提交都需要重新计算，因此每次推送都需要把主仓库所有的提交计算一遍，非常耗时；
1. 每次 push 都是重新计算的，因此本地和远端新仓库的提交总是不一样的，关键还没有共同的父级，这导致 git 无法自动为我们解决冲突。

## 解决

git subtree 提供了 `split` 命令，官方对此的描述是：

> Extract a new, synthetic project history from the history of the <prefix> subtree. The new history includes only the commits (including merges) that affected <prefix>, and each of those commits now has the contents of <prefix> at the root of the project instead of in a subdirectory. Thus, the newly created history is suitable for export as a separate git repository.
> 
> After splitting successfully, a single commit id is printed to stdout. This corresponds to the HEAD of the newly created tree, which you can manipulate however you want.
> 
> Repeated splits of exactly the same history are guaranteed to be identical (ie. to produce the same commit ids). Because of this, if you add new commits and then re-split, the new commits will be attached as commits on top of the history you generated last time, so 'git merge' and friends will work as expected.
> 
> Note that if you use '--squash' when you merge, you should usually not just '--rejoin' when you split.

意思是说，当使用了 `split` 命令后，git subtree 将确保对于相同历史的分割始终是相同的提交号。

于是，当需要 push 的时候，git 将只计算 split 之后的新提交；并且下次 split 的时候，以前相同的历史纪录将得到相同的 git 提交号。

```bash
$ git subtree split --rejoin --prefix=Dependencies/Cvte.Paint/ HEAD
```

---

**参考资料**

- [git-subtree pull merge conflict - Stack Overflow](https://stackoverflow.com/q/25294227/6233938)
- [git - Reduce increasing time to push a subtree - Stack Overflow](https://stackoverflow.com/q/16134975/6233938)
- [git-subtree/git-subtree.txt at master · apenwarr/git-subtree](https://github.com/apenwarr/git-subtree/blob/master/git-subtree.txt)


