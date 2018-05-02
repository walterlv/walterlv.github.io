---
title: "使用 MSBuild 响应文件 (rsp) 来指定 dotnet build 命令行编译时的大量参数"
date: 2018-04-03 19:51:04 +0800
categories: visualstudio
---

在为开源项目 [dotnet-campus/MSTestEnhancer](https://github.com/dotnet-campus/MSTestEnhancer/) 进行持续集成编译时，需要在编译命令中传入较多的参数。这对于新接手此项目的人来说，成本还是高了一点儿。本文将介绍 MSBuild 响应文件 (MSBuild Response Files, *.rsp) 来优化命令行编译体验。

---

我们在 msbuild 命令中加入 `/?` 参数可以看到它对响应文件的解释：

```powershell
> dotnet build /?

# 省略了一部分输出，只保留响应文件相关的两个。
@<file>             从文本文件插入命令行设置。若要指定
                    多个响应文件，请分别指定每个响应
                    文件。

                    自动从以下位置使用任何名为 "msbuild.rsp" 的
                    响应文件:
                    (1) msbuild.exe 的目录
                    (2) 生成的第一个项目或解决方案的目录
/noautoresponse     不自动包括任何 MSBuild.rsp 文件。(缩写:
                    /noautorsp)
```

当然，使用 `dotnet msbuild` 或者直接使用 `msbuild.exe` 都是一样的具备此功能。

那么响应文件到底是什么呢？我们在 `dotnet build` 命令后传入的参数就可以是响应文件的内容。

- 响应文件以 `.rsp` 扩展名结尾，放在任何地方就行，只需要在 `dotnet build` 命令中用 `@` 指定即可。
- 也可以用预定的文件名 `Directory.Build.rsp`，放在 `sln` 同级目录或者父级目录中。

比如，在这个项目中，我直接在解决方案同级目录中新建了 `Directory.Build.rsp` 文件，并写入这些内容：

```powershell
/p:Configuration=Release
/maxcpucount
/p:Version=1.6.0-beta
/p:AssemblyVersion=1.6.0.0
```

这样，当执行命令 `dotnet build` 或 `dotnet msbuild` 时，将执行这些事情：

- 使用 Release 配置进行编译
- 当前计算机有多少 CPU 核，就使用多少个进程进行并行编译
- NuGet 包打包版本设置为 1.6.0-beta（这将覆盖 csproj 中设置的 Version 属性）
- 程序集版本设置为 1.6.0。0（这将覆盖 csproj 中设置的 AssemblyVersion 属性）

当然，还可以写更多的事情，但命令依旧简单——对新开发者是非常友好的。

---

#### 参考资料

- [MSBuild Response Files - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-response-files)
- [Default or specify msbuild properties in an external file - Stack Overflow](https://stackoverflow.com/questions/20414122/default-or-specify-msbuild-properties-in-an-external-file)
- [How to use MSBuild.rsp or otherwise specify default Visual Studio MSBuild.exe command line switches - Super User](https://superuser.com/questions/764631/how-to-use-msbuild-rsp-or-otherwise-specify-default-visual-studio-msbuild-exe-co)
