---
title: "清理 git 仓库太繁琐？试试 bfg！删除敏感信息删除大文件一句命令搞定（比官方文档还详细的使用说明）"
date: 2019-10-29 11:52:20 +0800
categories: git
position: starter
---

你可能接触过 `git-filter-branch` 来清理 git 仓库，不过同时也能体会到这个命令使用的繁琐，以及其超长的执行时间。

现在，你可以考虑使用 `bfg` 来解决问题了！

---

<div id="toc"></div>

## 安装 bfg

### 传统方式安装（不推荐）

1. 下载安装 [Java 运行时](https://www.java.com/zh_CN/download/)
2. 下载安装 [bfg.jar](https://search.maven.org/classic/remote_content?g=com.madgag&a=bfg&v=LATEST)

这里并不推荐使用传统方式安装，因为传统方式安装后，`bfg` 不会成为你计算机的命令。在实际使用工具的时候，你必须为你的每一句命令加上 `java -jar bfg.jar` 前缀来使用 Java 运行时间接运行。

### 使用包管理器 scoop 安装

如果你使用包管理器 scoop，那么安装将会非常简单，只需要以下几个命令。

- `scoop install bfg`
- `scoop bucket add java`
- `scoop install java/openjdk`

安装 bfg：

```powershell
PS C:\Users\lvyi> scoop install bfg
Installing 'bfg' (1.13.0) [64bit]
bfg-1.13.0.jar (12.8 MB) [============================================================================================================================] 100%
Checking hash of bfg-1.13.0.jar ... ok.
Linking ~\scoop\apps\bfg\current => ~\scoop\apps\bfg\1.13.0
Creating shim for 'bfg'.
'bfg' (1.13.0) was installed successfully!
'bfg' suggests installing 'java/oraclejdk' or 'java/openjdk'.
```

安装 Java 源：

```powershell
PS C:\Users\lvyi> scoop bucket add java
Checking repo... ok
The java bucket was added successfully.
```

安装 Jdk：

```powershell
PS C:\Users\lvyi> scoop install java/openjdk
Installing 'openjdk' (13.0.1-9) [64bit]
openjdk-13.0.1_windows-x64_bin.zip (186.9 MB) [=======================================================================================================] 100%
Checking hash of openjdk-13.0.1_windows-x64_bin.zip ... ok.
Extracting openjdk-13.0.1_windows-x64_bin.zip ... done.
Linking ~\scoop\apps\openjdk\current => ~\scoop\apps\openjdk\13.0.1-9
'openjdk' (13.0.1-9) was installed successfully!
```
## 准备工作

当你准备好清理你的仓库的时候，需要进行一些准备。

1. 克隆一个镜像仓库（`git clone` 命令加上 `--mirror` 参数）
    - 这样，当你 `git push` 的时候，会更新远端仓库的所有引用
1. `cd` 到你要清理的仓库路径的根目录
    - 如果你没有前往根目录，那么本文后面的所有命令的最后面你都应该加上路径
1. 可能需要解除保护
    - 如果本文后面的命令你遇到了受保护的提交，那么需要在所有命令的后面加上 `--no-blob-protection` 参数

## 常见用法

### 删除误上传的大文件

使用下面的命令，可以将仓库历史中大于 500M 的文件都删除掉。

```powershell
> bfg --strip-blobs-bigger-than 500M
```

### 删除特定的一个或多个文件

删除 `walterlv.snk` 文件：

```powershell
> bfg --delete-files walterlv.snk
```

删除 walterlv.snk 或 lindexi.snk 文件：

```powershell
> bfg --delete-files {walterlv,lindexi}.snk
```

比如原来仓库结构是这样的：

```
- README.md
- Security.md
- walterlv.snk
+ test
    - lindexi.snk
```

那么删除完后，根目录的 walterlv.snk 和 test 子目录下的 lindexi.snk 就都删除了。

### 删除文件夹

删除名字为 walterlv 的文件夹：

```powershell
> bfg --delete-folders walterlv
```

此命令可以与上面的 `--delete-files` 放在一起执行：

```powershell
> bfg --delete-folders walterlv --delete-files walterlv.snk
```

### 删除敏感的密码信息

```powershell
> bfg --replace-text expression-file.txt
```

注意，这里的 expression-file.txt 名称是随便取的，你可以取其他任何名称，只要在命令里输入正确的名称（可能需要包含路径）就行。

但是 expression-file.txt 里面的内容却是我们需要关注的重点。

此文件中的每一行是一个匹配表达式。默认情况下，每一个表达式被视为一段文本常量，但你可以通过指定 `regex:` 前缀来说明此表达式是一个正则表达式，或者指定 `glob:` 前缀。每一个表达式的后面可以加上 '==>' 来指定匹配的文件应该被替换成什么（如果没有指定，就会被替换成默认值 `***REMOVED***`。

下面这个例子示例将 git 仓库中所有文件中的 `密码：123456` 字符串替换成 `***REMOVED***`：

```
密码：123456
```

更复杂一点的，下面的例子示例将 git 仓库中所有文件中的 `密码：123456` 字符串替换成 `密码：******`：

```
密码：123456 ==> 密码：******
```

还可以使用正则表达式：

```
regex:密码：\d+ ==> 密码：******
```

## 推回远端仓库

当你在本地操作完镜像仓库之后，可以将其推回原来的远端仓库了。

```powershell
> git push
```

最后，有一个不必要的操作。就是回收已经没有引用的旧提交，这可以减小本地仓库的大小：

```powershell
> git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

## 附命令行用法输出

直接在命令行输入 `bfg` 可以看 `bfg` 命令行的用法。我贴在下面可以让还没安装的小伙伴感受一下它的功能：

```powershell
PS C:\Users\lvyi\Desktop\BfgDemoRepo> bfg
bfg 1.13.0
Usage: bfg [options] [<repo>]

  -b, --strip-blobs-bigger-than <size>
                           strip blobs bigger than X (eg '128K', '1M', etc)
  -B, --strip-biggest-blobs NUM
                           strip the top NUM biggest blobs
  -bi, --strip-blobs-with-ids <blob-ids-file>
                           strip blobs with the specified Git object ids
  -D, --delete-files <glob>
                           delete files with the specified names (eg '*.class', '*.{txt,log}' - matches on file name, not path within repo)
  --delete-folders <glob>  delete folders with the specified names (eg '.svn', '*-tmp' - matches on folder name, not path within repo)
  --convert-to-git-lfs <value>
                           extract files with the specified names (eg '*.zip' or '*.mp4') into Git LFS
  -rt, --replace-text <expressions-file>
                           filter content of files, replacing matched text. Match expressions should be listed in the file, one expression per line - by default, each expression is treated as a literal, but 'regex:' & 'glob:' prefixes are supported, with '==>' to specify a replacement string other than the default of '***REMOVED***'.
  -fi, --filter-content-including <glob>
                           do file-content filtering on files that match the specified expression (eg '*.{txt,properties}')
  -fe, --filter-content-excluding <glob>
                           don't do file-content filtering on files that match the specified expression (eg '*.{xml,pdf}')
  -fs, --filter-content-size-threshold <size>
                           only do file-content filtering on files smaller than <size> (default is 1048576 bytes)
  -p, --protect-blobs-from <refs>
                           protect blobs that appear in the most recent versions of the specified refs (default is 'HEAD')
  --no-blob-protection     allow the BFG to modify even your *latest* commit. Not recommended: you should have already ensured your latest commit is clean.
  --private                treat this repo-rewrite as removing private data (for example: omit old commit ids from commit messages)
  --massive-non-file-objects-sized-up-to <size>
                           increase memory usage to handle over-size Commits, Tags, and Trees that are up to X in size (eg '10M')
  <repo>                   file path for Git repository to clean
```

我觉得你可能需要中文版，于是自己翻译了一下：

```powershell
PS C:\Users\lvyi\Desktop\BfgDemoRepo> bfg
bfg 1.13.0
用法: bfg [options] [<repo>]

  -b, --strip-blobs-bigger-than <size>
                           移除大于 <size> 大小的文件（<size> 可填写诸如 '128K'、'1M'）
  -B, --strip-biggest-blobs NUM
                           从大到小移除 NUM 数量的文件
  -bi, --strip-blobs-with-ids <blob-ids-file>
                           移除具有指定 git 对象 id 的文件
  -D, --delete-files <glob>
                           移除具有指定名称的文件（例如 '*.class'、'*.{txt,log}'，仅匹配文件名而不能匹配路径）
  --delete-folders <glob>  移除具有指定名称的文件夹（例如 '.svn'、'*-tmp'，仅匹配文件夹名而不能匹配路径）
  --convert-to-git-lfs <value>
                           将指定名称的文件（例如 '*.zip' 或 '*.mp4'）解压到 Git LFS
  -rt, --replace-text <expressions-file>
                           查找文件内容，并替换其中匹配的文本。<expressions-file> 是一个包含一个或多个匹配表达式的文件，文件中每一行是一个匹配表达式。
                           默认情况下，每一个表达式被视为一段文本常量，但你可以通过指定 'regex:' 前缀来说明此表达式是一个正则表达式，或者指定 'glob:' 前缀。
                           每一个表达式的后面可以加上 '==>' 来指定匹配的文件应该被替换成什么（如果没有指定，就会被替换成默认值 '***REMOVED***'。
  -fi, --filter-content-including <glob>
                           指定文件名（例如 '*.{txt,properties}'），在进行内容替换的时候只对这些文件进行处理。
  -fe, --filter-content-excluding <glob>
                           指定文件名（例如 '*.{xml,pdf}'），在进行内容替换的时候不对这些文件进行处理。
  -fs, --filter-content-size-threshold <size>
                           仅对小于 <size> 指定的大小的文件替换内容。（默认值为 1048576 字节）
  -p, --protect-blobs-from <refs>
                           protect blobs that appear in the most recent versions of the specified refs (default is 'HEAD')
  --no-blob-protection     allow the BFG to modify even your *latest* commit. Not recommended: you should have already ensured your latest commit is clean.
  --private                仅将本次操作视为个人数据的修改（这样生成的新提交会使用旧提交的 Id，其他人拉取仓库的时候因为这些 Id 已经存在于是不会更新，以至于此更改实际上只影响自己）。
  --massive-non-file-objects-sized-up-to <size>
                           increase memory usage to handle over-size Commits, Tags, and Trees that are up to X in size (eg '10M')
  <repo>                   file path for Git repository to clean
```

---

**参考资料**

- [BFG Repo-Cleaner by rtyley](https://rtyley.github.io/bfg-repo-cleaner/)
