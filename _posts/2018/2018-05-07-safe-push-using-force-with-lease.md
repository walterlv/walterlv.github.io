---
title: "Git 更安全的强制推送，--force-with-lease"
publishDate: 2018-05-07 19:16:42 +0800
date: 2018-09-23 12:33:20 +0800
categories: git
---

由于 `git rebase` 命令的存在，强制将提交推送到远端仓库似乎也有些必要。不过都知道 `git push --force` 是不安全的，这让 `git rebase` 命令显得有些鸡肋。

本文将推荐 `--force-with-lease` 参数，让我们可以更安全地进行强制推送。

---

`--force-with-lease` 参数自 Git 的 1.8.5 版本开始提供，只在解决 `git push --force` 命令造成的安全问题。

#### 那么 `git push --force` 命令有什么安全问题？

`--force` 会使用本地分支的提交覆盖远端推送分支的提交。也就是说，如果其他人在相同的分支推送了新的提交，你的这一举动将“删除”他的那些提交！就算在强制推送之前先 `fetch` 并且 `merge` 或 `rebase` 了也是不安全的，因为这些操作到推送之间依然存在时间差，别人的提交可能发生在这个时间差之内。

如果你对这样的危险没有什么直观的感觉，可以看看这则新闻：

- [还在用 Git 的 -f 参数强推仓库，你这是在作死！](https://my.oschina.net/javayou/blog/2206650)
- [因代码不规范，码农枪击4名同事，一人情况危急](https://mp.weixin.qq.com/s/WwQPn_881H3Knen7KVqsxw)

![git push -f 致使枪杀](/static/posts/2018-09-23-12-31-26.png)  
▲ git push -f 致使枪杀

#### `--force-with-lease` 将解决这种安全问题

使用了 `--force-with-lease` 参数之后，上面那种安全问题就没有那么危险了。

使用此参数推送，如果远端有其他人推送了新的提交，那么推送将被拒绝，这种拒绝和没有加 `--force` 参数时的拒绝是一样的。

> ```bash
> walterlv$ git push --force-with-lease
> To https://github.com/walterlv/walterlv.github.io.git
>  ! [rejected]        master -> master (fetch first)
> error: failed to push some refs to 'https://github.com/walterlv/walterlv.github.io.git'
> ```

**请特别注意**——如果你 `fetch` 之后在本地的 origin 相关分支上已经看到了别人的提交，依然进行强制推送，你还是会覆盖别人的提交。也就是说，`--force-with-lease` **解决的是本地仓库不够新时，依然覆盖了远端新仓库的问题**，如果你**执意想要覆盖远端提交**，只需要先 `fetch` 再推送，**它也不会拒绝的**。

在使用 `git push --force-with-lease` 命令被拒绝时，你需要 `fetch` 仓库，然后确认其他人是否对此分支有新的修改，如果没有，你才可以继续强制推送。

> ```bash
> walterlv$ git fetch
> remote: Counting objects: 46, done.
> remote: Compressing objects: 100% (29/29), done.
> remote: Total 46 (delta 21), reused 40 (delta 15), pack-reused 0
> Unpacking objects: 100% (46/46), done.
> From https://github.com/walterlv/walterlv.github.io
>    e75edf0..217a49d  master     -> origin/master
> ```

在 `fetch` 完毕之后，请一定检查此分支是否已经被其他人修改，如果有新的提交，你应该进行一次 `merge` 或者 `rebase`。

> ```bash
> walterlv$ git rebase
> First, rewinding head to replay your work on top of it...
> Applying: Add post "safe push using force with lease".
> ```

此后，再次进行推送或强制推送即可。

> ```bash
> walterlv$ git push --force-with-lease
> Counting objects: 4, done.
> Delta compression using up to 8 threads.
> Compressing objects: 100% (4/4), done.
> Writing objects: 100% (4/4), 363 bytes | 363.00 KiB/s, done.
> Total 4 (delta 3), reused 0 (delta 0)
> remote: Resolving deltas: 100% (3/3), completed with 3 local objects.
> To https://github.com/walterlv/walterlv.github.io.git
>    219a6d5..dff94a5  master -> master
> ```

#### 额外的问题：为什么推送到远端的提交还依然要用 rebase？

Git 官方文档对 `rebase` 有如下描述：

![Git 官方对 rebase 的描述](/static/posts/2018-05-07-18-58-13.png)  
▲ 如果你想吐槽那段中文翻译，我只想说——那是 Git 的官方中文文档

既然已经推送的提交不应该再进行 `rebase`，那本不应该会遇到本文提到的问题。但是——GitHub 的工作流或者 GitLab 的工作流中，都有一种行为是 `rebase` 自己的分支到 `origin/master` 上，以保证 `master` 分支上的提交是纯粹的干净的。也就是说，本意是禁止对合并到 `master` 或 `develop` 分支上的提交进行 `rebase`；但对于自己的 `temp` 分支或者 `feature` 分支，因为提交还没有合并到主干中，随时删除掉或者将历史进行美化也不会造成太大的问题。

![GitLab 那种要求进行 rebase 的设置](/static/posts/2018-05-07-19-13-29.png)  
▲ 这是 GitLab 上的设置，可以要求提交者必须进行 `rebase` 才允许合并

#### 参考资料

- [Git - git-push Documentation](https://git-scm.com/docs/git-push)
- [How do I properly force a Git push? - Stack Overflow](https://stackoverflow.com/q/5509543/6233938)
- [Force-with-lease: an alternative to force push - Weiqing](http://weiqingtoh.github.io/force-with-lease/)
- [--force considered harmful; understanding git's --force-with-lease - Atlassian Developers](https://developer.atlassian.com/blog/2015/04/force-with-lease/)
