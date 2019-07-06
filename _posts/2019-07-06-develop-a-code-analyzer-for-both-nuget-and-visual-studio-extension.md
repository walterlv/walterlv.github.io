---
title: "基于 Roslyn 同时为 Visual Studio 插件和 NuGet 包开发 .NET/C# 源代码分析器 Analyzer 和修改器 CodeFixProvider"
date: 2019-07-06 09:20:23 +0800
categories: roslyn visualstudio nuget dotnet csharp
position: knowledge
---

Roslyn 是 .NET 平台下十分强大的编译器，其提供的 API 也非常丰富好用。本文将基于 Roslyn 开发一个 C# 代码分析器，你不止可以将分析器作为 Visual Studio 代码分析和重构插件发布，还可以作为 NuGet 包发布。不管哪一种，都可以让我们编写的 C# 代码分析器工作起来并真正起到代码建议和重构的作用。

---

本文将教大家如何从零开始开发一个基于 Roslyn 的 C# 源代码分析器 Analyzer 和修改器 CodeFixProvider。可以作为 Visual Studio 插件安装和使用，也可以作为 NuGet 包安装到项目中使用（无需安装插件）。无论哪一种，你都可以在支持 Roslyn 分析器扩展的 IDE（如 Visual Studio）中获得如下面动图所展示的效果。

![本文教大家可以做到的效果](/static/posts/2019-07-06-preview-of-roslyn-code-fix.gif)

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

在创建完项目之后，你可选可以更新一下项目的 .NET Standard 版本（默认是 1.3，建议更新为 2.0）以及几个 NuGet 包。

### 首次调试

如果你现在按下 F5，那么将会启动一个 Visual Studio 的实验实例用于调试。

![Visual Studio 实验实例](/static/posts/2019-07-05-20-53-50.png)

由于我们是一个分析器项目，所以我们需要在第一次启动实验实例的时候新建一个专门用来测试的小型项目。

简单起见，我新建一个 .NET Core 控制台项目。新建的项目如下：

![测试用的控制台项目](/static/posts/2019-07-05-20-58-03.png)

我们目前只是基于模板创建了一个分析器，而模板中自带的分析器功能是 “只要类型名称中有任何一个字符是小写的，就给出建议将其改为全部大写”。

于是我们看到 `Program` 类名底下标了绿色的波浪线，我们将光标定位到 `Program` 类名上，可以看到出现了一个 “小灯泡” 提示。按下重构快捷键（默认是 `Ctrl + .`）后可以发现，我们的分析器项目提供的 “Make uppercase” 建议显示了出来。于是我们可以快速地将类名修改为全部大写。

![模板中自带的分析器建议](/static/posts/2019-07-05-code-fix-make-upper-case.gif)

因为我们在前面安装了 Visual Studio 扩展开发的工作负载，所以可以在 “视图”->“其他窗口” 中找到并打开 Syntax Visualizer 窗格。现在，请将它打开，因为接下来我们的代码分析会用得到这个窗格。

![打开语法可视化窗格](/static/posts/2019-07-05-22-42-05.png)

如果体验完毕，可以关闭 Visual Studio；当然也可以在我们的分析器项目中 Shift + F5 强制结束调试。

下次调试的时候，我们不需要再次新建项目了，因为我们刚刚新建的项目还在我们新建的文件夹下。下次调试只要像下面那样再次打开这个项目测试就好了。

![打开历史记录中的项目](/static/posts/2019-07-05-23-29-33.png)

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
    - 模板中自带的分析器（Analyzer）的主要代码
    - 我们什么都还没有写的时候，里面已经包含一份示例用的分析器，其功能是找到包含小写的类名。
- WalterlvDemoAnalyzersCodeFixProvider.cs
    - 模板中自带的代码修改器（CodeFixProvider）的主要代码
    - 我们什么都还没有写的时候，里面已经包含一份示例用的代码修改器，根据前面分析器中找到的诊断信息，给出修改建议，即只要类型名称中有任何一个字符是小写的，就给出建议将其改为全部大写
- Resources.resx
    - 这里包含分析器建议使用的多语言信息

![多语言资源文件](/static/posts/2019-07-05-21-33-34.png)

### 分析器代码（Analyzer）

别看我们分析器文件中的代码很长，但实际上关键的信息并不多。

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

private static readonly LocalizableString Title = "Type name contains lowercase letters";
private static readonly LocalizableString MessageFormat = "Type name '{0}' contains lowercase letters";
private static readonly LocalizableString Description = "Type names should be all uppercase.";
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

### 代码修改器（CodeFixProvider）

代码修改器文件中的代码更长，但关键信息也没有增加多少。

我们现在也没有自行修改 `WalterlvDemoAnalyzersCodeFixProvider` 类中的任何内容，而到目前位置这个类里面包含的最关键代码我提取出来之后是下面这些。为了避免你吐槽这些代码编译不通过，我将一部分的实现替换成了 `NotImplementedException`。

```csharp
[ExportCodeFixProvider(LanguageNames.CSharp, Name = nameof(WalterlvDemoAnalyzersCodeFixProvider)), Shared]
public class WalterlvDemoAnalyzersCodeFixProvider : CodeFixProvider
{
    public sealed override ImmutableArray<string> FixableDiagnosticIds
        => throw new NotImplementedException();

    public sealed override FixAllProvider GetFixAllProvider()
        => WellKnownFixAllProviders.BatchFixer;

    public sealed override async Task RegisterCodeFixesAsync(CodeFixContext context)
        => throw new NotImplementedException();
}
```

最关键的点：

1. `[ExportCodeFixProvider(LanguageNames.CSharp, Name = nameof(WalterlvDemoAnalyzersCodeFixProvider)), Shared]`
    - 为 C# 语言提供代码修改器
1. `override FixableDiagnosticIds`
    - 注意到前面 `WalterlvDemoAnalyzersAnalyzer` 类型中有一个公共字段 `DiagnosticId` 吗？在这里返回，可以为那里分析器找到的代码提供修改建议
1. `override GetFixAllProvider`
    - 在最简单的示例中，我们将仅仅返回 `BatchFixer`，其他种类的 `FixAllProvider` 我将通过其他博客进行说明
1. `override RegisterCodeFixesAsync`
    - 在 `FixableDiagnosticIds` 属性中我们返回的那些诊断建议这个方法中可以拿到，于是为每一个返回的诊断建议注册一个代码修改器（CodeFix）

在这个模板提供的例子中，`FixableDiagnosticIds` 返回了 `WalterlvDemoAnalyzersAnalyzer` 类中的公共字段 `DiagnosticId`：

```csharp
public sealed override ImmutableArray<string> FixableDiagnosticIds =>
    ImmutableArray.Create(WalterlvDemoAnalyzersAnalyzer.DiagnosticId);
```

`RegisterCodeFixesAsync` 中找到我们在 `WalterlvDemoAnalyzersAnalyzer` 类中找到的一个 `Diagnostic`，然后对这个 `Diagnostic` 注册一个代码修改（CodeFix）。

```csharp
public sealed override async Task RegisterCodeFixesAsync(CodeFixContext context)
{
    var root = await context.Document.GetSyntaxRootAsync(context.CancellationToken).ConfigureAwait(false);

    // TODO: Replace the following code with your own analysis, generating a CodeAction for each fix to suggest
    var diagnostic = context.Diagnostics.First();
    var diagnosticSpan = diagnostic.Location.SourceSpan;

    // Find the type declaration identified by the diagnostic.
    var declaration = root.FindToken(diagnosticSpan.Start).Parent.AncestorsAndSelf().OfType<TypeDeclarationSyntax>().First();

    // Register a code action that will invoke the fix.
    context.RegisterCodeFix(
        CodeAction.Create(
            title: title,
            createChangedSolution: c => MakeUppercaseAsync(context.Document, declaration, c),
            equivalenceKey: title),
        diagnostic);
}

private async Task<Solution> MakeUppercaseAsync(Document document, TypeDeclarationSyntax typeDecl, CancellationToken cancellationToken)
{
    // 省略实现。
    // 将类名改为全大写，然后返回解决方案。
}
```

## 开发自己的分析器（Analyzer）

### 一个简单的目标

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

这里我们写了一个 `SetValue` 方法，有没有这个 `SetValue` 方法存在对我们后面写的分析器其实没有任何影响。不过你如果强迫症，可以看本文最后的“一些补充”章节，把 `SetValue` 方法加进来。

### 开始添加最基础的代码

于是，我们将 `Initialize` 方法中的内容改成我们期望的分析自动属性的语法节点分析。

```csharp
public override void Initialize(AnalysisContext context)
    => context.RegisterSyntaxNodeAction(AnalyzeAutoProperty, SyntaxKind.PropertyDeclaration);

private void AnalyzeAutoProperty(SyntaxNodeAnalysisContext context)
{
    // 你可以在这一行打上一个断点，这样你可以观察 `context` 参数。
}
```

上面的 `AnalyzeAutoProperty` 只是我们随便取的名字，而 `SyntaxKind.PropertyDeclaration` 是靠智能感知提示帮我找到的。

现在我们来试着分析一个自动属性。

按下 F5 调试，在新的调试的 Visual Studio 实验实例中，我们将鼠标光标放在 `public string Foo { get; set; }` 行上。如果我们提前在 `AnalyzeAutoProperty` 方法中打了断点，那么我们可以在此时观察到 `context` 参数。

![context 参数](/static/posts/2019-07-05-23-31-47.png)

- `CancellationToken` 指示当前是否已取消分析
- `Node` 语法节点
- `SemanticModel`
- `ContainingSymbol` 语义分析节点
- `Compilation`
- `Options`

其中，`Node.KindText` 属性的值为 `PropertyDeclaration`。还记得前面让你先提前打开 Syntax Visualizer 窗格吗？是的，我们可以在这个窗格中找到 `PropertyDeclaration` 节点。

我们可以借助这个语法可视化窗格，找到 `PropertyDeclaration` 的子节点。当我们一级一级分析其子节点的语法的时候，便可以取得这个语法节点的全部所需信息（可见性、属性类型、属性名称），也就是具备生成可通知属性的全部信息了。

![在语法可视化窗格中分析属性](/static/posts/2019-07-05-23-42-01.png)

### 添加分析自动属性的代码

由于我们在前面 `Initialize` 方法中注册了仅在属性声明语法节点的时候才会执行 `AnalyzeAutoProperty` 方法，所以我们在这里可以简单的开始报告一个代码分析 `Diagnostic`：

```csharp
var propertyNode = (PropertyDeclarationSyntax)context.Node;
var diagnostic = Diagnostic.Create(_rule, propertyNode.GetLocation());
context.ReportDiagnostic(diagnostic);
```

现在，`WalterlvDemoAnalyzersAnalyzer` 类的完整代码如下：

```csharp
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public class WalterlvDemoAnalyzersAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "WalterlvDemoAnalyzers";

    private static readonly LocalizableString _title = "自动属性";
    private static readonly LocalizableString _messageFormat = "这是一个自动属性";
    private static readonly LocalizableString _description = "可以转换为可通知属性。";
    private const string _category = "Usage";

    private static readonly DiagnosticDescriptor _rule = new DiagnosticDescriptor(
        DiagnosticId, _title, _messageFormat, _category, DiagnosticSeverity.Info,
        isEnabledByDefault: true, description: _description);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics => ImmutableArray.Create(_rule);

    public override void Initialize(AnalysisContext context) =>
        context.RegisterSyntaxNodeAction(AnalyzeAutoProperty, SyntaxKind.PropertyDeclaration);

    private void AnalyzeAutoProperty(SyntaxNodeAnalysisContext context)
    {
        var propertyNode = (PropertyDeclarationSyntax)context.Node;
        var diagnostic = Diagnostic.Create(_rule, propertyNode.GetLocation());
        context.ReportDiagnostic(diagnostic);
    }
}
```

可以发现代码并不多，现在运行，可以在光标落在属性声明的行时看到修改建议。如下图所示：

![在属性上有修改建议](/static/posts/2019-07-06-00-33-03.png)

你可能会觉得有些不满，看起来似乎只有我们写的那些标题和描述在工作。但实际上你还应该注意到这些：

1. `DiagnosticId`、`_messageFormat`、`_description` 已经工作起来了；
1. 只有光标在属性声明的语句块时，这个提示才会出现，因此说明我们的已经找到了正确的代码块了；
1. 不要忘了我们还有个 `CodeFixProvider` 没有写呢，你现在看到的依然还在修改大小写的部分代码是那个类（`WalterlvDemoAnalyzersCodeFixProvider`）里的。

## 开发自己的代码修改器（CodeFixProvider）

现在，我们开始进行代码修改，将 `WalterlvDemoAnalyzersCodeFixProvider` 类改成我们希望的将属性修改为可通知属性的代码。

```csharp
[ExportCodeFixProvider(LanguageNames.CSharp, Name = nameof(WalterlvDemoAnalyzersCodeFixProvider)), Shared]
public class WalterlvDemoAnalyzersCodeFixProvider : CodeFixProvider
{
    private const string _title = "转换为可通知属性";

    public sealed override ImmutableArray<string> FixableDiagnosticIds =>
        ImmutableArray.Create(WalterlvDemoAnalyzersAnalyzer.DiagnosticId);

    public sealed override FixAllProvider GetFixAllProvider() => WellKnownFixAllProviders.BatchFixer;

    public sealed override async Task RegisterCodeFixesAsync(CodeFixContext context)
    {
        var root = await context.Document.GetSyntaxRootAsync(context.CancellationToken).ConfigureAwait(false);
        var diagnostic = context.Diagnostics.First();
        var declaration = (PropertyDeclarationSyntax)root.FindNode(diagnostic.Location.SourceSpan);

        context.RegisterCodeFix(
            CodeAction.Create(
                title: _title,
                createChangedSolution: ct => ConvertToNotificationProperty(context.Document, declaration, ct),
                equivalenceKey: _title),
            diagnostic);
    }

    private async Task<Solution> ConvertToNotificationProperty(Document document,
        PropertyDeclarationSyntax propertyDeclarationSyntax, CancellationToken cancellationToken)
    {
        // 获取文档根语法节点。
        var root = await document.GetSyntaxRootAsync(cancellationToken).ConfigureAwait(false);

        // 生成可通知属性的语法节点集合。
        var type = propertyDeclarationSyntax.Type;
        var propertyName = propertyDeclarationSyntax.Identifier.ValueText;
        var fieldName = $"_{char.ToLower(propertyName[0])}{propertyName.Substring(1)}";
        var newNodes = CreateNotificationProperty(type, propertyName, fieldName);

        // 将可通知属性的语法节点插入到原文档中形成一份中间文档。
        var intermediateRoot = root
            .InsertNodesAfter(
                root.FindNode(propertyDeclarationSyntax.Span),
                newNodes);

        // 将中间文档中的自动属性移除形成一份最终文档。
        var newRoot = intermediateRoot
            .RemoveNode(intermediateRoot.FindNode(propertyDeclarationSyntax.Span), SyntaxRemoveOptions.KeepNoTrivia);

        // 将原来解决方案中的此份文档换成新文档以形成新的解决方案。
        return document.Project.Solution.WithDocumentSyntaxRoot(document.Id, newRoot);
    }

    private async Task<Solution> ConvertToNotificationProperty(Document document,
        PropertyDeclarationSyntax propertyDeclarationSyntax, CancellationToken cancellationToken)
    {
        // 这个类型暂时留空，因为这是真正的使用 Roslyn 生成语法节点的代码，虽然只会写一句话，但相当长。
    }
}
```

还记得我们在前面解读 `WalterlvDemoAnalyzersCodeFixProvider` 类型时的那些描述吗？我们现在为一个诊断 `Diagnostic` 注册了一个代码修改（CodeFix），并且其回调函数是 `ConvertToNotificationProperty`。这是我们自己编写的一个方法。

我在这个方法里面写的代码并不复杂，是获取原来的属性里的类型信息和属性名，然后修改文档，将新的文档返回。

其中，我留了一个 `ConvertToNotificationProperty` 方法为空，因为这是真正的使用 Roslyn 生成语法节点的代码，虽然只会写一句话，但相当长。

于是我将这个方法单独写在了下面。将这两个部分拼起来（用下面方法替换上面同名的方法），你就能得到一个完整的 `WalterlvDemoAnalyzersCodeFixProvider` 类的代码了。

```csharp
private SyntaxNode[] CreateNotificationProperty(TypeSyntax type, string propertyName, string fieldName)
    => new SyntaxNode[]
    {
        SyntaxFactory.FieldDeclaration(
            new SyntaxList<AttributeListSyntax>(),
            new SyntaxTokenList(SyntaxFactory.Token(SyntaxKind.PrivateKeyword)),
            SyntaxFactory.VariableDeclaration(
                type,
                SyntaxFactory.SeparatedList(new []
                {
                    SyntaxFactory.VariableDeclarator(
                        SyntaxFactory.Identifier(fieldName)
                    )
                })
            ),
            SyntaxFactory.Token(SyntaxKind.SemicolonToken)
        ),
        SyntaxFactory.PropertyDeclaration(
            type,
            SyntaxFactory.Identifier(propertyName)
        )
        .AddModifiers(SyntaxFactory.Token(SyntaxKind.PublicKeyword))
        .AddAccessorListAccessors(
            SyntaxFactory.AccessorDeclaration(
                SyntaxKind.GetAccessorDeclaration
            )
            .WithExpressionBody(
                SyntaxFactory.ArrowExpressionClause(
                    SyntaxFactory.Token(SyntaxKind.EqualsGreaterThanToken),
                    SyntaxFactory.IdentifierName(fieldName)
                )
            )
            .WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken)),
            SyntaxFactory.AccessorDeclaration(
                SyntaxKind.SetAccessorDeclaration
            )
            .WithExpressionBody(
                SyntaxFactory.ArrowExpressionClause(
                    SyntaxFactory.Token(SyntaxKind.EqualsGreaterThanToken),
                    SyntaxFactory.InvocationExpression(
                        SyntaxFactory.IdentifierName("SetValue"),
                        SyntaxFactory.ArgumentList(
                            SyntaxFactory.Token(SyntaxKind.OpenParenToken),
                            SyntaxFactory.SeparatedList(new []
                            {
                                SyntaxFactory.Argument(
                                    SyntaxFactory.IdentifierName(fieldName)
                                )
                                .WithRefKindKeyword(
                                    SyntaxFactory.Token(SyntaxKind.RefKeyword)
                                ),
                                SyntaxFactory.Argument(
                                    SyntaxFactory.IdentifierName("value")
                                ),
                            }),
                            SyntaxFactory.Token(SyntaxKind.CloseParenToken)
                        )
                    )
                )
            )
            .WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken))
        ),
    };
```

实际上本文并不会重点介绍如何使用 Roslyn 生成新的语法节点，因此我不会解释上面我是如何写出这样的语法节点来的，但如果你对照着语法可视化窗格（Syntax Visualizer）来看的话，也是不难理解为什么我会这么写的。

在此类型完善之后，我们再 F5 启动调试，可以发现我们已经可以完成一个自动属性的修改了，可以按照预期改成一个可通知属性。

你可以再看看下面的动图：

![可以修改属性](/static/posts/2019-07-06-preview-of-roslyn-code-fix.gif)

### 发布

### 发布成 NuGet 包

前往我们分析器主项目 Walterlv.Demo.Analyzers 项目的输出目录，因为本文没有改输出路径，所以在项目的 `bin\Debug` 文件夹下。我们可以找到每次编译产生的 NuGet 包。

![已经打出来的 NuGet 包](/static/posts/2019-07-06-09-08-43.png)

如果你不知道如何将此 NuGet 包发布到 [nuget.org](https://www.nuget.org/)，请在文本中回复，也许我需要再写一篇博客讲解如何推送。

### 发布到 Visual Studio 插件商店

前往我们分析器的 Visual Studio 插件项目 Walterlv.Demo.Analyzers.Vsix 项目的输出目录，因为本文没有改输出路径，所以在项目的 `bin\Debug` 文件夹下。我们可以找到每次编译产生的 Visual Studio 插件安装包。

![已经打出来的 Visual Studio 插件](/static/posts/2019-07-06-09-10-26.png)

如果你不知道如何将此 Visual Studio 插件发布到 [Visual Studio Marketplace](https://marketplace.visualstudio.com/)，请在文本中回复，也许我需要再写一篇博客讲解如何推送。

## 一些补充

### 辅助源代码

前面我们提到了 `SetValue` 这个方法，这是为了写一个可通知对象。为了拥有这个方法，请在我们的测试项目中添加下面这两个文件：

一个可通知类文件 NotificationObject.cs：

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

一个用于分析器测试的类 Demo.cs：

```csharp
namespace Walterlv.TestForAnalyzer
{
    class Demo : NotificationObject
    {
        public string Foo { get; set; }
    }
}
```

### 示例代码仓库

代码仓库在我的 Demo 项目中，注意协议是 [996.ICU](https://github.com/996icu/996.ICU/blob/master/LICENSE) 哟！

- [walterlv.demo/Walterlv.Demo.Analyzers at master · walterlv/walterlv.demo](https://github.com/walterlv/walterlv.demo/tree/master/Walterlv.Demo.Analyzers)

### 别忘了单元测试

别忘了我们一开始创建仓库的时候有一个单元测试项目，而我们全文都没有讨论如何充分利用其中的单元测试。我将在其他的博客中说明如何编写和使用分析器项目的单元测试。

---

**参考资料**

- [Writing a Roslyn analyzer - Meziantou's blog](https://www.meziantou.net/writing-a-roslyn-analyzer.htm)
- [Code Generation with Roslyn – Fields and Properties - Dogs Chasing Squirrels](https://dogschasingsquirrels.com/2014/08/04/code-generation-with-roslyn-fields-and-properties/)
