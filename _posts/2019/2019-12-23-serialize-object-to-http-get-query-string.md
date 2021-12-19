---
title: "如何将一个 .NET 对象序列化为 HTTP GET 的请求字符串"
date: 2019-12-23 18:45:19 +0800
tags: dotnet csharp
position: problem
---

HTTP GET 请求时携带的参数直接在 URL 中，形式如 `?key1=value&key2=value&key3=value`。如果是 POST 请求时，我们可以使用一些库序列化为 json 格式作为 BODY 发送，那么 GET 请求呢？有可以直接将其序列化为 HTTP GET 请求的 query 字符串的吗？

---

<div id="toc"></div>

## HTTP GET 请求

一个典型的 HTTP GET 请求带参数的话大概是这样的：

```
https://s.blog.walterlv.com/api/example?key1=value&key2=value&key3=value
```

于是我们将一个类型序列化为后面的参数：

```csharp
[DataContract]
public class Foo
{
    [DataMember(Name = "key1")]
    public string? Key1 { get; set; }

    [DataMember(Name = "key2")]
    public string? Key2 { get; set; }

    [DataMember(Name = "key3")]
    public string? Key3 { get; set; }
}
```

## 库？

可能是这个需求太简单了，所以并没有找到单独的库。所以我就写了一个源代码包放到了 nuget.org 上。

在这里下载源代码包：

- [Walterlv.Web.Source](https://www.nuget.org/packages/Walterlv.Web.Source/)

你不需要担心引入额外的依赖，因为这是一个源代码包。关于源代码包不引入额外依赖 dll 的原理，可以参见：

- [.NET 将多个程序集合并成单一程序集的 4+3 种方法 - walterlv](/post/how-to-merge-dotnet-assemblies)

## 方法

我们需要做的是，将一个对象序列化为 query 字符串。假设这个对象的局部变量名称是 `query`，于是我们需要：

1. 取得此对象所有可获取值的属性
    - `query.GetType().GetProperties()`
1. 获取此属性值的方法
    - `property.GetValue(query, null)`
1. 将属性和值拼接起来
    - `string.Join("&", properties)`

然而真实场景可能比这个稍微复杂一点：

1. 我们需要像 Newtonsoft.Json 一样，对于标记了 `DataContract` 的类，按照 `DataMember` 来序列化
1. URL 中的值需要进行转义

所以，我写出了下面的方法：

```csharp
var isContractedType = query.GetType().IsDefined(typeof(DataContractAttribute));
var properties = from property in query.GetType().GetProperties()
                    where property.CanRead && (isContractedType ? property.IsDefined(typeof(DataMemberAttribute)) : true)
                    let memberName = isContractedType ? property.GetCustomAttribute<DataMemberAttribute>().Name : property.Name
                    let value = property.GetValue(query, null)
                    where value != null && !string.IsNullOrWhiteSpace(value.ToString())
                    select memberName + "=" + HttpUtility.UrlEncode(value.ToString());
var queryString = string.Join("&", properties);
return string.IsNullOrWhiteSpace(queryString) ? "" : prefix + queryString;
```

完整的代码如下：

```csharp
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization;
using System.Web;

namespace Walterlv.Web.Core
{
    internal class QueryString
    {
        [return: NotNullIfNotNull("query")]
        public static string? Serialize(object? query, string? prefix = "?")
        {
            if (query is null)
            {
                return null;
            }

            var isContractedType = query.GetType().IsDefined(typeof(DataContractAttribute));
            var properties = from property in query.GetType().GetProperties()
                             where property.CanRead && (isContractedType ? property.IsDefined(typeof(DataMemberAttribute)) : true)
                             let memberName = isContractedType ? property.GetCustomAttribute<DataMemberAttribute>().Name : property.Name
                             let value = property.GetValue(query, null)
                             where value != null && !string.IsNullOrWhiteSpace(value.ToString())
                             select memberName + "=" + HttpUtility.UrlEncode(value.ToString());
            var queryString = string.Join("&", properties);
            return string.IsNullOrWhiteSpace(queryString) ? "" : prefix + queryString;
        }
    }
}
```

你可能会遇到 `[return: NotNullIfNotNull("query")]` 这一行编译不通过的情况，这个是 C# 8.0 带的可空引用类型所需要的契约类。

你可以将它删除，或者安装我的另一个 NuGet 包来获得更多可空引用类型契约的支持，详见：

- [C# 8.0 的可空引用类型，不止是加个问号哦！你还有很多种不同的可空玩法 - walterlv](/post/csharp-nullable-analysis-attributes)
