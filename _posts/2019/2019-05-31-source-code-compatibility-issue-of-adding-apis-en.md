---
title: "The partial same C# namespace may cause source code compatibility issue"
publishDate: 2019-05-31 19:39:23 +0800
date: 2019-07-27 20:48:49 +0800
tags: csharp dotnet visualstudio
position: problem
version:
  current: English
versions:
  - 中文: /post/source-code-compatibility-issue-of-adding-apis.html
  - English: #
---

You might just add some simple APIs in your library and you'll not think that will break down your compatibility. But actually, it might, that is -- the source-code compatibility.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

Assume that we've written a project P which references another two libraries A and B. And we have a `Walterlv.A.Diagnostics.Foo` class in library A.

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

And now we add a new class `Walterlv.B.Diagnostics.Bar` class into the B library. That is adding a new API only.

Unfortunately, the code above would fail to compile because of the ambiguity of `Diagnostics` namespace. The `Foo` class cannot be found in an ambiguity namespace.

I write this post down to tell you that there may be source-code compatibility issue even if you only upgrade your library by simply adding APIs.
