---
title: "一个简单的方法：截取子类名称中不包含基类后缀的部分"
publishDate: 2019-11-27 10:03:09 +0800
date: 2019-12-08 15:29:19 +0800
categories: dotnet csharp
position: starter
---

基类是 `MenuItem`，子类是 `WalterlvMenuItem`、`FooMenuItem`。基类是 `Configuration`，子类是 `WalterlvConfiguration`、`ExtensionConfiguration`。在代码中，我们可能会为了能够一眼看清类之间的继承（从属）关系而在子类名称后缀中带上基类的名称。但是由于这种情况下的基类不参与实际的业务，所以对外（文件/网络）的名称通常不需要带上这个后缀。

本文提供一个简单的方法，让子类中基类的后缀删掉，只取得前面的那部分。

---

在这段代码中，我们至少需要获得两个传入的参数，一个是基类的名称，一个是子类的名称。但是考虑到让开发者就这样传入两者名称的话会比较容易出问题，因为开发者可能根本就不会按照要求去获取类型的名称。所以我们需要自己通过类型对象来获取名称。

另外，我们还需要有一些约束，必须有一个类型是另外一个类型的子类。于是我们可能必须来使用泛型做这样的约束。

于是，我们可以写出下面的方法：

```csharp
using System;

namespace Walterlv.Utils
{
    /// <summary>
    /// 包含类名相关的处理方法。
    /// </summary>
    internal static class ClassNameUtils
    {
        /// <summary>
        /// 当某个类型的派生类都以基类（<typeparamref name="T"/>）名称作为后缀时，去掉后缀取派生类名称的前面部分。
        /// </summary>
        /// <typeparam name="T">名称统一的基类名称。</typeparam>
        /// <param name="this">派生类的实例。</param>
        /// <returns>去掉后缀的派生类名称。</returns>
        internal static string GetClassNameWithoutSuffix<T>(this T @this)
        {
            if (@this is null)
            {
                throw new ArgumentNullException(nameof(@this));
            }

            var derivedTypeName = @this.GetType().Name;
            var baseTypeName = typeof(T).Name;
            // 截取子类名称中去掉基类后缀的部分。
            var name = derivedTypeName.EndsWith(baseTypeName, StringComparison.Ordinal)
                ? derivedTypeName.Substring(0, derivedTypeName.Length - baseTypeName.Length)
                : derivedTypeName;
            // 如果子类名称和基类完全一样，则直接返回子类名称。
            return string.IsNullOrWhiteSpace(name) ? derivedTypeName : name;
        }
    }
}
```

我们通过判断子类是否以基类名称作为后缀来决定是否截取子字符串。

在截取完子串之后，我们还需要验证截取的字符串是否已经是空串了，因为父子类的名称可能是完全一样的（虽然这样的做法真的很逗比）。

于是使用起来只需要简单调用一下：

```csharp
class Program
{
    static void Main(string[] args)
    {
        var name = ClassNameUtils.GetClassNameWithoutSuffix<Foo>(new XFoo());
    }
}

internal class Foo
{

}

internal class XFoo : Foo
{

}
```

于是我们可以得到 `name` 局部变量的值为 `X`。如果这个时候我们对 `XFoo` 类型改名，例如改成 `XFoo1`，那么就不会截取，而是直接得到名称 `XFoo1`。
