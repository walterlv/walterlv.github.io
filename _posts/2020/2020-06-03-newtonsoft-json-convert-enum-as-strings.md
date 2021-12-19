---
title: "在 .NET 对象和 JSON 互相序列化的时候，枚举类型如何设置成字符串序列化，而不是整型？"
date: 2020-06-03 07:57:07 +0800
tags: dotnet
position: problem
permalink: /post/newtonsoft-json-convert-enum-as-strings.html
---

默认情况下，Newtonsoft.Json 库序列化和反序列化 JSON 到 .NET 类型的时候，对于枚举值，使用的是整数。然而，在公开 JSON 格式的 API 时，整数会让 API 不易于理解，也不利于扩展和兼容。

---

那么，如何能使用字符串来序列化和反序列化 JSON 对象中的枚举呢？

—— 使用转换器（`JsonConverter`）。

Newtonsoft.Json 中自带了一些转换器，在 `Newtonsoft.Json.Converters` 命名空间下。其中枚举的转换是 `StringEnumConverter`，我们只需要将其标记在属性上即可。

如下面的代码所示：

```csharp
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace Walterlv.Models
{
    public class Foo
    {
        [JsonConverter(typeof(StringEnumConverter), true)]
        public DoubiLevel Level { get; set; }
    }

    public enum DoubiLevel
    {
        None,
        ABit,
        Normal,
        Very,
        Extreme,
    }
}
```

对于“逗比程度”枚举，增加了转换器后，这个对象的序列化和反序列化将成：

```json
{
    "Level": "very"
}
```

那个 `StringEnumConverter` 后面的参数 `true` 表示使用 `camelCase` 来格式化命名，即首字母小写。

当然，如果你希望属性名也小写的化，需要加上额外的序列化属性：

```diff
++  using System.Runtime.Serialization;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Converters;
    ……

++      [DataContract]
        public class Foo
        {
++          [DataMember(Name = "level")]
            [JsonConverter(typeof(StringEnumConverter), true)]
            public DoubiLevel Level { get; set; }
        }
    ……
```

将序列化和反序列化成：

```json
{
    "level": "very"
}
```

