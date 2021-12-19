---
title: "解决包含 GitHub Actions Workflow 的分支无法推送的问题"
date: 2020-05-26 21:48:42 +0800
tags: github
position: problem
coverImage: /static/posts/2020-05-26-21-30-01.png
permalink: /post/github-push-failed-without-workflow-scope.html
---

refusing to allow an OAuth App to create or update workflow `{0}` without `workflow` scope.

GitHub 推送失败？试试本文方法。

---

<div id="toc"></div>

## 问题

试图向 GitHub 推送一个分支的时候，出现错误 `refusing to allow an OAuth App to create or update workflow `{0}` without `workflow` scope`。

这个错误是说，因为 OAuth 的应用没有指定 workflow 范围，所以无法推送带有更新 workflow 的分支。

虽然我实际上没有对 workflow 做任何更新，但也被拒绝了。所以这个问题必须直接解决，绕不开。

```powershell
git.exe push self master:t/walterlv/trigger
Enumerating objects: 17, done.
Counting objects: 100% (17/17), done.
Delta compression using up to 8 threads
Compressing objects: 100% (9/9), done.
Writing objects: 100% (9/9), 754 bytes | 754.00 KiB/s, done.
Total 9 (delta 8), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (8/8), completed with 8 local objects.
To https://github.com/dotnet-campus/HandyControl.git
! [remote rejected]   master -> t/walterlv/trigger (refusing to allow an OAuth App to create or update workflow `.github/workflows/build.yml` without `workflow` scope)
error: failed to push some refs to 'https://github.com/dotnet-campus/HandyControl.git'
```

## 解决

去 GitHub Personal Access Tokens 页面：

- [Personal Access Tokens](https://github.com/settings/tokens)

生成一个新的 Token。特别注意在生成的时候要勾选 `workflow`（如果不确定勾选哪些的话，就全部勾选）：

![生成新的 Token](/static/posts/2020-05-26-21-30-01.png)

然后复制新的 Token：

![复制新的 Token](/static/posts/2020-05-26-21-34-28.png)

打开凭据管理器：

![凭据管理器](/static/posts/2020-05-26-21-35-17.png)

在 Windows 凭据标签下，找到 GitHub 的几个凭据，然后编辑：

- git:https://github.com
- git:https://walterlv@github.com

![编辑 GitHub 凭据](/static/posts/2020-05-26-21-43-56.png)

把密码改成刚刚复制的那个 Token，然后保存：

![粘贴并保存密码](/static/posts/2020-05-26-21-38-27.png)

如果你那里有很多 GitHub 相关的凭据而不确定是哪一个的话，可以考虑全部删掉。这样下次推送的时候就会要求你输入账号密码，输入那个 Token 作为密码即可。

现在，你就能推送成功了。


