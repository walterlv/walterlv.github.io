---
title: "使用并解析 OPML 格式的订阅列表来转移自己的 RSS 订阅（解析篇）"
date: 2018-09-23 20:01:15 +0800
categories: dotnet csharp uwp
---

OPML 全称是 **Outline Processor Markup Language** ，即 **大纲处理标记语言**。目前流行于收集博客的 RSS 源，便于用户转移自己的订阅项目。

本文将介绍这个古老的格式，并提供一个 .NET 上的简易解析器。

---

本文是两个部分的第二篇，前者是理解 OPML 格式，此篇是解析此格式：

- [概念篇](/post/using-opml-for-rss-migrating.html)
- [解析篇（本文）](/post/deserialize-opml-using-dotnet.html)

<div id="toc"></div>

## OPML 格式

在解析之前，最好先理解此格式的的元素组成和元素属性，所以如果你没有阅读 [概念篇](/post/using-opml-for-rss-migrating.html)，请先前往阅读。

## 创建适用于 RSS 的简易 OPML 模型

我们先为模型创建基类 `OpmlModel`。

为了方便在客户端应用中使用，可以使其继承自 `INotifyPropertyChanged`。

```csharp
namespace Walterlv.Rssman.Models
{
    public abstract class OpmlModel : NotificationObject
    {
        public void Deserialize(XElement element)
        {
            OnDeserializing(element);
        }

        protected abstract void OnDeserializing(XElement element);
    }
}
```

```csharp
namespace Walterlv.Rssman.Models
{
    public abstract class NotificationObject : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler PropertyChanged;

        [NotifyPropertyChangedInvocator]
        protected void SetValue<T>(ref T field, T value, [CallerMemberName] string propertyName = null)
        {
            if (Equals(field, value)) return;
            field = value;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        [NotifyPropertyChangedInvocator]
        protected void NotifyPropertyChanged([CallerMemberName] string propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
```

拿出我们关心的 `outline` 的属性来解析，于是有：

```csharp
namespace Walterlv.Rssman.Models
{
    [DebuggerDisplay("RssOutline {Text,nq}, {XmlUrl,nq}, Count={Children.Count,nq}")]
    public sealed class RssOutline : OpmlModel
    {
        private string _text;
        private OutlineType _type;
        private string _xmlUrl;
        private string _htmlUrl;

        public string Text
        {
            get => _text;
            set => SetValue(ref _text, value);
        }

        public OutlineType Type
        {
            get => _type;
            set => SetValue(ref _type, value);
        }

        public string XmlUrl
        {
            get => _xmlUrl;
            set => SetValue(ref _xmlUrl, value);
        }

        public string HtmlUrl
        {
            get => _htmlUrl;
            set => SetValue(ref _htmlUrl, value);
        }

        public bool HasChildren => Children.Any();

        public ObservableCollection<RssOutline> Children { get; } = new ObservableCollection<RssOutline>();

        protected override void OnDeserializing(XElement element)
        {
            // 等待编写解析代码。
        }
    }
}
```

还有表示 OPML 文档的模型：

```csharp
namespace Walterlv.Rssman.Models
{
    [DebuggerDisplay("RssOpml {Title,nq}, Count={Children.Count,nq}")]
    public sealed class RssOpml : OpmlModel
    {
        private string _title;

        public string Title
        {
            get => _title;
            set => SetValue(ref _title, value);
        }

        public ObservableCollection<RssOutline> Children { get; } = new ObservableCollection<RssOutline>();

        protected override void OnDeserializing(XElement element)
        {
            // 等待编写解析代码。
        }
    }
}
```

## 从 OPML 文档中解析出模型

在以上的模型代码中，我为基类留有 `OnDeserializing` 方法以供反序列化。

为了尽可能简化此博客的代码，参数我直接使用了 `XElement` 类型，以便在方法中使用 XPath 语法来解析。（当然，如果你是做库或者进行大型可维护项目的开发，这里就需要一些抽象了。）

现在，我们写一个新的静态类型 `Opml` 来解析 OPML 文档：

```csharp
namespace Walterlv.Rssman.Services
{
    public static class Opml
    {
        public static async Task<RssOpml> ParseAsync(Stream stream)
        {
            var document = await XDocument.LoadAsync(stream, LoadOptions.None, CancellationToken.None);
            var root = document.XPathSelectElement("opml");
            var opml = new RssOpml();
            opml.Deserialize(root);
            return opml;
        }
    }
}
```

于是，再补全模型 `RssOpml` 和 `RssOutline` 的反序列化部分：

```csharp
// RssOpml.cs
protected override void OnDeserializing(XElement element)
{
    var title = element.XPathSelectElement("head/title");
    Title = title?.Value;

    var outlines = element.XPathSelectElements("body/outline");
    Children.Clear();
    foreach (var value in outlines)
    {
        var outline = new RssOutline();
        outline.Deserialize(value);
        Children.Add(outline);
    }
}
```

```csharp
// RssOutline.cs
protected override void OnDeserializing(XElement element)
{
    var text = element.Attribute("text");
    Text = text?.Value;

    var type = element.Attribute("type");
    if (type != null && Enum.TryParse(type.Value, out OutlineType outlineType))
    {
        Type = outlineType;
    }

    var xmlUrl = element.Attribute("xmlUrl");
    XmlUrl = xmlUrl?.Value;

    var htmlUrl = element.Attribute("htmlUrl");
    HtmlUrl = htmlUrl?.Value;

    var outlines = element.XPathSelectElements("outline");
    Children.Clear();
    foreach (var value in outlines)
    {
        var outline = new RssOutline();
        outline.Deserialize(value);
        Children.Add(outline);
    }
}
```

注意，以上两个方法请分别填充到 `RssOpml.cs` 和 `RssOutline.cs` 的 `OnDeserializing` 方法中。

这里，所有的 XML 解析均使用的是 XPath 语法，关于 XPath 语法，可以阅读 [XML 的 XPath 语法 - walterlv](/post/xml-xpath.html)，关于如何使用 XPath 在 .NET 中读写 XML 文件，可以阅读 [.NET 使用 XPath 来读写 XML 文件 - walterlv](/post/read-write-xml-using-xpath-in-dotnet.html)。

## 使用此 OPML 模型

当你把这些类都准备好，那么你就可以使用简单的几句话来完成 OPML 文档的解析了。

在 UWP 应用中，可以通过 `StorageFile` 来打开一个文件流：

```csharp
var folder = Package.Current.InstalledLocation;
using (var stream = await folder.OpenStreamForReadAsync("sample-opml.xml"))
{
    var opml = await Opml.ParseAsync(stream);
    // 使用此 OPML 文档
}
```

在 .NET Framework 传统应用中，可以使用 `File.Read` 来打开一个文件流。

由于我们本文中创建的模型均实现了 `INotifyPropertyChanged` 接口，所以你甚至可以直接将 `Opml.ParseAsync` 的返回结果应用于绑定。
