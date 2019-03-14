---
title: "手工编辑 tasks.json 和 launch.json，让你的 VSCode 具备调试 .NET Core 程序的能力"
date: 2019-03-14 22:30:52 +0800
categories: dotnet csharp vscode msbuild visualstudio
position: starter
---

如果 C# for Visual Studio Code 没有办法自动为你生成正确的 tasks.json 和 launch.json 文件，那么可以考虑阅读本文手工创建他们。

---

<div id="toc"></div>

## 前期准备

你需要安装 .NET Core Sdk、Visual Studio Code 和 C# for Visual Studio Code，然后打开一个 .NET Core 的项目。如果你没有准备，请先阅读：

- [让你的 VSCode 具备调试 C# 语言 .NET Core 程序的能力](/post/equip-vscode-for-dotnet-core-app-debugging.html)

本文主要处理自动生成的配置文件无法满足要求，手工生成。

## 半自动创建 tasks.json 和 launch.json

这依然是个偷懒的好方案，我喜欢。

1. 按下 F5；
2. 在弹出的列表中，选择 .NET Core；

![选择 .NET Core](/static/posts/2019-03-14-22-14-37.png)

![自动生成的 tasks.json 和 launch.json](/static/posts/2019-03-14-22-15-53.png)

你不需要再做什么其他的工作了，这时再按下 F5 你已经可以开始调试了。

## 全手工创建 tasks.json 和 launch.json

tasks.json 定义一组任务。其中我们需要的是编译任务，通常编译一个项目使用的动词是 `build`。比如 `dotnet build` 命令就是这样的动词。

于是定义一个名字为 `build` 的任务，对应 `label` 标签。`command` 和 `args` 对应我们在命令行中编译一个项目时使用的命令行和参数。`type` 为 `process` 表示此任务是启动一个进程。

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "build",
            "command": "dotnet",
            "type": "process",
            "args": [
                "build",
                "${workspaceFolder}/Walterlv.InfinityStartupTest/Walterlv.InfinityStartupTest.csproj"
            ],
            "problemMatcher": "$msCompile"
        }
    ]
}
```

在 launch.json 中通常配置两个启动配置，一个是启动调试，一个是附加调试。

`type` 是在安装了 [C# for Visual Studio Code (powered by OmniSharp)](https://marketplace.visualstudio.com/items?itemName=ms-vscode.csharp) 插件之后才会有的调试类型。`preLaunchTask` 表示在此启动开始之前需要执行的任务，这里指定的 `build` 跟前面的 `build` 任务就关联起来了。`program` 是调试的程序路径，`console` 指定调试控制台使用内部控制台。

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "调试 Walterlv 的自动化测试程序",
            "type": "coreclr",
            "request": "launch",
            "preLaunchTask": "build",
            "program": "${workspaceFolder}/Walterlv.InfinityStartupTest/bin/Debug/netcoreapp3.0/Walterlv.InfinityStartupTest.dll",
            "args": [],
            "cwd": "${workspaceFolder}/Walterlv.InfinityStartupTest",
            "console": "internalConsole",
            "stopAtEntry": false,
            "internalConsoleOptions": "openOnSessionStart"
        },
        {
            "name": "附加进程",
            "type": "coreclr",
            "request": "attach",
            "processId": "${command:pickProcess}"
        }
    ]
}
```

这样自己手写的方式更灵活但是也更难。
