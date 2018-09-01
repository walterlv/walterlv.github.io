---
title: "如何根据一个绝对文件路径生成一个相对文件路径"
publishDate: 2018-06-07 19:30:24 +0800
date: 2018-09-01 08:04:03 +0800
categories: dotnet
---

日常的开发中，获取绝对文件路径才是主流吧！连 `Path.GetFullPath` 这种生成绝对路径的方法都已经成为 .NET Standard 的一部分了。

然而，生成相对路径依然有用——比如你的配置文件是相对于工作目录的，必须这个路径是输出给用户看的……

---

那么，既然 `Path` 没有生成相对路径的方法，还能怎么生成相对路径呢？*别跟我说自己去做字符串比较……*

`Uri` 却提供了 `MakeRelativeUri` 方法，可以生成一个路径到另一个路径的相对路径。于是我们可以写出这样的代码：

```csharp
public static string MakeRelativePath(string fromPath, string toPath)
{
    var fromUri = new Uri(fromPath);
    var toUri = new Uri(toPath);
    var relativeUri = fromUri.MakeRelativeUri(toUri);
    return Uri.UnescapeDataString(relativeUri.ToString());
}
```

运行传入 `C:\Users\walterlv\OpenSource\Demo` 和 `C:\Users\walterlv\OpenSource\Demo\build\config.xml`。结果，竟然得到的相对路径是：`Demo/build/config.xml`。

1. 那个 `Demo` 明明是两者共有的路径部分，却存在于相对路径中；
1. 生成的路径使用 `/`，而不是 Windows 系统使用的 `\`。

于是我们需要分别进行这两个处理。对于前者，我们必须让 `Uri` 意识到这是一个文件夹才能让最终生成的路径不带这个重复的部分；对于后者，我们需要进行路径连接符转换。于是最终的代码我整理成了如下方法：

```csharp
public static string MakeRelativePath(string fromPath, string toPath)
{
    if (string.IsNullOrEmpty(fromPath)) throw new ArgumentNullException(nameof(fromPath));
    if (string.IsNullOrEmpty(toPath)) throw new ArgumentNullException(nameof(toPath));

    var fromUri = new Uri(fromPath);
    var toUri = new Uri(toPath);

    if (fromUri.Scheme != toUri.Scheme)
    {
        // 不是同一种路径，无法转换成相对路径。
        return toPath;
    }
    
    if (fromUri.Scheme.Equals("file", StringComparison.InvariantCultureIgnoreCase)
        && !fromPath.EndsWith("/") && !fromPath.EndsWith("\\"))
    {
        // 如果是文件系统，则视来源路径为文件夹。
        fromUri = new Uri(fromPath + Path.DirectorySeparatorChar);
    }

    var relativeUri = fromUri.MakeRelativeUri(toUri);
    var relativePath = Uri.UnescapeDataString(relativeUri.ToString());

    if (toUri.Scheme.Equals("file", StringComparison.InvariantCultureIgnoreCase))
    {
        relativePath = relativePath.Replace(Path.AltDirectorySeparatorChar, Path.DirectorySeparatorChar);
    }

    return relativePath;
}
```

现在重新传入 `C:\Users\walterlv\OpenSource\Demo` 和 `C:\Users\walterlv\OpenSource\Demo\build\config.xml`。结果，已经能够得到：`build\config.xml` 了。

---

#### 参考资料

- [.net - How to get relative path from absolute path - Stack Overflow](https://stackoverflow.com/q/275689/6233938)
