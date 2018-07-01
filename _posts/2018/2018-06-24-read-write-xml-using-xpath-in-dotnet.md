---
title: ".NET 使用 XPath 来读写 XML 文件"
date: 2018-06-24 21:10:08 +0800
categories: dotnet
---

XPath 是 XML 路径语言（XML Path Language），用来确定XML文档中某部分位置的语言。无论是什么语言什么框架，几乎都可以使用 XPath 来高效查询 XML 文件。

本文将介绍 .NET 中的 XPath 相关类型的使用。

---

本文读写的 XML 文件会以 [文章末尾的代码 - 假设的 XML 文件](#%E5%81%87%E8%AE%BE%E7%9A%84-xml-%E6%96%87%E4%BB%B6) 作为示例。

关于 XPath 语法，可以阅读 [XML 的 XPath 语法](/post/xml-xpath.html) 了解更多。

<div id="toc"></div>

### 一切从这里开始

.NET 中支持 XPath 的 XML 文档类有两种读取方法，一种是 `XPathDocument`，以只读的方式读取；另一种是 `XmlDocument`，不止可以读，还可以编辑。

```csharp
// 得到 walterlv.xml 文档在内存中的快速只读表示形式。
var xPathDocument = new XPathDocument("walterlv.xml");
// 以可读可写的方式打开 walterlv.xml 文件。
var xmlDocument = new XmlDocument();  
xmlDocument.Load("walterlv.xml"); 
```

如果要确定 XML 的文件编码，需要使用 `XmlTextReader` 来读 XML 文件；它的基类 `XmlReader` 没有提供编码信息。`XmlTextReader` 作为参数传入 `XPathDocument` 的构造函数或 `XmlDocument.Load` 方法中即可。

无论是 `XPathDocument` 还是 `XmlDocument`，因为都实现了 `IXPathNavigable`，所以都有 `CreateNavigator();` 方法，调用能得到 `XPathNavigator` 对象。不过前者的 `CanEdit` 是 `false`，后者的 `CanEdit` 是 `true`。

```csharp
var navigator1 = xPathDocument.CreateNavigator();
var navigator2 = xmlDocument.CreateNavigator();
```

### 上手 XPath

#### 路径查询

`XPathNavigator` 对象提供了下面两种通用的 `XPath` 表达式的使用检索方法。

- `Select`
- `SelectSingleNode`

比如希望检索本文末尾的 XML 文件中的 `id`，使用 `/package/metadata/id` 即可检索。

当然，事实上这个 XML 文件是不能这样检索出来 `id` 的，因为它带有命名空间。

带有命名空间的检索需要使用到 `XmlNamespaceManager` 类，并写成下面这样：

```csharp
var namespaceManager = new XmlNamespaceManager(new NameTable());
namespaceManager.AddNamespace("d", "http://schemas.microsoft.com/packaging/2012/06/nuspec.xsd");
navigator.Select("/d:package/d:metadata/d:id", namespaceManager);
```

这里其实略微奇怪，因为命名 `package`、`id` 等都在默认的命名空间下，我们却必须显式加一个命名空间前缀。微软对此的解释是如果不指定命名空间前缀，默认都是 `null`，而不是 XML 声明的那个默认命名空间。[这里是原文](https://docs.microsoft.com/en-us/dotnet/standard/data/xml/xpath-queries-and-namespaces#the-default-namespace)：

> XPath treats the empty prefix as the `null` namespace. In other words, only prefixes mapped to namespaces can be used in XPath queries. This means that if you want to query against a namespace in an XML document, even if it is the default namespace, you need to define a prefix for it.

路径检索的语法也有很多种，可以参考我的另一篇文章 [XML 的 XPath 语法](/post/xml-xpath.html)。

为了提升性能，`XPathNavigator` 额外提供了这些方法，用于替代 `XPath` 中的部分对应的语法：

- `SelectChildren`
- `SelectAncestors`
- `SelectDescendants`

#### XPath 函数调用

`Compile` 和 `Evaluate` 提供了复杂的 XPath 函数调用。比如下面我们把几种 url 都拼接在一起得到一个新字符串。

```csharp
XPathExpression query = navigator.Compile("concat(//licenseUrl/text(), //projectUrl/text(), //iconUrl/text())");
string urls = (string) navigator.Evaluate(query);
```

#### 节点匹配

`Matches` 用来检查当前的节点是否满足某个条件。比如下面的例子便是检查当前节点的父节点是否是 `group` 并且其 `targetFramework` 属性为 `.NETStandard2.0`。显然，符合这个条件的只有最后的那个 `dependency` 节点。

```csharp
navigator.Matches("../group/@targetFramework='.NETStandard2.0'");
```

### XPath 导航

`XPathNavigator` 可以在节点、属性中间移动，以便能够不止从根节点进行查询。

- `MoveTo`
- `MoveToChild`
- `MoveToFirst`
- `MoveToFirstChild`
- `MoveToFollowing`
- `MoveToId`
- `MoveToNext`
- `MoveToParent`
- `MoveToPrevious`
- `MoveToRoo`
- `MoveToAttribute`
- `MoveToFirstAttribute`
- `MoveToNextAttribute`
- `MoveToNamespace`
- `MoveToFirstNamespace`
- `MoveToNextNamespace`

在导航到需要的节点或者属性后，可以使用 `navigator.OuterXml` 拿到节点的所有 XML 字符串。也可以使用下面这些方法拿到节点内部的值。

- `ValueAsBoolean`
- `ValueAsDateTime`
- `ValueAsDouble`
- `ValueAsInt`
- `ValueAsLong`
- `ValueAs`

### 编辑 XML

由于我们要编辑 XML 数据，所以加载 XML 文件的方式不能是 `XPathDocument` 了，得是 `XmlDocument`。

插入使用 `Insert` 相关的方法，删除使用 `Delete` 相关的方法。而修改数据使用 `SetValue`。

### 保存 XML 到文件

保存 XML 使用 `XmlDocument` 的 `Save` 或者 `WriteTo` 方法即可。

---

### 假设的 XML 文件

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

- [使用 XPath 导航选择节点 - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/standard/data/xml/select-nodes-using-xpath-navigation)
- [Process XML Data Using the XPath Data Model - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/data/xml/process-xml-data-using-the-xpath-data-model)
- [XPath Queries and Namespaces - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/data/xml/xpath-queries-and-namespaces)
- [.NET(C#)：使用XPath查询带有命名空间(有xmlns)的XML - Mgen](https://www.mgenware.com/blog/?p=596)
- [.net - How to use XPath with XElement or LINQ? - Stack Overflow](https://stackoverflow.com/questions/3642829/how-to-use-xpath-with-xelement-or-linq)
