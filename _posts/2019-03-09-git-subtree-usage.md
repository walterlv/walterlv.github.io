---
title: "git subtree 的使用"
publishDate: 2019-03-07 09:19:47 +0800
date: 2019-03-08 08:54:01 +0800
categories: git
position: starter
published: false
---

本文收集 git subtree 的使用。

---

<div id="toc"></div>

### 将 B 仓库添加为 A 仓库的一个子目录

在 A 仓库的根目录输入命令：

```powershell
git subtree add --prefix=SubFolder/B https://github.com/walterlv/walterlv.git master
```

这样，B 仓库的整体，会被作为 A 仓库中一个 `SubFolder/B` 的子文件夹，同时保留 B 仓库中的整个日志记录。

---

#### 参考资料