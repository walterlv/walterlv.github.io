---
title: "在整个 Git 仓库的历史（包括所有分支和标签）中修改提交作者的信息（姓名和邮箱）"
date: 2019-05-23 16:15:26 +0800
tags: git
position: problem
coverImage: /static/posts/2019-05-23-16-07-59.png
---

一般情况下不建议修改 git 仓库的历史。

但是现在我计划开源我的一个项目，于是自己个人使用的姓名和邮箱就需要在开源的时候改为使用我公开的姓名和邮箱。对于旧仓库，我将废弃，将来所有的精力都将在开源版本的仓库中；而对于开源版本的新仓库，由于此前没有人克隆过，所以也不会因为历史的修改产生问题。所以，我可以很放心地更改全部的 git 仓库历史。

---

我打算将整个 Git 仓库历史中的名称和邮箱。

## 第一步：打开 Git Bash

进入本地的 Git 仓库目录，然后打开 Git Bash。

## 第二步：输入 Git 命令

接下来，我们需要输入一段多行命令。请先复制以下命令到你的临时编辑器中，然后修改这段多行命令中的几个变量的值。

多行命令：

```bash
git filter-branch --env-filter '

OLD_EMAIL="your-old-email@example.com"
CORRECT_NAME="Your Correct Name"
CORRECT_EMAIL="your-correct-email@example.com"

if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
```

请注意上面那几个变量：

- `OLD_EMAIL` 修改为你的旧邮箱（也就是需要替换掉的 Git 历史中的邮箱）
- `CORRECT_NAME` 修改为你的新名称
- `CORRECT_EMAIL` 修改为你的新邮箱

对我来说，新名称也就是我在 GitHub 上的名称 [walterlv](https://github.com/walterlv)，新邮箱也就是我在 GitHub 上公开使用的提交邮箱。

将以上修改后的命令粘贴到 Git Bash 中，然后按下回车键执行命令：

![执行命令](/static/posts/2019-05-23-16-07-59.png)

等待命令执行结束，你就能看到你的仓库中所有的分支（Branches）、所有的标签（Tags）中的旧作者信息全部被替换为了新作者信息了。

![执行结果](/static/posts/2019-05-23-16-06-39.png)

## 第三步：推送仓库

如果你只是准备开源这个仓库，还没开始推送，那么直接推送即可。使用以下命令推送所有的分支和所有的标签。

```bash
git push --force --tags origin 'refs/heads/*'
```

如果你已经将仓库推送出去了，那么就需要强制推送来覆盖远端的仓库。使用以下命令推送所有的分支和所有的标签。

```bash
git push --tags origin 'refs/heads/*'
```

---

**参考资料**

- [Changing author info - GitHub Help](https://help.github.com/en/articles/changing-author-info)

