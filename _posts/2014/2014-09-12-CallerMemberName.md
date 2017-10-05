---
layout: post
title:  "CallerMemberName"
date:   2014-09-12 10:19:00 +0800
categories: dotnet
permalink: /dotnet/2014/09/12/CallerMemberName.html
---

从 .NET Framework 4.5 开始，有了几个快速获取调用方信息的 Attribute。

---

| Attribute | 描述 |
|---|---|
| CallerMemberName | 允许您打算调用方的方法或属性名称传递给方法。 |
| CallerLineNumber | 允许您打算在调用方法的源文件中的行号。 |
| CallerFilePath | 允许您获取包含调用方源文件的完整路径。这是文件路径在生成时。 |

这样，在实现用于 XAML 绑定的类型中，可以更方便更高效地进行属性更改通知。

```csharp
[NotifyPropertyChangedInvocator]
protected virtual void OnPropertyChanged([CallerMemberName] string propertyName = null)
{
    PropertyChangedEventHandler handler = PropertyChanged;
    if (handler != null) handler(this, new PropertyChangedEventArgs(propertyName));
}
```

当使用 OnPropertyChanged() 句子调用以上方法时，参数 propertyName 会被自动赋值。

```csharp
protected bool SetProperty<T>(ref T storage, T value, [CallerMemberName] string propertyName = null)
{
    if (Equals(storage, value)) return false;

    storage = value;
    OnPropertyChanged(propertyName);
    return true;
}
```

可在类型中添加以上方法，使得属性更改变得更加简单：

```csharp
private string _notifyMessage;
public string Notification
{
    get { return _notifyMessage; }
    set { SetProperty(ref _notifyMessage, value); }
}
```

详细信息可阅读：  
[Using CallerMemberName for property change notification in XAML apps](http://10rem.net/blog/2013/02/25/using-callermembername-for-property-change-notification-in-xaml-apps)
