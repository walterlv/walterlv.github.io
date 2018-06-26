---
title: "使用 LINQ to XML，.NET 让生成 XML 文件变得和直接写 XML 一样轻松"
date: 2018-06-26 11:26:40 +0800
categories: dotnet
---

由 .NET Framework 3.5 引入，并依然在 .NET Core 中发扬光大的 LINQ to XML 让编写 XML 文件变得非常轻松。

---

使用 `XElement`、`XAttribute` 我们能够完整构造一个 XML 出来。为了能直观地体会到优势，我写一个最简单的例子：

```csharp
var root = new XElement("Root",
    new XAttribute("Attribute", "Walterlv"),
    new XElement("Node", "Content")
);
```

构造出来的 XML 将是这样的：

```xml
<Root Attribute="Walterlv">
  <Node>Content</Node>
</Root>
```

是不是觉得包括行的安排和缩进在内，都和 XML 一样简单？

我们来看一个更复杂的例子，这是直接在编写一个 NuGet 的 nuspec 文件：

```csharp
var xmlns = "http://schemas.microsoft.com/packaging/2012/06/nuspec.xsd";
var root = new XElement("package",
    new XAttribute(XNamespace.Xmlns.ToString(), xmlns),
    new XElement("metadata",
        new XElement("id", "MSTestEnhancer"),
        new XElement("version", "1.6.0"),
        new XElement("authors", "walterlv"),
        new XElement("owners", "walterlv"),
        new XElement("requireLicenseAcceptance", "false"),
        new XElement("licenseUrl", "https://github.com/dotnet-campus/MSTestEnhancer/blob/master/LICENSE"),
        new XElement("projectUrl", "https://dotnet-campus.github.io/mstest-enhancer"),
        new XElement("iconUrl", "https://dotnet-campus.github.io/mstest-enhancer/icon.png"),
        new XElement("description", "MSTestEnhancer helps you to write unit tests without naming any method. You can write method contract descriptions instead of writing confusing test method name when writing unit tests."),
        new XElement("releaseNotes", "Support passing null into WithArgument method."),
        new XElement("copyright", "Copyright (c) 2018 dotnet职业技术学院"),
        new XElement("repository",
            new XAttribute("type", "git"),
            new XAttribute("url", "https://github.com/dotnet-campus/MSTestEnhancer.git")),
        new XElement("dependencies", dependencies.Select(group => new XElement("group",
            new XAttribute("targetFramework", group.Key), group.Value.Select(x =>
                new XElement("dependency",
                    new XAttribute("id", x.id),
                    new XAttribute("version", x.version),
                    new XAttribute("exclude", x.exclude)))))
        )
    ));
var document = new XDocument(root);
document.Save(@"C:\Users\walterlv\Desktop\Walterlv.Demo.nuspec");
```

其中的 `dependencies` 集合我写在了其他地方，这样更像是动态生成，而不是仅仅为了给一个例子。

```csharp
var dependencies = new Dictionary<string, (string id, string version, string exclude)[]>
{
    [".NETFramework4.5"] = new[]
    {
        ("MSTest.TestFramework", "1.2.0", "Build,Analyzers"),
        ("System.ValueTuple", "4.4.0", "Build,Analyzers"),
    },
    [".NETFramework4.7"] = new[]
    {
        ("MSTest.TestFramework", "1.2.0", "Build,Analyzers"),
    },
    [".NETStandard2.0"] = new[]
    {
        ("MSTest.TestFramework", "1.2.0", "Build,Analyzers"),
    }
};
```

生成的 nuspec 文件非常像 NuGet 的原生 nuspec 文件。

```xml
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2012/06/nuspec.xsd">
  <metadata>
    <id>MSTestEnhancer</id>
    <version>1.6.0</version>
    <authors>walterlv</authors>
    <owners>walterlv</owners>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <licenseUrl>https://github.com/easiwin/MSTestEnhancer/blob/master/LICENSE</licenseUrl>
    <projectUrl>https://easiwin.github.io/mstest-enhancer</projectUrl>
    <iconUrl>https://easiwin.github.io/mstest-enhancer/icon.png</iconUrl>
    <description>MSTestEnhancer helps you to write unit tests without naming any method. You can write method contract descriptions instead of writing confusing test method name when writing unit tests.</description>
    <releaseNotes>Support passing null into WithArgument method.</releaseNotes>
    <copyright>Copyright (c) 2018 dotnet职业技术学院</copyright>
    <repository type="git" url="https://github.com/easiwin/MSTestEnhancer.git" />
    <dependencies>
      <group targetFramework=".NETFramework4.5">
        <dependency id="MSTest.TestFramework" version="1.2.0" exclude="Build,Analyzers" />
        <dependency id="System.ValueTuple" version="4.4.0" exclude="Build,Analyzers" />
      </group>
      <group targetFramework=".NETFramework4.7">
        <dependency id="MSTest.TestFramework" version="1.2.0" exclude="Build,Analyzers" />
      </group>
      <group targetFramework=".NETStandard2.0">
        <dependency id="MSTest.TestFramework" version="1.2.0" exclude="Build,Analyzers" />
      </group>
    </dependencies>
  </metadata>
</package>
```

---

#### 参考资料

- [LINQ to XML 与DOM (C#) - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/csharp/programming-guide/concepts/linq/linq-to-xml-vs-dom)
- [如何：控制命名空间前缀 (C#) (LINQ to XML) - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/csharp/programming-guide/concepts/linq/how-to-control-namespace-prefixes-linq-to-xml)
