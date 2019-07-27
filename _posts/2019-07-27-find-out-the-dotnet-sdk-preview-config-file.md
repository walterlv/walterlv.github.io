---
title: "找出 .NET Core SDK 是否使用预览版的全局配置文件在那里（探索篇）"
date: 2019-07-27 13:19:41 +0800
categories: msbuild visualstudio dotnet
position: problem
---

你是否好奇 Visual Studio 2019 中的 .NET Core SDK 预览版开关是全局生效的，那个全局的配置在哪里呢？

本文将和你一起探索找到这个全局的配置文件。

---

<div id="toc"></div>

## 使用 Process Monitor 探索

### 下载 Process Monitor

Process Monitor 是微软极品工具箱的一部分，你可以在此页面下载：

- [Process Monitor - Windows Sysinternals - Microsoft Docs](https://docs.microsoft.com/en-us/sysinternals/downloads/procmon)

### 打开 Process Monitor

当你一开始打开 Process Monitor 的时候，列表中会立刻刷出大量的进程的操作记录。这么多的记录会让我们找到目标进程操作的文件有些吃力，于是我们需要设置规则。

Process Monitor 的工具栏按钮并不多，而且我们这一次的目标只会用到其中的两个：

- 清除列表（将已经记录的所有数据清空，便于聚焦到我们最关心的数据中）
- 设置过滤器（防止大量无关的进程操作进入列表中干扰我们的查找）

![Process Monitor 的工具栏按钮](/static/posts/2019-06-01-13-36-35.png)

### 设置过滤规则

在工具栏上点击“设置过滤器”，然后，添加我们感兴趣的两个进程名称：

- `devenv.exe`
- `MSBuild.exe`

前者是 Visual Studio 的进程名，后者是 MSBuild.exe 的进程名。我们使用这两个进程名称分别找到 Visual Studio 2019 是如何设置全局 .NET Core 预览配置的，并且在命令行中运行 MSBuild.exe 来验证确实是这个全局配置。

然后排除除了文件意外的所有事件类型，最终是如下过滤器：

![设置过滤器](/static/posts/2019-07-27-10-09-14.png)

### 捕获 devenv.exe

现在，我们打开 Visual Studio 2019，然后停留到下面这个界面中。改变一下 .NET Core SDK 预览版选项的勾选状态。

![设置 Visual Studio 2019 使用 .NET Core SDK 预览版](/static/posts/2019-07-27-09-00-09.png)

现在，我们点击一下“确定”，将立即可以在 Process Monitor 中看到一些文件的修改：

![捕获到的文件修改](/static/posts/2019-07-27-10-24-15.png)

上面是在点击“确定”按钮一瞬间 Visual Studio 2019 的所有文件操作。你可以注意到左侧的时间，我的截图中从 45 秒到 48 秒是可能有效的文件读写，再后面已经延迟了 10 秒了，多半是其他的操作。

在这些文件中，可以很明显看到文件分为三类：

- `sdk.txt` 一个不知名的文件，但似乎跟我们的 .NET Core SDK 相关
- `SettingsLogs` 一看就是给设置功能用的日志
- `VSApplicationInsights` 一看就是数据收集相关

通过排除法，我们能得知最关键的文件就是那个 `sdk.txt`。去看一看那个文件的内容，发现只有一行：

```
UsePreviews=True
```

这基本上可以确认 Visual Studio 2019 设置是否使用 .NET Core SDK 预览版就是在这个文件中。

不过，这带来一个疑惑，就是这个路径特别不像是 .NET Core SDK 的配置路径，倒像是 Visual Studio 自己的设置配置。

于是必须通过其他途径来确认这是否就是真实的全局配置。

### 捕获 MSBuild.exe

现在，我们清除一下 Process Monitor 中的已经记录的数据，然后，我们在命令行中对一个项目敲下 `msbuild` 命令。

```powershell
> msbuild
```

然后在 Process Monitor 里面观察事件。这次发现事件相当多，于是换个方式。

因为我们主要是验证 `sdk.txt` 文件，但同时希望看看是否还有其他文件。于是我们将 `sdk.txt` 文件相关的事件高亮。

点击 `Filter` -> `Highlight...`，然后选择 `Path` `contains` `sdk.txt` 时则 `Include`。

![打开 Highlight](/static/posts/2019-07-27-12-58-58.png)

![高亮 sdk.txt 文件](/static/posts/2019-07-27-12-58-25.png)

这时，再看捕获到的事件，可以发现编译期间确实读取了这个文件。

![MSBuild.exe 读取了 sdk.txt](/static/posts/2019-07-27-13-00-23.png)

此举虽不能成为此文件是全局配置的铁证，但至少说明这个文件与全局配置非常相关。

另外，继续在记录中翻找，还可以发现与此配置可能相关的两个 dll：

- Microsoft.Build.NuGetSdkResolver.dll
- Microsoft.DotNet.MSBuildSdkResolver.dll

![可能与此相关的 dll](/static/posts/2019-07-27-13-02-48.png)

### 验证结论

要验证此文件确实是全局配置其实也很简单，自行改一改配置，然后使用 MSBuild.exe 编译试试即可。

现在，将 sdk.txt 文件内容改为：

```
UsePreviews=False
```

编译一下使用了 .NET Core 3.0 新特性的项目（我使用了 Microsoft.NET.Sdk.WindowsDesktop，这是 3.0 才有的 SDK）。

![不使用预览版编译](/static/posts/2019-07-27-13-07-51.png)

编译错误，提示 Microsoft.NET.Sdk.WindowsDesktop 这个 SDK 没有找到。

现在，将 sdk.txt 文件内容改为：

```
UsePreviews=True
```

编译相同的项目，发现可以正常编译通过了。

![使用预览版编译](/static/posts/2019-07-27-13-09-39.png)

这可以证明，此文件正是决定是否使用预览版的决定性证据。

### 其他

但值得注意的是，打开 Visual Studio 2019 后，发现其设置界面并没有应用此文件最新的修改，这可以说 Visual Studio 2019 的配置是不止这一处。

## 反编译探索

通过反编译探索的方式感谢小伙伴 [KodamaSakuno (神樹桜乃)](https://github.com/KodamaSakuno) 彻夜寻找。

相关的代码在 [cli/VSSettings.cs at master · dotnet/cli](https://github.com/dotnet/cli/blob/master/src/Microsoft.DotNet.MSBuildSdkResolver/VSSettings.cs) 中，你可以前往查看。

在 `VSSettings` 的构造函数中，为字段 `_settingsFilePath` 赋值，拼接了 `sdk.txt` 文件的路径。

```csharp
_settingsFilePath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
    "Microsoft",
    "VisualStudio",
    version.Major + ".0_" + instanceId,
    "sdk.txt");
```

读取时，使用此路径下的 `sdk.txt` 文件读取了 `UsePreviews` 变量的值。

```csharp
private void ReadFromDisk()
{
    using (var reader = new StreamReader(_settingsFilePath))
    {
        string line;
        while ((line = reader.ReadLine()) != null)
        {
            int indexOfEquals = line.IndexOf('=');
            if (indexOfEquals < 0 || indexOfEquals == (line.Length - 1))
            {
                continue;
            }

            string key = line.Substring(0, indexOfEquals).Trim();
            string value = line.Substring(indexOfEquals + 1).Trim();

            if (key.Equals("UsePreviews", StringComparison.OrdinalIgnoreCase)
                && bool.TryParse(value, out bool usePreviews))
            {
                _disallowPrerelease = !usePreviews;
                return;
            }
        }
    }

    // File does not have UsePreviews entry -> use default
    _disallowPrerelease = _disallowPrereleaseByDefault;
}
```
