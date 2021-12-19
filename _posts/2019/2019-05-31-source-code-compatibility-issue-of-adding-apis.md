---
title: "不要在 C# 代码中写部分命名空间（要么不写，要么写全），否则会有源码兼容性问题"
publishDate: 2019-05-31 19:39:26 +0800
date: 2019-10-29 08:51:56 +0800
tags: csharp dotnet visualstudio
position: problem
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/source-code-compatibility-issue-of-adding-apis-en.html
permalink: /posts/source-code-compatibility-issue-of-adding-apis.html
---

我只是增加库的一个 API，比如增加几个类而已，应该不会造成兼容性问题吧。对于编译好的二进制文件来说，不会造成兼容性问题；但——可能造成源码不兼容。

本文介绍可能的源码不兼容问题。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

比如我有一个项目 P 引用 A 和 B 两个库。其中使用到了 A 库中的 `Walterlv.A.Diagnostics.Foo` 类型。

```csharp
using Walterlv.A;
using Walterlv.B;

namespace Walterlv.Demo
{
    class Hello
    {
        Run(Diagnostics.Foo foo)
        {
        }
    }
}
```

现在，我们在 B 库中新增一个类型 `Walterlv.B.Diagnostics.Bar` 类型。

那么上面的代码将无法完成编译，因为 `Diagnosis` 命名空间将具有不确定的含义，其中的 `Foo` 类型也将无法在不确定的命名空间中找到。

因此：

1. **强烈建议遵守** 使用类型的时候，要么不写命名空间（完全留给 `using`），要么写全命名空间（从第一段开始写，不要省略任何部分），否则就容易与其他命名空间冲突；
2. **可选遵守** 在库中新增 API 的时候，可能需要考虑避免将部分命名空间写成过于通用的名称。

是的，即使是单纯的新增 API 也可能会导致使用库的一方在源码级不兼容。当然二进制还是兼容的。

另外，[OpportunityLiu](https://github.com/OpportunityLiu) 提醒，如果命名空间是 `Walterlv.B.Walterlv.A.Diagnostics.Bar`，一样可以让写全了的命名空间炸掉。呃……还是不要在库里面折腾这样的命名空间好……不然代码当中到处充斥着 `global::` 可是非常难受的。

