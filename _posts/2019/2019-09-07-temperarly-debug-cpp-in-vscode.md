---
title: "临时编写和调试 C++ 代码？用 VSCode 就够了！一分钟搭好 C++ 调试环境"
publishDate: 2019-09-07 09:52:29 +0800
date: 2019-09-07 10:07:36 +0800
categories: cpp vscode
position: knowledge
---

突然间要编写或者调试几个 C++ 的小程序，动用 Visual Studio 创建一个解决方案显得大了些。如果能够利用随时随地就方便打开的 Visual Studio Code 来开发，则清爽很多。

本文教你一分钟在 Visual Studio Code 中搭建好 C++ 开发环境。

---

## 本文大纲

本文总共分为三个步骤，每个步骤都非常简单。

<div id="toc"></div>

## 第一步：安装扩展

你需要在 Visual Studio Code 中安装 [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) 扩展。

![安装 C++ 扩展](/static/posts/2019-09-07-09-30-54.png)

## 第二步：启动 VSCode

注意，安装完成后，要通过 Visual Studio 自带的 `Developer Command Prompt for VS 2019` 来启动 Visual Studio Code。这样才可以获得 Visual Studio 2019 自带的各种编译工具路径的环境变量。Visual Studio Code 就可以无缝使用 Visual Studio 2019 附带的那些工具。

![启动 Developer Command Prompt for VS 2019](/static/posts/2019-09-07-09-32-39.png)

然后，在新启动的命令行工具中启动 Visual Studio Code。

输入 `code` 即可启动：

```powershell
> code
```

如果已有线程的路径，可以带上路径的命令行参数：

```powershell
> code C:\Users\lvyi\Desktop\Walterlv.CppDemo
```

![启动 Visual Studio Code](/static/posts/2019-09-07-09-36-42.png)

## 第三步：F5 运行

随便在目录中新建一个文件，写上 C++ 代码。比如在 `example.cpp` 文件中写上如下代码：

```cpp
#include<iostream>
using namespace std;

int main()
{
    cout<<"welcome to blog.walterlv.com";
    return 0;
}
```

按下 F5，选择对应的 C++ 编译平台（我这里选择 `C++ (Windows)`），然后选择 `cl.exe build and debug active file`。

![选择编译平台](/static/posts/2019-09-07-09-41-01.png)

`cl.exe build and debug active file` 的目的是调试当前激活的文件，这样的调试方式在 python/java 等语言中大家屡见不鲜，好处是对于小型代码调试起来非常简单直接。

![选择调试当前文件](/static/posts/2019-09-07-09-42-26.png)

接下来 Visual Studio Code 就会生成一些调试所需的配置文件。

再次按下 F5，Visual Studio Code 会提示没有编译任务，点击 `Configure Task`，随后选择 `C/C++: cl.exe build active file`。

![Configure Task](/static/posts/2019-09-07-09-47-09.png)

![C/C++: cl.exe build active file](/static/posts/2019-09-07-09-47-26.png)

接下来 Visual Studio Code 就会生成一些编译所需的配置文件。

再次按下 F5 就可以直接编译 `example.cpp` 文件然后运行调试了。

![调试当前文件](/static/posts/2019-09-07-09-48-53.png)

输出在 Debug Console 里面：

![Debug Console](/static/posts/2019-09-07-09-49-57.png)

## 其他注意事项

如果你给 Visual Studio 设置了非默认的终端，那么需要注意：

- 应该使用 PowerShell 系列的终端（例如 `pwsh`）不能使用 bash 系列的终端。因为 Windows 下工具使用的路径格式是反斜杠 `\`，而 bash 系列终端使用的路径是斜杠 `/`。如果使用 bash 终端，编译工具会因为路径问题导致编译失败。

另外，不要怪我说我是这么编写教程的：

> 首先，我们已知 1+1=2

![1+1=2](/static/posts/2019-09-07-10-06-06.png)

> 于是可以推导出……

![推导出](/static/posts/2019-09-07-10-06-10.png)
