---
title: "不再为命名而苦恼！使用 MSTestEnhancer 单元测试扩展，写契约就够了"
date_published: 2018-02-22 19:52:20 +0800
date: 2018-03-05 14:39:28 +0800
categories: csharp dotnet unittest
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/introduce-mstest-enhancer.html
---

有没有觉得命名太难？有没有觉得单元测试的命名更难？没错，你不是一个人！看看这个你就知道了：[程序员最头疼的事：命名](http://blog.jobbole.com/50708/#rd?sukey=fc78a68049a14bb285ac0d81ca56806ac10192f4946a780ea3f3dd630804f86056e6fcfe6fcaeddb3dc04830b7e3b3eb) 或它的英文原文 [Don’t go into programming if you don’t have a good thesaurus - ITworld](https://www.itworld.com/article/2833265/cloud-computing/don-t-go-into-programming-if-you-don-t-have-a-good-thesaurus.html)。

立刻前往 [nuget.org](https://www.nuget.org/) 下载安装 [MSTestEnhancer](https://www.nuget.org/packages/MSTestEnhancer/) 即可解决命名的苦恼。

---

{% include post-version-selector.html %}

<div id="toc"></div>

### 体验 MSTestEnhancer

看看苦恼的单元测试怎么写：

```csharp
[TestClass]
public class 被测类名Test
{
    [TestMethod]
    public void 被测方法名_条件1_预期1()
    {
        // 测试用例代码
    }

    [TestMethod]
    public void 被测方法名_条件2_预期2()
    {
        // 测试用例代码
    }
}
```

这是以 MSTest 为例，但 NUnit、XUnit 等编写体验于此也类似，都需要为测试方法命名。在这个例子中，我们写了中文的 `条件` 和 `预期`，在实际编写时，可能是更加复杂的短句，例如：`ArgumentNull`、`ThrowsArgumentNullException`，于是最终的方法名可能是 `TargetMethod_ArgumentNull_ThrowsArgumentNullException`。这样的方法多了也就难以读懂单元测试的代码了。

然而现在看看 MSTestEnhancer 的单元测试怎么写：

```csharp
[TestClass]
public class 被测类名Test
{
    [ContractTestCase]
    public void 被测方法名()
    {
        "契约 1（当 Xxx 时，应该发生 Yyy）".Test(() =>
        {
            // 测试用例代码
        });
        
        "契约 2（但当 Zzz 时，应该发生 Www）".Test(() =>
        {
            // 测试用例代码
        });
    }
}
```

有没有觉得很直观？条件和预期直接以中文字符串的形式写在了代码里，所有契约的阅读一目了然。而且由于不需要再写条件和预期了，所以测试方法名可以与被测方法名完全一样。也就是说——再也不用为单元测试的方法取名字而伤透脑筋了。

可是，工具支持呢？不要紧，在工具中也能显示中文的契约，Visual Studio 中的测试管理器和 ReSharper 测试结果页都支持显示这些中文的契约。以下是 ReSharper 的单元测试结果页视图：

![单元测试结果页](/static/posts/2018-02-12-08-54-31.png)

每个契约按照方法名归类防止，测试结果一目了然。

### 参数化的单元测试

有些契约需要更多的值组合来验证正确性，那么可以在契约测试用例的后面添加参数。

```csharp
"质数".Test((int num) =>
{
    // 测试用例代码
}).WithArguments(2, 3, 5, 7, 11);

"{0} 不是质数".Test((int num) =>
{
    // 测试用例代码
}).WithArguments(1, 4);
```

也可以添加多个参数（最多支持 8 个）：

```csharp
"契约 1，参数中可以带 {0} 和 {1}。".Test((int a, int b) =>
{
    // 现在，a 会等于 2，b 会等于 3。
}).WithArguments(2, 3);

"契约 2".Test((int a, int b) =>
{
    // 现在有两组代码，一组 a=2, b=3；另一组 a=10, b=20。
    // 当然也可以传入元组数组。
}).WithArguments((2, 3), (10, 20));
```

在显示单元测试结果时，如果契约字符串中含有格式化占位符 `{0}`、`{1}` 等，会被自动替换为参数的值。

### 异步的单元测试

`Test` 方法中传入的每个 `Action` 都支持 `async` 关键字，并会在执行测试用例时等待异步操作结束。

### 额外的黑科技

MSTest v2 支持嵌套类型的单元测试。也就是说，我们可以利用这一点做出近乎无限层级的单元测试树出来。
