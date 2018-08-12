---
title: "C#/.NET 序列化和反序列化 YAML 元数据"
date: 2018-08-12 20:44:50 +0800
categories: dotnet csharp
---

我希望能够对我博客中的所有 YAML 元数据进行格式化和自动生成，于是我需要进行一些 YAML 解析和写入的操作。

.NET 并没有原生提供对 YAML 的序列化和反序列化。虽然 YAML 文件的解析并不难，不过如果不是处于特别的理由（比如性能），使用现有的库解析 YAML 是比较好的选择。

---

本文推荐使用 [YamlDotNet](https://www.nuget.org/packages/YamlDotNet/) 序列化和反序列化 YAML。

<div id="toc"></div>

### YAML 元数据

作为示例，我拿出我在去年写的一篇博客的元数据进行分析：

```yaml
layout: post
title: "利用 TypeConverter，转换字符串和各种类型只需写一个函数"
date_published: 2017-01-17 18:13:00 +0800
date: 2018-04-23 07:31:32 +0800
categories: dotnet
permalink: /dotnet/2017/01/17/convert-using-type-converter.html
keywords: dotnet typeconverter
description: 使用 TypeConverter 实现字符串转各种类型。
```

注意，实际上元数据是包含开始标签和结束标签的。yaml 元数据以 `---` 包裹，toml 元数据以 `+++` 包裹。

由于从 Markdown 中解析出 YAML 元数据不是本文的重点，所以我放到最后一起说明。

### 定义 .NET 类型

我们需要先定义 .NET 类型，以便 YamlDotNet 进行序列化和反序列化。

```csharp
public sealed class YamlFrontMeta
{
    [YamlMember(Alias = "title", ApplyNamingConventions = false)]
    public string Title { get; set; }

    [YamlMember(Alias = "date", ApplyNamingConventions = false)]
    public string Date { get; set; }

    [YamlMember(Alias = "date_published", ApplyNamingConventions = false)]
    public string PublishDate { get; set; }

    [YamlMember(Alias = "layout", ApplyNamingConventions = false)]
    public string Layout { get; set; }

    [YamlMember(Alias = "permalink", ApplyNamingConventions = false)]
    public string PermanentUrl { get; set; }

    [YamlMember(Alias = "categories", ApplyNamingConventions = false)]
    public string Categories { get; set; }

    [YamlMember(Alias = "tags", ApplyNamingConventions = false)]
    public string Tags { get; set; }

    [YamlMember(Alias = "keywords", ApplyNamingConventions = false)]
    public string Keywords { get; set; }

    [YamlMember(Alias = "description", ApplyNamingConventions = false)]
    public string Description { get; set; }

    [YamlMember(Alias = "version", ApplyNamingConventions = false)]
    public List<VersionInfo> Version { get; set; }

    [YamlMember(Alias = "versions", ApplyNamingConventions = false)]
    public List<VersionsInfo> Versions { get; set; }

    [YamlMember(Alias = "published", ApplyNamingConventions = false)]
    public bool IsPublished { get; set; } = true;

    [YamlMember(Alias = "sitemap", ApplyNamingConventions = false)]
    public bool IsInSiteMap { get; set; } = true;
}
```

.NET 类型中的属性必须是 YAML 文件中属性的超集。

以上 `ApplyNamingConventions` 属性的默认值是 `true`，这为了解决一些命名约束上的问题，详见：[YamlMember Alias isn't applied when using the CamelCaseNamingConvention · Issue #228 · aaubry/YamlDotNet](https://github.com/aaubry/YamlDotNet/issues/228)。

另外，如果 YAML 属性中包含数组，则需要将属性的类型设置为集合类型。

```yaml
title: "Good Framework Rely on Good Api —— Six API Design Principles"
date_published: 2018-06-30 19:09:53 +0800
date: 2018-08-12 16:04:26 +0800
categories: dotnet framework
version:
  - current: English
versions:
  - 中文: /post/framework-api-design.html
  - English: #
```

```csharp
public sealed class VersionInfo
{
    [YamlMember(Alias = "current", ApplyNamingConventions = false)]
    public string Current { get; set; }
}

public sealed class VersionsInfo
{
    [YamlMember(Alias = "中文", ApplyNamingConventions = false)]
    public string Chinese { get; set; }

    [YamlMember(Alias = "English", ApplyNamingConventions = false)]
    public string English { get; set; }
}
```

### 序列化与反序列化

使用 `Deserializer` 类型可以反序列化一个 YAML 元数据。

```csharp
var deserializer = new Deserializer();
var matter = deserializer.Deserialize<YamlFrontMeta>(yamlText);
```

使用 `Serializer` 类型可以序列化一个 YAML 元数据到字符串。这样，就能更新博客的 YAML 元数据部分了。

```csharp
var serializer = new Serializer();
var yamlText = serializer.Serialize(matter);
```
