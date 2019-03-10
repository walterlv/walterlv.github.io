---
title: "在 MSBuild 编译项目时阻止输出所有的警告信息"
date: 2019-02-27 17:35:48 +0800
categories: msbuild dotnet visualstudio
position: knowledge
---

大型旧项目可能存在大量的 Warning，在编译之后 Visual Studio 会给出大量的警告。Visual Studio 中可以直接点掉警告，然而如果是通过命令行 msbuild 编译的，那如何不要让警告输出呢？

---

在使用 msbuild 命令编译项目的时候，如果存在大量的警告，输出量会非常多。如果我们使用 msbuild 命令编译来定位项目的编译错误，那么这些警告将会导致我们准确查找错误的效率明显降低。

当然，**这种问题的首选解决方案是 —— 真的修复掉这些警告**！！！

那么可以用什么方式临时关闭 msbuild 命令编译时的警告呢？可以输入如下命令：

```powershell
msbuild /p:WarningLevel=0
```

这样在调试编译问题的时候，因警告而造成的大量输出信息就会少很多。

不过需要注意的是，这种方式不会关闭所有的警告，实际上这关闭的是 csc 命令的警告（`CS` 开头）。关于 csc 命令的警告可以参见：[-warn (C# Compiler Options) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/warn-compiler-option)。于是，如果项目中存在 msbuild 的警告（`MSB` 开头），此方法依然还会输出，只不过如果是为了调试编译问题，那么依然会方便很多，因为 `MSB` 开头的警告会少非常多。

关于警告等级：

- `0`	关闭所有的警告。
- `1`	仅显示严重警告。
- `2`	显示 1 级的警告以及某些不太严重的警告，例如有关隐藏类成员的警告。
- `3`	显示级别 2 警告以及某些不太严重的警告，例如关于始终评估为 `true` 或 `false` 的表达式的警告。
- `4`   *默认值* 显示所有 3 级警告和普通信息警告。

---

**参考资料**

- [command line - How to suppress specific MSBuild warning - Stack Overflow](https://stackoverflow.com/q/1023858/6233938)
- [command line - How to suppress all warnings using MSBuild - Stack Overflow](https://stackoverflow.com/q/2050826/6233938)
- [visual studio 2013 - How to have MSBuild quiet output but with error/warning summary - Stack Overflow](https://stackoverflow.com/q/25565610/6233938)
- [-warn (C# Compiler Options) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/warn-compiler-option)
- [Suppress MSB4126](https://social.msdn.microsoft.com/Forums/en-US/96b3ea2e-92ed-4483-bbfe-a4dda3231eb9/suppress-msb4126)
