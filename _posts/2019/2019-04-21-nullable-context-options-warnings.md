---
title: "C# 8.0 可空引用类型中的各项警告/错误的含义和示例代码"
publishDate: 2019-04-21 20:23:30 +0800
date: 2019-11-24 18:59:48 +0800
categories: csharp visualstudio msbuild
position: knowledge
---

C# 8.0 引入了可为空引用类型和不可为空引用类型。当你需要给你或者团队更严格的要求时，可能需要定义这部分的警告和错误级别。

本文将介绍 C# 可空引用类型部分的警告和错误提示，便于进行个人项目或者团队项目的配置。

---

<div id="toc"></div>

## 开启可空引用类型以及配置警告和错误

本文的内容本身没什么意义，但如果你试图进行一些团队配置，那么本文的示例可能能带来一些帮助。

- [C# 8.0 如何在项目中开启可空引用类型的支持 - 吕毅](/post/how-to-enable-nullable-reference-types.html)
- [C# 可空引用类型 NullableReferenceTypes 更强制的约束：将警告改为错误 WarningsAsErrors - 吕毅](/post/warning-as-errors-for-csharp-nullable-reference-types.html)

## 警告和错误

### `CS8600`

将 null 文本或可能的 null 值转换为非 null 类型。

```csharp
string walterlv = null;
```

![CS8600](/static/posts/2019-04-21-20-07-16.png)

### `CS8601`

可能的 null 引用赋值。

```csharp
string Text { get; set; }

void Foo(string? text)
{
    // 将可能为 null 的文本向不可为 null 的类型赋值。
    Text = text;
}
```

### `CS8602`

null 引用可能的取消引用。

```csharp
// 当编译器判定 walterlv 可能为 null 时才会有此警告。
var value = walterlv.ToString();
```

![CS8602](/static/posts/2019-04-21-20-08-52.png)

### `CS8603`

可能的 null 引用返回。

```csharp
string Foo()
{
    return null;
}
```

![CS8603](/static/posts/2019-04-21-20-12-35.png)

### `CS8604`

将可能为 `null` 的引用作为参数传递到不可为 `null` 的方法中：

```csharp
void Foo()
{
    string text = GetText();;
    Bar(text);
}

string? GetText()
{
    return null;
}
```

### `CS8616`

接口中定义的成员中的 null 性与实现中成员的 null 型不匹配。

比如你的接口中不允许为 null，但是实现中却允许为 null。

### `CS8618`

未初始化不可以为 null 的字段 "_walterlv"。

如果一个类型中存在不可以为 null 的字段，那么需要在构造函数中初始化，如果没有初始化，则会发出警告或者异常。

### `CS8619`

一个类型与构造这个类型的 null 性不匹配。

例如：

```csharp
Task<object?> foo = new Task<object>(() => new object());
```

### `CS8622`

委托定义的参数中引用类型的为 null 性与目标委托不匹配。

比如你定义了一个委托：

```csharp
void Foo(object? sender, EventArgs e);
```

然而在订阅事件的时候，使用的函数 null 性不匹配，则会出现警告：

```csharp
void OnFoo(object sender, EventArgs e)
{
    // 注意到这里的 object 本应该写作 object?
}
```

### `CS8625`

无法将 null 文本转换为非 null 引用或无约束类型参数。

```csharp
void Foo(string walterlv = null)
{
}
```

![CS8625](/static/posts/2019-04-21-20-10-39.png)

### `CS8653`

对于泛型 T，使用 `default` 设置其值。如果 T 是引用类型，那么 `default` 就会将这个泛型类型赋值为 `null`。然而并没有将泛型 T 的使用写为 T?。
