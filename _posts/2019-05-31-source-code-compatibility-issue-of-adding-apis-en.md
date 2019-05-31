---
title: "The partial same C# namespace may cause source code compatibility issue"
date: 2019-05-31 19:37:45 +0800
categories: csharp dotnet visualstudio
position: problem
---

You might just add some simple APIs in your library and you'll not think that will break down your compatibility. But actually, it might, that is -- the source-code compatibility.

---

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
