---
title: "C# 中新增类型的命名空间只需部分与其他命名空间名称相同即可破坏源码兼容性"
date: 2019-05-31 19:39:26 +0800
categories: csharp dotnet visualstudio
position: problem
version:
  current: 中文
versions:
  - 中文: /post/source-code-compatibility-issue-of-adding-apis.html
  - English: #
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

本文其实是在说，即使是单纯的新增 API 也可能会导致使用库的一方在源码级不兼容。当然二进制还是兼容的。
