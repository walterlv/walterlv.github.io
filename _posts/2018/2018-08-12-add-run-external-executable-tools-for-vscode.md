---
title: "基于 task 为 VSCode 添加自定义的外部命令"
publishDate: 2018-08-12 20:47:34 +0800
date: 2018-12-30 17:00:43 +0800
tags: vscode
coverImage: /static/posts/2018-08-12-20-35-30.png
---

我们有很多全局的工具能在各处使用命令行调用，针对某个仓库特定的命令可以放到仓库中。不过，如果能够直接为顺手的文本编辑器添加自定义的外部命令，那么执行命令只需要简单的快捷键即可，不需要再手工敲了。

---

<div id="toc"></div>

## 写一个外部命令的调用

由于是调用外部工具，所以工具本身用什么语言写已经不重要的了，只要有环境，没有什么是不能执行的。

这里以我博客中使用的外部命令 [mdmeta](https://github.com/dotnet-campus/markdown-metadata) 为例。我将此工具使用 mklink 命令链接到了 `/build` 文件夹中（当然，如果需要多人协作开发，可以使用 git-lfs 或者 git-submodule 来管理仅项目的外部命令）。关于 mklink 的使用，可以参考 [解决 mklink 使用中的各种坑（硬链接，软链接/符号链接，目录链接）](/post/problems-of-mklink)。

于是，在 `/build` 文件夹中添加可执行的脚本，例如：

```powershell
dotnet build\mdmeta\mdmeta.dll wupdate --ignore-in-hour 6
```

## 让 VSCode 使用此外部命令

如果你说使用 VSCode 嵌入的终端来使用外部命令，那我们其实没做什么，就像使用普通的脚本或者命令一样。

但是，VSCode 自带有 Tasks 机制，可以将命令与 VSCode 集成。关于 Tasks，可以阅读 VSCode 的官方文档：[Tasks in Visual Studio Code](https://code.visualstudio.com/docs/editor/tasks)。

具体来说，是写一个配置文件 /.vscode/tasks.json。

tasks.json 中有少量的默认内容，如果你完全不知道如可开始编写，可以按 F1，选择 `Configure ...` 随便配置一个 Task，然后基于它修改。

![F1](/static/posts/2018-08-12-20-35-30.png)

这里，我定义了两个命令：

- Init Metadata
- Update Metadata

```json
{
    // See https://go.microsoft.com/fwlink/?LinkId=733558
    // for the documentation about the tasks.json format
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Init Metadata",
            "type": "shell",
            "command": "${workspaceRoot}\\build\\mdinit.ps1",
            "problemMatcher": []
        },
        {
            "label": "Update Metadata",
            "type": "shell",
            "command": "${workspaceRoot}\\build\\mdupdate.ps1",
            "problemMatcher": [],
            "group": {
                "kind": "build",
                "isDefault": true
            }
        }
    ]
}
```

当然，这是按照我自己的需求写了两个命令，前者用来初始化我的博客仓库，后者用来更新我所有博客文章的 YAML 元数据。

由于后者才是需要频繁使用的命令，所以我将其设为编译类型的命令（`"kind": "build"`）。具体来说，设定为编译类型并指定为默认（`"isDefault": true`）将获得 `Ctrl+Shift+B` 快捷键的原生支持。

## 使用快捷键执行外部命令

当然，如果你有其他的编译命令，或者你有很多个命令，可以自己指定快捷键。比如我希望按下 `Ctrl+U` 时更新我的元数据（即执行以上第二条命令），直接在命令上加上 `"key": "ctrl+u"` 即可。

```json
{
    "label": "Update Metadata",
    "type": "shell",
    "key": "ctrl+u",
    "command": "${workspaceRoot}\\build\\mdupdate.ps1",
    "problemMatcher": [],
    "group": {
        "kind": "build",
        "isDefault": true
    }
}
```

---

**参考资料**

- [Tasks in Visual Studio Code](https://code.visualstudio.com/docs/editor/tasks)

