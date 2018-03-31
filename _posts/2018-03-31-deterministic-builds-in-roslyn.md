---
title: "Roslyn 的确定性构建"
date: 2018-03-31 17:22:19 +0800
categories: visualstudio dotnet csharp
---

注意到每次编译完之后，你的 dll 或者 exe 是不一样的吗？本来这并没有什么大不了的，但大家都知道数字和鹅厂的安全软件遍布在我们大(tiān)陆(cháo)地区的大量电脑上，它们的查杀策略是——凡是不认识的一律是病毒木马；于是每次不一样的编译很容易引起它们的警告——真不想每次都把编译后的样本提交给它们存档入库。

---

<div id="toc"></div>

### 确定性编译

于是有一天意外地发现了 Roslyn 的确定性构建。

方法是在 csproj 文件中加入 `<Deterministic/>` 标记。

```xml
<Project>
 <PropertyGroup>
   <Deterministic>true</Deterministic>
 </PropertyGroup>
</Project>
```

然后重新生成 dll 或 exe，多生成几次（每次都重新生成），会发现每次验证文件的 Hash 值都是一样的。

![Deterministic Hash](/static/posts/2018-03-31-16-33-42.png)

但是，一旦我们去掉这个标记，再验证 Hash 值，就开始改变了，而且每次都不一样。

![Non-deterministic Hash](/static/posts/2018-03-31-16-35-34.png)

### 不确定的编译

是什么导致了没有加此标记时每次编译都不一样呢？最少有三个：

- **MVID**：当初微软在制定 CLI 标准时就说每次编译都应该在 PE 头生成新的 Id（很多工具都直接使用了 guid）
- **PDB ID**：一个跟新生成的 PDB 文件匹配的 GUID 标识符
- **时间戳**：每次编译都要把当前时间加上

当然，如果你的版本号使用了 `1.0.*` 这样的动态版本号，那么每次编译还会新增一个构建号。

---

#### 参考资料

- [Customize your build - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/customize-your-build)
- [roslyn/Deterministic Inputs.md at master · dotnet/roslyn](https://github.com/dotnet/roslyn/blob/master/docs/compilers/Deterministic%20Inputs.md)
- [Deterministic Builds in C#](https://gist.github.com/aelij/b20271f4bd0ab1298e49068b388b54ae)
- [[Umbrella] Compilers should be deterministic: same inputs generate same outputs · Issue #372 · dotnet/roslyn](https://github.com/dotnet/roslyn/issues/372)
- [Deterministic builds in Roslyn](http://blog.paranoidcoding.com/2016/04/05/deterministic-builds-in-roslyn.html)
