---
title: ".NET 中创建支持集合初始化器的类型"
publishDate: 2018-10-08 16:34:13 +0800
date: 2018-12-14 09:54:00 +0800
categories: dotnet
---

对象初始化器和集合初始化器只是语法糖，但是能让你的代码看起来更加清晰。至少能让对象初始化的代码和其他业务执行的代码分开，可读性会好一些。

本文将编写一个类型，可以使用集合初始化器构造这个类型。不只是添加元素的集合初始化器，还有带索引的集合初始化器。

---

<div id="toc"></div>

### 稍微提一下对象初始化器

很普通的类型就可以支持对象初始化器，只需要对象有可以 `set` 的属性或者可访问的字段即可。

```csharp
public class Walterlv
{
    public string Site { get; set; }
}
```

初始化时可以使用

```csharp
var walterlv = new Walterlv
{
    Site = "https://walterlv.com",
};
```

基本上大家编写的类或多或少都会支持对象初始化器，所以本文不会对此谈论更多的内容。

### 通常的集合初始化器

当你定义一个集合的时候，你会发现你的类型已经天然支持集合初始化器了。比如你定义了下面这个集合：

```csharp
public class WalterlvCollection : ICollection<Walterlv>
{
    // 省略集合定义的代码。
}
```

那么此集合初始化的代码就可以写成下面这样：

```csharp
var collection = new WalterlvCollection
{
    new Walterlv(),
    new Walterlv(),
}
```

实际上你会发现实现一个 `ICollection` 是一件非常繁琐的事情。

![实现一个 ICollection 需要实现的方法](/static/posts/2018-10-08-15-56-50.png)  
▲ 实现一个 ICollection 需要实现的方法

### 最简单的集合初始化器

只是做一个集合初始化器的话并不需要写上面那么多的代码。

实际上，你只需要两个步骤：

1. 实现 IEnumerable 接口或任何子接口
1. 有一个 Add 方法

就像这样：

```csharp
public class WalterlvCollection : IEnumerable
{
    private readonly List<Walterlv> _list = new List<Walterlv>();
    public IEnumerator GetEnumerator()=>_list.GetEnumerator();
    public void Add(string site) => _list.Add(new Walterlv { Site = site });
}
```

于是你就可以像一个一般的集合那样去使用集合初始化器了：

```csharp
var collection = new WalterlvCollection
{
    "https://walterlv.com/",
    "https://blog.csdn.net/wpwalter",
};
```

### 多个参数的集合初始化器

刚刚我们的例子中 Add 方法只有一个参数，实际上也可以是多个参数。

```csharp
public class WalterlvCollection : IEnumerable
{
    private readonly List<Walterlv> _list = new List<Walterlv>();
    public IEnumerator GetEnumerator()=>_list.GetEnumerator();
    public void Add(string site, bool includeProtocol) => _list.Add(new Walterlv { Site = site });
}
```

现在初始化的方法就有点像字典了：

```csharp
var collection = new WalterlvCollection
{
    { "https://walterlv.com/", true },
    { "https://blog.csdn.net/wpwalter", true },
};
```

当然你也可以写更多参数，看起来更加丧心病狂。

```csharp
public class WalterlvCollection : IEnumerable
{
    private readonly List<Walterlv> _list = new List<Walterlv>();
    public IEnumerator GetEnumerator()=>_list.GetEnumerator();
    public void Add(string site, bool includeProtocol, string author)
        => _list.Add(new Walterlv { Site = site });
}
```

```csharp
var collection = new WalterlvCollection
{
    { "https://walterlv.com/", true, "walterlv" },
    { "https://blog.csdn.net/wpwalter", true, "walterlv" },
};
```

### 带索引集合初始化器

如果你期望的初始化方法是索引，实际上也不需要 `Add` 方法。只需要增加一个索引的定义即可：

```csharp
public class WalterlvCollection : IEnumerable
{
    private readonly List<Walterlv> _list = new List<Walterlv>();
    public IEnumerator GetEnumerator()=>_list.GetEnumerator();
    public string this[string site]
    {
        get => _list.Find(x => x.Site == site).Site;
        // 请忽略这里的 Bug，这只是一个语法糖的示例。
        set => _list.Add(new Walterlv { Site = value });
    }
}
```

这时，可以使用索引方式的集合初始化器：

```csharp
var collection = new WalterlvCollection
{
    ["吕毅"] = "https://walterlv.com/",
    ["林德熙"] = "https://blog.lindexi.com/"
};
```

### 这是一个可以发挥创造力的语法糖

利用单个和多个参数的集合初始化器，以及带索引的集合初始化器，我们甚至可以用集合初始化器去构造一些看起来不像集合的类型。这又是一波语法糖！

当然有一点值得注意，使用集合初始化器初始化的时候，`Add` 和 `this[]` 的初始化是不能同时使用的。

#### 参考资料

事实上微软的官方文档中并没有对集合初始化器的最简实现有多少描述，所以以下的参考实际上并没有用。

- 英文：[Object and Collection Initializers (C# Programming Guide) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/object-and-collection-initializers?wt.mc_id=MVP)
- 中文：[对象和集合初始值设定项（C# 编程指南） - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/csharp/programming-guide/classes-and-structs/object-and-collection-initializers?wt.mc_id=MVP)
