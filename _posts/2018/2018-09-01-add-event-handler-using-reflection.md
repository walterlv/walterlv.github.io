---
title: ".NET/C# 使用反射注册事件"
date: 2018-09-01 20:31:24 +0800
tags: dotnet csharp
coverImage: /static/posts/2018-09-01-20-08-33.png
---

使用反射，我们可以很容易地在运行时调用一些编译时无法确定的属性、方法等。那么如何注册事件呢？

本文将介绍如何使用反射注册事件。

---

<div id="toc"></div>

## 不使用反射

例如，我们希望反射的类型是这样的：

```csharp
public class Walterlv
{
    public event EventHandler BlogPublished;
}
```

那么只需要使用如下代码即可完成事件的注册：

```csharp
var walterlv = new Walterlv();
walterlv += Walterlv_BlogPublished;
```

```csharp
public void Walterlv_BlogPublished(object sender, EventHandler handler)
{
}
```

## 使用反射

而如果使用反射，则是：

```csharp
var walterlv = new Walterlv();
var eventInfo = typeof(Walterlv).GetEvent(nameof(BlogPublished));
var handler = new EventHandler(Walterlv_BlogPublished);
eventInfo.AddEventHandler(walterlv, handler);
```

当然，实际使用的时候，如果能访问到 `Walterlv` 类型，当然也不会去用到反射，所以通常情况是这样的：

```csharp
public void AddHandler<T>(T instance, string eventName, EventHandler handler)
{
    var eventInfo = instance.GetType().GetEvent(eventName);
    eventInfo.AddEventHandler(instance, handler);
}
```

## 安全地使用反射

虽然以上方式使用了反射成功注册了事件，但实际上我们的参数中传入了一个特定类型的委托 `EventHandler`。实际上事件的委托种类非常多。

在委托中，即便签名完全相同，也不是同一个委托类型。如果传入的参数类型改为 `EventHandler<EventArgs>`，或者 `BlogPublished` 事件的类型改为 `EventHandler<EventHandler>`，虽然实际上这两个委托的签名是兼容的，但其委托类型不同，依然是不能互相转换的。你会在运行时遇到一下异常：

![委托无法转换](/static/posts/2018-09-01-20-08-33.png)  
▲ 委托无法转换

所以我们必须有一些更安全的方式来注册事件。

正常情况下，我们转换一个签名兼容的委托是使用构造函数：

```csharp
public EventHandler ConvertDelegate(EventHandler<EventArgs> handler)
{
    return new EventHandler(handler);
}
```

那么在反射中，我们需要使用 `Delegate.CreateDelegate` 创建指定类型的委托。

```csharp
public void AddHandler<T>(T instance, string eventName)
{
    var eventInfo = instance.GetType().GetEvent(eventName);
    var methodInfo = GetType().GetMethod(nameof(Walterlv_BlogPublished));
    var @delegate = Delegate.CreateDelegate(eventInfo.EventHandlerType, this, methodInfo);
    eventInfo.AddEventHandler(instance, @delegate);
}

public void Walterlv_BlogPublished(object sender, EventHandler handler)
{
}
```

这里，`Delegate.CreateDelegate` 的作用就是执行委托类型的转换。我在 [.NET Core/Framework 创建委托以大幅度提高反射调用的性能](/post/create-delegate-to-improve-reflection-performance) 中也提到过这个方法。

---

**参考资料**

- [c# - AddEventHandler using reflection - Stack Overflow](https://stackoverflow.com/a/1121489/6233938)

