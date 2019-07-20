---
title: "使用 Roslyn 分析代码注释，给 TODO 类型的注释添加负责人、截止日期和 issue 链接跟踪"
date: 2019-07-20 21:40:14 +0800
categories: roslyn visualstudio nuget dotnet csharp
position: starter
published: false
---

如果某天改了一点代码但是没有完成，我们可能会在注释里面加上 `// TODO`。如果某个版本为了控制影响范围临时使用不太合适的方法解了 Bug，我们可能也会在注释里面加上 `// TODO`。但是，对于团队项目来说，一个人写的 `TODO` 可能过了一段时间就淹没在大量的 `TODO` 堆里面了。如果能够强制要求所有的 `TODO` 被跟踪，那么代码里面就比较容易能够控制住 `TODO` 的影响了。

本文将基于 Roslyn 开发代码分析器，要求所有的 `TODO` 注释具有可被跟踪的负责人等信息。

---

<div id="toc"></div>

## 预备知识

如果你对基于 Roslyn 编写分析器和代码修改器不了解，建议先阅读我的一篇入门教程：

- [基于 Roslyn 同时为 Visual Studio 插件和 NuGet 包开发 .NET/C# 源代码分析器 Analyzer 和修改器 CodeFixProvider - walterlv](https://blog.walterlv.com/post/develop-a-code-analyzer-for-both-nuget-and-visual-studio-extension.html)

## 分析器

我们先准备一些公共的信息：

```csharp
namespace Cvte.Core
{
    internal static class DiagnosticIds
    {
        /// <summary>
        /// 标记了待办事项的代码必须被追踪。WAL 是我名字（walterlv）的前三个字母。
        /// </summary>
        public const string TodoMustBeTracked = "WAL302";
    }
}
```

在后面的代码分析器和修改器中，我们将都使用此公共的字符串常量来作为诊断 Id。

我们先添加分析器（`TodoMustBeTrackedAnalyzer`）最基础的代码：

```csharp
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public class TodoMustBeTrackedAnalyzer : DiagnosticAnalyzer
{
    private static readonly DiagnosticDescriptor Rule = new DiagnosticDescriptor(
        DiagnosticIds.TodoMustBeTracked,
        "任务必须被追踪",
         "未完成的任务缺少负责人和完成截止日期：{0}",
        "Maintainability",
        DiagnosticSeverity.Error,
        isEnabledByDefault: true,
        description: "未完成的任务必须有对应的负责人和截止日期（// TODO @lvyi 2019-08-01），最好有任务追踪系统（如 JIRA）跟踪。");

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics => ImmutableArray.Create(Rule);

    public override void Initialize(AnalysisContext context)
        => context.RegisterSyntaxTreeAction(AnalyzeSingleLineComment);

    private void AnalyzeSingleLineComment(SyntaxTreeAnalysisContext context)
    {
        // 这里将是我们分析器的主要代码。
    }
}
```

接下来我们则是要完善语法分析的部分，我们需要找到单行注释和多行注释。

注释在语法节点中不影响代码含义，这些不影响代码含义的语法部件被称作 `Trivia`（闲杂部件）。这跟我前面入门教程部分说的语法节点不同，其 API 会少一些，但也更加简单。

我们从语法树的 `DescendantTrivia` 方法中可以拿到文档中的所有的 `Trivia` 然后过滤掉获得其中的注释部分。

比如，我们要分析下面的这个注释：

```csharp
// TODO 林德熙在这个版本写的逗比代码，下个版本要改掉。
```

```csharp
private static readonly Regex TodoRegex = new Regex(@"//\s*todo", RegexOptions.Compiled | RegexOptions.IgnoreCase);
private static readonly Regex AssigneeRegex = new Regex(@"@\w+", RegexOptions.Compiled);
private static readonly Regex DateRegex = new Regex(@"[\d]{4}\s?[年\-\.]\s?[01]?[\d]\s?[月\-\.]\s?[0123]?[\d]\s?日?", RegexOptions.Compiled);

private void AnalyzeSingleLineComment(SyntaxTreeAnalysisContext context)
{
    var root = context.Tree.GetRoot();

    foreach (var comment in root.DescendantTrivia()
        .Where(x =>
            x.IsKind(SyntaxKind.SingleLineCommentTrivia)
            || x.IsKind(SyntaxKind.MultiLineCommentTrivia)))
    {
        var value = comment.ToString();
        var todoMatch = TodoRegex.Match(value);
        if (todoMatch.Success)
        {
            var assigneeMatch = AssigneeRegex.Match(value);
            var dateMatch = DateRegex.Match(value);

            if (!assigneeMatch.Success || !dateMatch.Success)
            {
                var diagnostic = Diagnostic.Create(Rule, comment.GetLocation(), value);
                context.ReportDiagnostic(diagnostic);
            }
        }
    }
}
```

![](/static/posts/2019-07-20-22-04-53.png)


```csharp
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Text.RegularExpressions;
using Cvte.Core;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace Cvte.Analyzers.Maintainability
{
    [DiagnosticAnalyzer(LanguageNames.CSharp)]
    public class TodoMustBeTrackedAnalyzer : DiagnosticAnalyzer
    {
        private static readonly LocalizableString Title = "任务必须被追踪";
        private static readonly LocalizableString MessageFormat = "未完成的任务缺少负责人和完成截止日期：{0}";
        private static readonly LocalizableString Description = "未完成的任务必须有对应的负责人和截止日期（// TODO @lvyi 2019-08-01），最好有任务追踪系统（如 JIRA）跟踪。";
        private static readonly Regex TodoRegex = new Regex(@"//\s*todo", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex AssigneeRegex = new Regex(@"@\w+", RegexOptions.Compiled);
        private static readonly Regex DateRegex = new Regex(@"[\d]{4}\s?[年\-\.]\s?[01]?[\d]\s?[月\-\.]\s?[0123]?[\d]\s?日?", RegexOptions.Compiled);

        private static readonly DiagnosticDescriptor Rule = new DiagnosticDescriptor(
            DiagnosticIds.TodoMustBeTracked,
            Title, MessageFormat,
            Categories.Maintainability,
            DiagnosticSeverity.Error, isEnabledByDefault: true, description: Description);

        public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics => ImmutableArray.Create(Rule);

        public override void Initialize(AnalysisContext context)
        {
            context.EnableConcurrentExecution();
            context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.Analyze | GeneratedCodeAnalysisFlags.ReportDiagnostics);
            context.RegisterSyntaxTreeAction(AnalyzeSingleLineComment);
        }

        private void AnalyzeSingleLineComment(SyntaxTreeAnalysisContext context)
        {
            var root = context.Tree.GetRoot();

            foreach (var comment in root.DescendantTrivia()
                .Where(x =>
                    x.IsKind(SyntaxKind.SingleLineCommentTrivia)
                    || x.IsKind(SyntaxKind.MultiLineCommentTrivia)))
            {
                var value = comment.ToString();
                var todoMatch = TodoRegex.Match(value);
                if (todoMatch.Success)
                {
                    var assigneeMatch = AssigneeRegex.Match(value);
                    var dateMatch = DateRegex.Match(value);

                    if (!assigneeMatch.Success || !dateMatch.Success)
                    {
                        var diagnostic = Diagnostic.Create(Rule, comment.GetLocation(), value);
                        context.ReportDiagnostic(diagnostic);
                    }
                }
            }
        }
    }
}
```

## 代码修改器

![](/static/posts/2019-07-20-22-05-14.png)

```csharp
using System;
using System.Collections.Immutable;
using System.Composition;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Cvte.Core;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CodeActions;
using Microsoft.CodeAnalysis.CodeFixes;
using Microsoft.CodeAnalysis.CSharp;

namespace Cvte.Analyzers.Maintainability
{
    [ExportCodeFixProvider(LanguageNames.CSharp, Name = nameof(TodoMustBeTrackedCodeFixProvider)), Shared]
    public class TodoMustBeTrackedCodeFixProvider : CodeFixProvider
    {
        private const string Title = "添加任务负责人 / 完成日期 / JIRA Id 追踪";
        private static readonly Regex AssigneeRegex = new Regex(@"@\w+", RegexOptions.Compiled);
        private static readonly Regex DateRegex = new Regex(@"[\d]{4}\s?[年\-\.]\s?[01]?[\d]\s?[月\-\.]\s?[0123]?[\d]\s?日?", RegexOptions.Compiled);

        public sealed override ImmutableArray<string> FixableDiagnosticIds =>
            ImmutableArray.Create(DiagnosticIds.TodoMustBeTracked);

        public sealed override FixAllProvider GetFixAllProvider() => WellKnownFixAllProviders.BatchFixer;

        public sealed override Task RegisterCodeFixesAsync(CodeFixContext context)
        {
            var diagnostic = context.Diagnostics.First();
            context.RegisterCodeFix(CodeAction.Create(
                Title,
                c => FormatTrackableTodoAsync(context.Document, diagnostic, c),
                nameof(TodoMustBeTrackedCodeFixProvider)),
                diagnostic);
            return Task.CompletedTask;
        }

        private async Task<Document> FormatTrackableTodoAsync(
            Document document, Diagnostic diagnostic, CancellationToken cancellationToken)
        {
            var root = await document.GetSyntaxRootAsync(cancellationToken).ConfigureAwait(false);

            var oldTrivia = root.FindTrivia(diagnostic.Location.SourceSpan.Start);
            var oldComment = oldTrivia.ToString();
            if (oldComment.Length > 3)
            {
                oldComment = oldComment.Substring(2).Trim();
                if (oldComment.StartsWith("todo", StringComparison.CurrentCultureIgnoreCase))
                {
                    oldComment = oldComment.Substring(4).Trim();
                }
            }

            var comment = $"// TODO @吕毅(walterlv) {DateTime.Now:yyyy年M月d日} {oldComment}";
            var newTrivia = SyntaxFactory.ParseTrailingTrivia(comment);

            var newRoot = root.ReplaceTrivia(oldTrivia, newTrivia);
            return document.WithSyntaxRoot(newRoot);
        }
    }
}
```

---

**参考资料**