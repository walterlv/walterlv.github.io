---
title: "（C#）if (this == null)？你在逗我，this 怎么可能为 null！"
date: 2018-03-30 22:16:52 +0800
categories: dotnet msil
published: false
---

`if (this == null) Console.WriteLine("this is null");` 这句话一写，大家一定觉得荒谬，然而 `if` 内代码的执行却是可能的！本文讲介绍到底发生了什么。

---

请看代码，这是我们的库函数：

```csharp
namespace Walterlv.Demo
{
    public class Foo
    {
        public void Test()
        {
            if (this == null) Console.WriteLine("this is null");
            else Console.WriteLine("this is not null");
        }
    }
}
```

外面是这样调用的：

```csharp
namespace Walterlv.Demo
{
    public class Program
    {
        private static void Main()
        {
            Foo p = null;
            p.Test();
        }
    }
}
```

这代码写出来，当然毫不犹豫地说——这会发生 `NullReferenceException`！

然而……

现在我们改一改 IL：



---

#### 参考资料

- [Observing a null this value](http://blog.paranoidcoding.com/2015/03/11/observing-a-null-this.html)
