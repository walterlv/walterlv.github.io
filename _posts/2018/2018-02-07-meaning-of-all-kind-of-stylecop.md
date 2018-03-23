---
title: "（持续整理中）Visual Studio 中 C# 代码分析规则集中每一项的含义 (stylecop ruleset)"
date_published: 2018-02-07 21:55:12 +0800
date: 2018-03-23 21:56:10 +0800
categories: csharp visualstudio
---

因为我希望在要求很高的库中及时发现潜在的代码问题，所以我开启了 Visual Studio 的代码分析。

但是在修改规则的时候发现规则的名称都是在用**我懂的每一个字描述我一点都不懂的概念**，于是打算一个个尝试以找出每一个代码分析的实际意义。

在整理的过程当中，发现要么是名称看不懂，要么是错误提示看不懂。不过两个合在一起并配合代码实验之后，基本上都能够看懂了。于是，把已经整理的部分都分享出来。

---

正在整理中……

### 代码分析（Microsoft.Analyzers.ManagedCodeAnalysis）

#### 设计问题

编号|名称|含义
-|-|-
CA1004|泛型方法应提供类型参数|如果泛型方法的参数列表中没有用到声明的所有泛型，那么就会出现此提示（这是因为此时泛型不能被隐式推断，库使用者的学习成本会提高，详见：[CA1004](https://docs.microsoft.com/en-us/visualstudio/code-quality/ca1004-generic-methods-should-provide-type-parameter)）
CA1005|避免泛型类型的参数过多|如果写泛型的时候有超过 2 个泛型类型，就会出现此提示
CA1006|不要将泛型类型嵌套在成员签名中|如果出现类似 `Func<Task<T>` 这样的嵌套泛型出现在方法参数签名中，则会出现此提示
CA1018|用 AttributeUsageAttribute 标记特性|如果继承自一个已有的 `Attribute`，即便基类已经写了 `AttributeUsage`，此类型也应该再写一遍，以提高代码可读性和便于文档制作
CA1019|定义特性参数的访问器|自定义 `Attribute` 构造函数中的参数应该有一个能够访问此参数的只读属性
CA1026|不应使用默认形参|`void Method(object p = null)` 这样的方法不兼容 CLS，于是不被推荐
CA1033|接口方法应可由子类型调用|基类中显式实现了一个接口方法，导致子类中无法调用此接口方法
CA1040|避免使用空接口|意思就是“避免使用空接口”，这种接口就像是一个标记一样并没有什么作用，考虑使用自定义的 `Attribute` 来实现
CA1045|不要通过引用来传递类型|方法参数中应该尽量避免使用 `ref` 参数

#### 全球化与本地化问题

编号|名称|含义
-|-|-
CA1305|指定 IFormatProvider|如果格式化字符串（`string.Format` 或者 `$""`），应该指定区域相关的属性，，否则容易出现本地化问题
CA1307|指定 StringComparison|如果进行字符串比较或排序（`EndsWith` 等），应该指定区域相关的属性，否则容易出现本地化问题
CA1309|使用按顺序的 StringComparison|如果进行字符串比较或排序（`EndsWith` 等），若要指定非语义比较，应该指定排序规则为 StringComparison.Ordinal 或 StringComparison.OrdinalIgnoreCase

#### 命名问题

编号|名称|含义
-|-|-
CA1704|标识符应正确拼写|如果命名成一些简单无意义的字符（例如 `a` `t`），那么会出现此提示
CA1725|参数名应与基方法中声明保持一致|

#### 性能问题

编号|名称|含义
-|-|-
CA1800|避免进行不必要的强制转换|如果多次对同一个引用进行 `as`，则会出现此提示，应该仅转换一次，例如使用 `value is var xxx`
CA1801|检查未使用的参数|如果方法中有声明的参数没有使用，则会发出此警告
CA1813|避免使用未密封的特性|自定义的 `Attribute` 应该是 `sealed` 的
CA1822|将成员标记为 static|如果方法的实现中没有任何一个地方用到了 this，那么这个方法就应该标记成静态的
CA1824|用 NeutralResourcesLanguage 标记程序集|如果程序集中包含资源，那么应该用此特性标记程序集以便提升第一次查找资源时的性能；`[assembly: NeutralResourcesLanguage("zh-CHS", UltimateResourceFallbackLocation.Satellite)]` 表示如果当前系统处于简体中文环境，那么就去此程序集查找资源，否则就去附属程序集查找；如果资源一定在此程序集，则指定为 `MainAssembly`

#### 代码质量问题

这部分的代码分析来自于 [Microsoft.CodeAnalysis.FxCopAnalyzers](https://www.nuget.org/packages/Microsoft.CodeAnalysis.FxCopAnalyzers/)，安装此 NuGet 包后将获得更多的代码分析。

编号|名称|含义
-|-|-
CA2007|不应该直接 `await` 一个而不调用 `ConfigureAwait`|建议阅读 [在编写异步方法时，使用 ConfigureAwait(false) 避免使用者死锁](/post/using-configure-await-to-avoid-deadlocks.html) 了解这样提示的原因

---

#### 参考资料

- [Code Analysis for Managed Code Warnings - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/code-quality/code-analysis-for-managed-code-warnings)
- [C# Compiler Errors - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-messages/)
