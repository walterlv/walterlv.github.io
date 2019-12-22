---
title: "三值 bool? 进行与或运算后的结果"
date: 2019-01-06 20:52:33 +0800
categories: dotnet csharp
position: knowledge
---

`bool?` 实际上是 `Nullable<Boolean>` 类型，可以当作三值的 `bool` 类型来使用。不过三值的布尔进行与或运算时的结果与二值有什么不同吗？

---

<div id="toc"></div>

## 重载条件逻辑运算符“与”（&&）“或”（||）

在 [C# 重载条件逻辑运算符（&& 和 ||）](/post/overload-conditional-and-and-or-operators-in-csharp) 一文中我说明了如何重载条件逻辑运算符 `&&` 和 `||`。

这两个运算符不能直接重载，但可以通过重载 `&` 和 `|` 运算符来间接完成。

对于 `bool?`，重载了这样两个运算符：

- `bool? operator &(bool? x, bool? y)`
- `bool? operator |(bool? x, bool? y)`

于是我们可以得到三值 `bool?` 的与或结果。

## 三值 bool? 的与或结果

| `x`     | `y`     | `x&y`   | `x|y`   |
| ------- | ------- | ------- | ------- |
| `true`  | `true`  | `true`  | `true`  |
| `true`  | `false` | `false` | `true`  |
| `true`  | `null`  | `null`  | `true`  |
| `false` | `true`  | `false` | `true`  |
| `false` | `false` | `false` | `false` |
| `false` | `null`  | `false` | `null`  |
| `null`  | `true`  | `null`  | `true`  |
| `null`  | `false` | `false` | `null`  |
| `null`  | `null`  | `null`  | `null`  |

---

**参考资料**

- [Using nullable types - C# Programming Guide - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/nullable-types/using-nullable-types)
