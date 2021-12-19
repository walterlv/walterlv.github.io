---
title: "真的要比较 for 和 foreach 的性能吗？（内附性能比较的实测数据）"
date: 2017-12-07 23:30:35 +0800
tags: csharp dotnet
coverImage: /static/posts/2017-12-07-21-38-53.png
permalink: /post/for-vs-foreach.html
---

小伙伴告诉我，`List<T>.Find` 方法比 `List.FirstOrDefault` 扩展方法性能更高，详见：[C＃ Find vs FirstOrDefault - 林德熙](https://blog.lindexi.com/post/C-Find-vs-FirstOrDefault.html)。这可让我震惊了，因为我从来都没有考虑过在如此微观尺度衡量它们的性能差异。

---

<p id="toc"></p>

## 少不了的源码

于是，我立刻翻开了 `Find` 和 `FirstOrDefault` 的源代码：

```csharp
public T Find(Predicate<T> match) {
    if( match == null) {
        ThrowHelper.ThrowArgumentNullException(ExceptionArgument.match);
    }
    Contract.EndContractBlock();

    for(int i = 0 ; i < _size; i++) {
        if(match(_items[i])) {
            return _items[i];
        }
    }
    return default(T);
}
```

```csharp
public static TSource FirstOrDefault<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate) {
    if (source == null) throw Error.ArgumentNull("source");
    if (predicate == null) throw Error.ArgumentNull("predicate");
    foreach (TSource element in source) {
        if (predicate(element)) return element;
    }
    return default(TSource);
}
```

这难道不是在 PK for 和 foreach 吗？接下来的分析才发现，没这么简单。

## Find V.S. FirstOrDefault

我写了两段代码，然后在单元测试中测量它们的性能。方法我按不同顺序写了两遍，试图降低初始化影响和偶然事件的影响。

```csharp
[TestClass]
public class FindAndFirstOrDefaultTest
{
    public FindAndFirstOrDefaultTest()
    {
        _testTarget = new List<int>(count);
        for (var i = 0; i < count; i++)
        {
            _testTarget.Add(i);
        }
    }

    private const int count = 100;
    private readonly List<int> _testTarget;

    [TestMethod]
    public void _A0_Find()
    {
        _testTarget.Find(x => x > count - 1);
    }

    [TestMethod]
    public void _A1_FirstOrDefault()
    {
        _testTarget.FirstOrDefault(x => x > count - 1);
    }

    [TestMethod]
    public void _B0_FirstOrDefault2()
    {
        _testTarget.FirstOrDefault(x => x > count - 1);
    }

    [TestMethod]
    public void _B1_Find2()
    {
        _testTarget.Find(x => x > count - 1);
    }
}   
```

100 长度的 `List<int>`，其性能数据如下：

![100 长度的 List](/static/posts/2017-12-07-21-38-53.png)

很明显，数据量太少不好测量，也收到单元测试本身的影响。我们需要增大数据量，以减少那些因素的影响。

![10000000 长度的 List](/static/posts/2017-12-07-21-38-07.png)

居然真的存在性能差异！！！而且，`Find` 是 `FirstOrDefault` 性能的两倍！！！

这似乎能够解释，因为 `foreach` 毕竟还要生成 `IEnumerator` 对象，还要有方法调用；而 `for` 却只有 `List<T>` 集合的访问。然而，这真的只是 `for` 和 `foreach` 之间的性能差异吗？

## for V.S. foreach

为了看看其性能差异来自于 `for` 和 `foreach`，我把 `Find` 和 `FirstOrDefault` 的调用修改为 `for` 和 `foreach`：

```csharp
[TestClass]
public class ForAndForeachTest
{
    public ForAndForeachTest()
    {
        _testTarget = new List<int>(count);
        for (var i = 0; i < count; i++)
            _testTarget.Add(i);
    }

    private const int count = 100;
    private readonly List<int> _testTarget;

    [TestMethod]
    public void _A0_Find()
    {
        for (var i = 0; i < count; i++)
        {
            var target = _testTarget[i];
            if (target > count - 1) return;
        }
    }

    [TestMethod]
    public void _A1_FirstOrDefault()
    {
        foreach (var target in _testTarget)
        {
            if (target > count - 1) return;
        }
    }

    [TestMethod]
    public void _B0_FirstOrDefault2()
    {
        for (var i = 0; i < count; i++)
        {
            var target = _testTarget[i];
            if (target > count - 1) return;
        }
    }

    [TestMethod]
    public void _B1_Find2()
    {
        foreach (var target in _testTarget)
        {
            if (target > count - 1) return;
        }
    }
}
```

一样，100 长度的 `List<int>` 并没有参考性：

![100 长度的 List](/static/posts/2017-12-07-21-29-20.png)

50000000 长度的则可以减少影响：

![50000000 长度的 List](/static/posts/2017-12-07-21-35-30.png)

然而结论居然是——`for` 比 `foreach` 有“**轻微**”的性能优势！这与 `Find` 和 `FirstOrDefault` 两倍的性能差异就小多了。是什么原因造成了如此的性能差异呢？

## 轻微的性能优势，还是两倍的性能优势？

为了了解原因，我将 `Find` 和 `FirstOrDefault` 中的方法写到测试里面：

```csharp
private int For(Predicate<int> match)
{
    for (var i = 0; i < count; i++)
    {
        if (match(_testTarget[i])) return _testTarget[i];
    }
    return default(int);
}

private int ForEach(Func<int, bool> predicate)
{
    foreach (var element in _testTarget)
    {
        if (predicate(element)) return element;
    }
    return default(int);
}
```

为了能够不让数据超过 1 秒导致单元测试计时精度降低，我将长度减小到了 40000000。

![40000000 长度的 List](/static/posts/2017-12-07-22-02-31.png)  
▲ 调用 For 和 Foreach

性能相比于直接写 `for` 和 `foreach` 有轻微的损失，但是调用 `For` 和调用 `Foreach` 却并没有两倍的性能差异，虽然方法的实现与 `Find` 和 `FirstOrDefault` 几乎一模一样！

而且，相同数量的 `List<int>`，调用 `Find` 居然比自己写的 `For` 更快，调用 `FirstOrDefault` 却比自己写的 `Foreach` 更慢：

![40000000 长度的 List](/static/posts/2017-12-07-22-12-12.png)  
▲ 调用 Find 和 FirstOrDefault

我写的 `For` 和 `Find` 中一定还存在着哪里不一样——对，是索引器！

以下是 `List<T>` 索引器的源码：

```csharp
public T this[int index] {
    get {
        // Following trick can reduce the range check by one
        if ((uint) index >= (uint)_size) {
            ThrowHelper.ThrowArgumentOutOfRangeException();
        }
        Contract.EndContractBlock();
        return _items[index]; 
    }

    set {
        if ((uint) index >= (uint)_size) {
            ThrowHelper.ThrowArgumentOutOfRangeException();
        }
        Contract.EndContractBlock();
        _items[index] = value;
        _version++;
    }
}
```

我的 `For` 内部索引访问相比于 `Find` 内部索引访问多了数组越界判断，同时还可能存在 JIT 的特别优化。如果要验证这个问题，我就需要比较数组了。

## List V.S. Array

改写我们的测试代码，这回的 `For` 方法有两个重载，一个列表一个数组。

```csharp
private int For(List<int> list, Predicate<int> match)
{
    for (var i = 0; i < count; i++)
    {
        if (match(list[i])) return list[i];
    }
    return default(int);
}

private int For(int[] array, Predicate<int> match)
{
    for (var i = 0; i < count; i++)
    {
        if (match(array[i])) return array[i];
    }
    return default(int);
}
```

```csharp
[TestMethod]
public void _A0_List()
{
    For(_testTarget, x => x > count - 1);
}

[TestMethod]
public void _A1_Array()
{
    For(_testArray, x => x > count - 1);
}

[TestMethod]
public void _B0_Array()
{
    For(_testArray, x => x > count - 1);
}

[TestMethod]
public void _B1_List()
{
    For(_testTarget, x => x > count - 1);
}
```

同样的数据量：

![列表和数组](/static/posts/2017-12-07-23-01-55.png)

可以发现，即便是数组，其性能也赶不上原生的 `Find`。

## 只有现象，却没有结论

---

**参考资料**

- [C＃ Find vs FirstOrDefault - 林德熙](https://blog.lindexi.com/post/C-Find-vs-FirstOrDefault.html)
- [c# - In .NET, which loop runs faster, 'for' or 'foreach'? - Stack Overflow](https://stackoverflow.com/questions/365615/in-net-which-loop-runs-faster-for-or-foreach)
- [An easy and efficient way to improve .NET code performances - Patrick Smacchia](http://codebetter.com/patricksmacchia/2008/11/19/an-easy-and-efficient-way-to-improve-net-code-performances/)
- [C# For Versus Foreach Performance - Dot Net Perls](https://www.dotnetperls.com/for-foreach)


