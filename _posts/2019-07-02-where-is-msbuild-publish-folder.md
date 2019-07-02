---
title: ".NET/MSBuild 中的发布路径在哪里呢？如何在扩展编译的时候修改发布路径中的文件呢？"
date: 2019-07-02 19:56:43 +0800
categories: dotnet csharp msbuild visualstudio
position: starter
---

在扩展 MSBuild 编译的时候，我们一般的处理的路径都是临时路径或者输出路径，那么发布路径在哪里呢？

---

我曾经在下面这一篇博客中说到可以通过阅读 Microsoft.NET.Sdk 的源码来探索我们想得知的扩展编译的答案：

- [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程 - walterlv](https://blog.walterlv.com/post/read-microsoft-net-sdk.html)

于是，我们可以搜索 `"Publish"` 这样的关键字找到我们希望找到的编译目标，于是找到在 Microsoft.NET.Sdk.Publish.targets 文件中，有很多的 `PublishDir` 属性存在，这可以很大概率猜测这个就是发布路径。不过我只能在这个文件中找到这个路径的再次赋值，找不到初值。

如果全 Sdk 查找，可以找到更多赋初值和使用它复制和生成文件的地方。

![PublishDir 全文查找](/static/posts/2019-07-02-19-52-15.png)

于是可以确认，这个就是最终的发布路径，只不过不同类型的项目，其发布路径都是不同的。

比如默认是：

```xml
<PublishDir Condition="'$(PublishDir)'==''">$(OutputPath)app.publish\</PublishDir>
```

还有：

```xml
<_DeploymentApplicationDir>$(PublishDir)$(_DeploymentApplicationFolderName)\</_DeploymentApplicationDir>
```

和其他。
