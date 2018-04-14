---
title: "利用 ReSharper 自定义代码中的错误模式，在代码审查之前就发现并修改错误"
date_published: 2018-03-20 19:54:40 +0800
date: 2018-03-20 20:35:30 +0800
categories: visualstudio csharp resharper
---

多人协作开发的项目总会遇到代码编写风格上的差异。一般工具都能帮我们将常见的差异统一起来——例如 `if` 的换行；但也有一些不那么通用，但项目中却经常会出现的写法也需要统一。

例如将单元测试中的 `Assert.AreEqual(foo.GetType(), typeof(Foo));` 换成 `Assert.IsInstanceOfType(foo, typeof(Foo));`。

阅读本文将学习如何使用 ReSharper 的 Custom Pattern 功能来完成这样的警告和转换。

---

<div id="toc"></div>

### 预览效果

我们团队中自定义了一个代码风格规范，在单元测试中 `Assert.AreEqual(foo.GetType(), typeof(Foo));` 应该被换成 `Assert.IsInstanceOfType(foo, typeof(Foo));`。于是，ReSharper 会给出警告，并给出推荐的写法；如果遵循 ReSharper 的建议，ReSharper 将自动为我们修改代码。

![给出警告，并提供建议](/static/posts/2018-03-20-18-51-20.png)  
▲ 给出警告，并提供建议

![可以遵循建议](/static/posts/2018-03-20-19-38-40.png)  
▲ 可以遵循建议

![然后代码就被修改成我们建议的写法了](/static/posts/2018-03-20-18-53-27.png)  
▲ 然后代码就被修改成我们建议的写法了

### 开始编写自定义模式

我们需要打开 ReSharper 的选项窗口，然后在里面找到“自定义模式”：

![Options](/static/posts/2018-03-20-19-00-36.png)

![Custom Patterns](/static/posts/2018-03-20-19-01-32.png)

点击“Add Pattern”之后，我们就可以开始编写 Custom Pattern 了。

![Add Highlighting Pattern](/static/posts/2018-03-20-19-08-23.png)

为了快速开始，可以将下面的两行代码分别复制到两个黑框中。（如果你只看到了一个黑框，请在右上角将“Find”按钮切换到“Replace”按钮。）

```csharp
// 将下面这一句话复制到第一个黑色框中。
Assert.AreEqual($instance$.GetType(), typeof($type$));
// 将下面这一句话复制到第二个黑色框中。
Assert.IsInstanceOfType($instance$, typeof($type$));
```

这时，占位符框中就会出现我们编写的两个占位符：

![占位符列表](/static/posts/2018-03-20-19-12-50.png)  
▲ 占位符列表

我们需要将 `instance` 占位符从表达式修改为标识符：

![标识符](/static/posts/2018-03-20-19-13-30.png)

> 解释一下这几项的意思：
> 1. **Argument Placeholder** 参数占位符
>     - 意味着这里是参数列表，可以是一个或多个参数，中间用逗号分隔。参数数量可以额外指定。
> 1. **Expression Placeholder** 表达式占位符
>     - 形如 `foo.Bar()`，注意，分号并不是表达式的一部分。
> 1. **Identifier Placeholder** 标识符占位符
> 1. **Statement Placeholder** 语句占位符
>     - 形如 `if (foo is null) throw new ArgumentNullException(nameof(foo));`，注意，分号属于语句的一部分。
> 1. **Type Placeholder** 类型占位符
>     - 形如 `Foo`，或者 `Walterlv.Demo.Foo`。

确定之后我们填写其他的信息：

- Pattern severity：警告
    - *如果你需要，修改成“错误”也是可以的；事实上我们的项目中就是标记为错误，这样找出的代码就会是红色的错误下划线了。*
- Suppression key：`AssertEqualToInstanceOfType`
    - （可选）只有指定了用于阻止检查的标识字符串，才可以在特殊情况下用以下几种方法阻止检查；否则你将对错误无能为力。
        - `// ReSharper disable once AssertEqualToInstanceOfType`
        - `[SuppressMessage("ReSharper", "AssertEqualToInstanceOfType")]`
- 上面的 Description：`建议简化成 InstanceOfType 以提升可读性。`
    - 这将在鼠标滑到找到的语句上面时给出提示。  
    ![提示](/static/posts/2018-03-20-18-51-20.png)
- 下面的 Description：`简化成 InstanceOfType`
    - 这将在在 Alt+Enter 时出现的重构列表中显示  
    ![可以遵循建议](/static/posts/2018-03-20-19-38-40.png)

设置完之后，“Edit Highlighting Pattern”窗口应该是这样的：

![设置完的 Edit Highlighting Pattern 窗口](/static/posts/2018-03-20-19-29-35.png)

当然，在“Custom Pattern”列表中也可以统一设置所有模式的警告级别。

![Warning](/static/posts/2018-03-20-19-26-14.png)

最后，**把这些规则保存到团队共享中，那么所有安装了 ReSharper 的此项目的团队成员都将遵循这一套规则**。

![保存到团队](/static/posts/2018-03-20-20-05-57.png)

### 自己动手，发掘潜能

Custom Pattern 功能只是为了给我们一个格式转换吗？才不止是这样哦！它能够帮助我们发现一些潜在的错误。

例如使用 [MSTestEnhancer](https://github.com/dotnet-campus/MSTestEnhancer/) 进行单元测试时，如果使用了它推荐的单元测试风格，就应该配套使用 `ContractTestCase` 特性，如果不这么写，必定意味着错误。

于是，我们可以编写一个自定义模式来发现和修改这样的错误。

![更复杂的例子](/static/posts/2018-03-20-19-51-18.png)

你认为可以怎么写呢？我在下面给出了我的写法。你还可以发掘出更多的潜能吗？非常期待！

![配置 MSTestEnhancer 的检查](/static/posts/2018-03-20-19-53-43.png)
