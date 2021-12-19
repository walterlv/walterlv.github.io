---
title: "C#/.NET 如何确认一个路径是否是合法的文件路径"
date: 2019-01-16 20:18:20 +0800
tags: csharp dotnet
position: problem
coverImage: /static/posts/2019-01-16-20-14-28.png
permalink: /posts/verify-a-string-as-a-file-path.html
---

很多方法要求传入一个字符串作为文件名或者文件路径，不过方法在实际执行到使用文件名的时候才会真正使用到这个文件名；于是这这种时候才会因为各种各样的异常发现文件名或者文件路径是不合法的。

有没有方法能够提前验证文件名或者文件路径是否是合法的路径呢？

---

这是一个不幸的结论 —— 没有！

实际上由我们自己写代码判断一个字符串是否是一个合法的文件路径是非常困难的，因为：

1. 不同操作系统的路径格式是不同的；
1. 同一个操作系统有各种各样不同的路径用途。

但你可能会说，就算有各种不同，也是可以穷举出来的。那么来看看穷举这些不同的情况需要多少代码吧：

- [Path.Windows.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/IO/Path.Windows.cs)
- [PathHelper.Windows.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/IO/PathHelper.Windows.cs)
- [PathInternal.Windows.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/IO/PathInternal.Windows.cs)

看完这些代码，你是不是可以考虑放弃做 100% 精确的提前验证了？放弃是正解。

那么接下来如何验证呢？

使用 `new FileInfo(string fileName)` 类型和 `Path.GetFullPath(string path)` 方法来判断，则会使用到以上的代码，不过副作用是在路径不合法的时候抛出异常。

![抛出异常](/static/posts/2019-01-16-20-14-28.png)

然而作为 API，验证路径的合法性也是需要抛出异常的，所以大可以继续使用这样的方法，用方法内部抛出的异常来提醒开发者传入的路径不合法。

但有时候是作为与用户的交互来判断路径或者文件名是否合法的，那么这个时候使用异常就不太合适了。毕竟 C#/.NET 的异常机制不应该参与正常的逻辑流程。

那么可以使用 `Path.GetInvalidFileNameChars()` 和 `GetInvalidPathChars()` 来判断字符串中是否包含不合法的文件名字符或者路径字符。

以下代码来自 .NET Core 的库源码 [Path.Windows.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/IO/Path.Windows.cs)：

```csharp
public static char[] GetInvalidFileNameChars() => new char[]
{
    '\"', '<', '>', '|', '\0',
    (char)1, (char)2, (char)3, (char)4, (char)5, (char)6, (char)7, (char)8, (char)9, (char)10,
    (char)11, (char)12, (char)13, (char)14, (char)15, (char)16, (char)17, (char)18, (char)19, (char)20,
    (char)21, (char)22, (char)23, (char)24, (char)25, (char)26, (char)27, (char)28, (char)29, (char)30,
    (char)31, ':', '*', '?', '\\', '/'
};

public static char[] GetInvalidPathChars() => new char[]
{
    '|', '\0',
    (char)1, (char)2, (char)3, (char)4, (char)5, (char)6, (char)7, (char)8, (char)9, (char)10,
    (char)11, (char)12, (char)13, (char)14, (char)15, (char)16, (char)17, (char)18, (char)19, (char)20,
    (char)21, (char)22, (char)23, (char)24, (char)25, (char)26, (char)27, (char)28, (char)29, (char)30,
    (char)31
};
```

---

**参考资料**

- [.net - Determine via C# whether a string is a valid file path - Stack Overflow](https://stackoverflow.com/questions/3067479/determine-via-c-sharp-whether-a-string-is-a-valid-file-path)
- [c# - How do I check if a given string is a legal/valid file name under Windows? - Stack Overflow](https://stackoverflow.com/questions/62771/how-do-i-check-if-a-given-string-is-a-legal-valid-file-name-under-windows)
- [c# - Windows filepath and filename validation - Code Review Stack Exchange](https://codereview.stackexchange.com/questions/120002/windows-filepath-and-filename-validation)
- [Path.Windows.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/IO/Path.Windows.cs)
- [PathHelper.Windows.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/IO/PathHelper.Windows.cs)
- [PathInternal.Windows.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/IO/PathInternal.Windows.cs)


