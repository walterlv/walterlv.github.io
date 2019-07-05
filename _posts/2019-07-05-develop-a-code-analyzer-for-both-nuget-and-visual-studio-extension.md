---
title: "基于 Roslyn 同时为 Visual Studio 插件和 NuGet 包开发 .NET/C# 源代码分析器 Analyzer"
date: 2019-07-05 22:37:09 +0800
categories: roslyn visualstudio nuget dotnet csharp
position: knowledge
published: false
---

Roslyn 是 .NET 平台下十分强大的编译器，其提供的 API 也非常丰富好用。本文将基于 Roslyn 开发一个 C# 代码分析器，你不止可以将分析器作为 Visual Studio 代码分析和重构插件发布，还可以作为 NuGet 包发布。不管哪一种，都可以让我们编写的 C# 代码分析器工作起来并真正起到代码建议和重构的作用。

---

<div id="toc"></div>

## 开发准备

### 安装 Visual Studio 扩展开发工作负载

你需要先安装 Visual Studio 的扩展开发工作负载，如果你还没有安装，那么请先阅读以下博客安装：

![Visual Studio 扩展开发](/static/posts/2019-07-05-20-23-39.png)

- [如何安装和准备 Visual Studio 扩展/插件开发环境](/post/how-to-prepare-visual-studio-extension-development-environment.html)

### 创建一个分析器项目

启动 Visual Studio，新建项目，然后在项目模板中找到 “Analyzer with Code Fix (.NET Standard)”，下一步。

![Analyzer with Code Fix 模板](/static/posts/2019-07-05-20-27-06.png)

随后，取好项目名字之后，点击“创建”，你将来到 Visual Studio 的主界面。

我为项目取的名称是 `Walterlv.Demo.Analyzers`，接下来都将以此名称作为示例。你如果使用了别的名称，建议你自己找到名称的对应关系。

### 首次调试

如果你现在按下 F5，那么将会启动一个 Visual Studio 的实验实例用于调试。

![Visual Studio 实验实例](/static/posts/2019-07-05-20-53-50.png)

由于我们是一个分析器项目，所以我们需要在第一次启动实验实例的时候新建一个专门用来测试的小型项目。

简单起见，我新建一个 .NET Core 控制台项目。新建的项目如下：

![测试用的控制台项目](/static/posts/2019-07-05-20-58-03.png)

我们目前只是基于模板创建了一个分析器，而模板中自带的分析器功能是 “只要类型名称中有任何一个字符是小写的，就给出建议将其改为全部大写”。

于是我们看到 `Program` 类名底下标了绿色的波浪线，我们将光标定位到 `Program` 类名上，可以看到出现了一个 “小灯泡” 提示。按下重构快捷键（默认是 `Ctrl + .`）后可以发现，我们的分析器项目提供的 “Make uppercase” 建议显示了出来。于是我们可以快速地将类名修改为全部大写。

![模板中自带的分析器建议](/static/posts/2019-07-05-code-fix-make-upper-case.gif)

如果体验完毕，可以关闭 Visual Studio；当然也可以在我们的分析器项目中 Shift + F5 强制结束调试。

下次调试的时候，我们不需要再次新建项目了，因为我们刚刚新建的项目还在我们新建的文件夹下。下次调试只要再打开这个项目测试就好了。

## 解读模板自带的分析器项目

### 项目和解决方案

在创建完项目之后，你会发现解决方案中有三个项目：

![Visual Studio 分析器解决方案](/static/posts/2019-07-05-20-46-27.png)

- Walterlv.Demo.Analyzers
    - 分析器主项目，我们接下来分析器的主要逻辑代码都在这个项目中
    - 这个项目在编译成功之后会生成一个 NuGet 包，安装了此包的项目将会运行我们的分析器
- Walterlv.Demo.Analyzers.Vsix
    - Visual Studio 扩展项目，我们会在这里 Visual Studio 插件相关的信息
    - 这个项目在便已成功之后会生成一个 Visual Studio 插件安装包，Visual Studio 安装了此插件后将会对所有正在编辑的项目运行我们的分析器
    - 这个项目在默认情况下是启动项目（按下 F5 会启动这个项目调试），调试时会启动一个 Visual Studio 的实验实例
- Walterlv.Demo.Analyzers.Test
    - 单元测试项目
    - 模板为我们生成了比较多的辅助代码帮助我们快速编写用于测试我们分析器可用性的单元测试，我们接下来的代码质量也靠这个来保证

在项目内部：

- WalterlvDemoAnalyzersAnalyzer.cs
    - 模板中自带的分析器的主要代码，我们接下来也主要在这个类中编写代码
    - 我们什么都还没有写的时候，里面已经包含一份示例用的，其功能是只要类型名称中有任何一个字符是小写的，就给出建议将其改为全部大写
- WalterlvDemoAnalyzersCodeFixProvider.cs
    - 这个类用于注册一个代码分析器，目前我们还只是有一个模板中自带的将类名改为全部大写的分析器，因此这个类就是帮我们注册了这个分析器
    - 如果我们还要编写其他的分析器，那么也需要在这里注册，后面我会教大家如何注册一个分析器
- Resources.resx
    - 这里包含分析器建议使用的多语言信息

![多语言资源文件](/static/posts/2019-07-05-21-33-34.png)

### 分析器代码

别看我们分析器主文件中的代码很长，但实际上关键的信息并不多。

我们现在还没有自行修改 `WalterlvDemoAnalyzersAnalyzer` 类中的任何内容，而到目前位置这个类里面包含的最关键代码我提取出来之后是下面这些。为了避免你吐槽这些代码编译不通过，我将一部分的实现替换成了 `NotImplementedException`。

```csharp
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public class WalterlvDemoAnalyzersAnalyzer : DiagnosticAnalyzer
{
    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics
        => throw new NotImplementedException();

    public override void Initialize(AnalysisContext context)
        => throw new NotImplementedException();
}
```

最关键的点：

1. `[DiagnosticAnalyzer(LanguageNames.CSharp)]`
    - 为 C# 语言提供诊断分析器
1. `override SupportedDiagnostics`
    - 返回此分析器支持的诊断规则
1. `override Initialize`
    - 在此分析器初始化的时候执行某些代码

现在我们分别细化这些关键代码。为了简化理解，我将多语言全部替换成了实际的字符串值。

重写 `SupportedDiagnostics` 的部分，创建并返回了一个 `DiagnosticDescriptor` 类型的只读集合。目前只有一个 `DiagnosticDescriptor`，名字是 `Rule`，构造它的时候传入了一大堆字符串，包括分析器 Id、标题、消息提示、类型、级别、默认开启、描述信息。

可以很容易看出，如果我们这个分析器带有多个诊断建议，那么在只读集合中返回多个 `DiagnosticDescriptor` 的实例。

```csharp
public const string DiagnosticId = "WalterlvDemoAnalyzers";

private static readonly string Title = "Type name contains lowercase letters";
private static readonly string MessageFormat = "Type name '{0}' contains lowercase letters";
private static readonly string Description = "Type names should be all uppercase.";
private const string Category = "Naming";

private static DiagnosticDescriptor Rule = new DiagnosticDescriptor(DiagnosticId, Title, MessageFormat, Category, DiagnosticSeverity.Warning, isEnabledByDefault: true, description: Description);

public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics => ImmutableArray.Create(Rule);
```

重写 `Initialize` 的部分，模板中注册了一个类名分析器，其实就是下面那个静态方法 `AnalyzeSymbol`。

```csharp
public override void Initialize(AnalysisContext context)
{
    context.RegisterSymbolAction(AnalyzeSymbol, SymbolKind.NamedType);
}

private static void AnalyzeSymbol(SymbolAnalysisContext context)
{
    // 省略实现。
    // 在模板自带的实现中，这里判断类名是否包含小写字母，如果包含则创建一个新的诊断建议以改为大写字母。
}
```

## 开发自己的分析器

作为示例，我们写一个属性转换分析器，将自动属性转换为可通知属性。

就是像以下上面的一种属性转换成下面的一种：

```csharp
public string Foo { get; set; }
```

```csharp
private string _foo;

public string Foo
{
    get => _foo;
    set => SetValue(ref _foo, value);
}
```





于是你需要先在测试项目中添加一个类 `NotificationObject`：

```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace Walterlv.TestForAnalyzer
{
    public class NotificationObject : INotifyPropertyChanged
    {
        protected bool SetValue<T>(ref T field, T value, [CallerMemberName] string propertyName = null)
        {
            if (Equals(field, value))
            {
                return false;
            }

            field = value;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
            return true;
        }

        public event PropertyChangedEventHandler PropertyChanged;
    }
}
```

---

**参考资料**

- [Writing a Roslyn analyzer - Meziantou's blog](https://www.meziantou.net/writing-a-roslyn-analyzer.htm)
