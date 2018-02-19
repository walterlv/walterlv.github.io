---
title: "安利一款非常好用的命令行参数库：Microsoft.Extensions.CommandlineUtils"
date_published: 2017-10-21 09:44:02 +0800
date: 2018-02-20 06:34:47 +0800
categories: dotnet dotnet-core dotnet-standard
description: 
---

命令行参数解析想必是每一个命令行程序都难以避开的工程。这工程可小可大，但每次都写始终是在浪费时间。而且，不同人实现也千差万别，使得不同的命令行程序命令参数传入的体验总有差异。

于是安利一款命令行工具库——`Microsoft.Extensions.CommandlineUtils`，微软出品，却符合当下各大主流命令行工具的参数体验；而且，代码非常简洁。我为此封装了一组基于反射调用命令的类，以至于实现复杂的命令代码也能非常简洁。

---

<p id="toc"></p>

### 体验超级简洁的代码吧！

我正在自己的项目中采用这款库，项目名为 `mdmeta`，用于自动生成 Markdown 前的元数据标签，写博客非常方便。

项目地址：[walterlv/markdown-metadata: Markdown Metadata (also called mdmeta) is a tool to generate and manage the front matter metadata. It is a cross-platform console app based on .Net Core 2.0.](https://github.com/walterlv/markdown-metadata)

#### 体验主流的命令行参数体验

```powershell
# 不带任何参数
mdmeta
```

```powershell
# 一个简单的命令
mdmeta echo
```

```powershell
# 一个带参数（Argument）的简单的命令
mdmeta echo "Hello!"
```

```powershell
# 一个带选项（Option）的简单命令
mdmeta echo --upper
```

```powershell
# 一个带参数（Argument）带选项（Option）且选项中带值的简单命令
mdmeta echo "Hello!" -s ", "
```

```powershell
# 一个带参数（Argument）带多种选项（Option）且部分选项中带多个值的简单命令
mdmeta echo "Hello!" --repeat-count=3 -s ", " -s "| "
```

#### 体验库的原生命令行参数配置

原生 `Microsoft.Extensions.CommandlineUtils` 要配出以上的命令，代码非常简洁。

```csharp
static int Main(string[] args)
{
    var app = new CommandLineApplication{Name = "mdmeta"};
    app.HelpOption("-?|-h|--help");
    app.OnExecute(() =>
    {
        app.ShowHelp();
        return 0;
    });
    app.Command("echo", command =>
    {
        command.Description = "输出用户输入的文字。";
        command.HelpOption("-?|-h|-help");
        var wordsArgument = command.Argument("[words]", "指定需要输出的文字。");
        var repeatOption = command.Option("-r|--repeat-count", "指定输出重复次数", CommandOptionType.SingleValue);
        var upperOption = command.Option("--upper", "指定是否全部大写", CommandOptionType.NoValue);
        var separatorOption = command.Option("-s|--separator", "指定重复输出用户文字时重复之间应该使用的分隔符，可以指定多个，这将依次应用到每一次分割。", CommandOptionType.MultipleValue);
        command.OnExecute(() =>
        {
            // 在这里使用上面各种 Argument 和 Option 的 Value 或 Values 属性拿值。
            return 0;
        });
    });
    return app.Execute(new []{"-?"});
}
```

#### 体验我封装的命令行参数配置

原生库配置命令行参数已经非常方便了，几乎是一行一个功能，但 `lambda` 表达式嵌套太多是一个问题，会导致代码随着参数种类的增多变得急剧膨胀；于是我针对原生库做了一个基于反射的版本。于是，实现一个命令行参数只需要写这些代码就够啦：

```csharp
[CommandMetadata("echo", Description = "Output users command at specified format.")]
public sealed class SampleTask : CommandTask
{
    private int _repeatCount;

    [CommandArgument("[words]", Description = "The words the user wants to output.")]
    public string Words { get; set; }

    [CommandOption("-r|--repeat-count", Description = "Indicates how many times to output the users words.")]
    public string RepeatCountRaw
    {
        get => _repeatCount.ToString();
        set => _repeatCount = value == null ? 1 : int.Parse(value);
    }
    
    [CommandOption("--upper", Description = "Indicates that whether all words should be in upper case.")]
    public bool UpperCase { get; set; }

    [CommandOption("-s|--separator", Description = "Specify a string to split each repeat.")]
    public List<string> Separators { get; set; }

    public override int Run()
    {
        // 当用户敲入的命令已准备好，上面的参数准备好，那么这个函数就会在这里执行啦。
        return 0;
    }
}
```

你一定会吐槽代码变多了。确实如此！但是，当命令的种类和参数的种类变得急剧膨胀的时候，这种方式可以将各种命令都隔离开来。于是，你只需要专注于实现自己的命令就好啦！

将以下这些文件放入自己的项目中即可立刻写出上面的代码（注意 `Main` 函数也是需要的，因为它启动了反射）：

*如果发现这一行的后面不是代码，那么极有可能是被不小心屏蔽了，请手动访问：[gitee.com/codes](https://gitee.com/walterlv/codes/0wjc7mlvgipr4uzn8a3qo76)。*

<script src="https://gist.github.com/walterlv/0a2257c30e8c175cae657b0058f5421c.js"></script>

### 支持的平台

支持 .Net Standard 1.3，这意味着 .Net Core 可以使用，.Net Framework 4.5.1 及以上即可使用。这意味着可以很随意地跨全平台。

---

#### 参考资料
- [Creating Neat .NET Core Command Line Apps](https://gist.github.com/iamarcel/8047384bfbe9941e52817cf14a79dc34)
