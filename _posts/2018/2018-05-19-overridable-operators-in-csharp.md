---
title: "C# 中那些可以被重载的操作符，以及使用它们的那些丧心病狂的语法糖"
date: 2018-05-19 23:20:52 +0800
categories: csharp
---

C# 中的操作符重载并不新鲜。然而，到底有哪些操作符可以重载，重载操作符可以用来做哪些丧心病狂的事情呢？

本文收集了 C# 中所有可以重载的操作符，并且利用他们做了一些丧心病狂的语法糖。

---

<div id="toc"></div>

### 可以重载的操作符

操作符的重载比想象中的更加强大。因为——重载操作符时可以随意定义操作符中操作数的数据类型和返回值的类型。

是的！**不只是操作数，连返回值类型也能被重载**！

#### 一元操作符

`+`, `-`, `!`, `~`, `++`, `--`, `true`, `false`

通过重载这些操作符，你可以改变某种类型操作后的返回类型和返回值。

不过，等等！`+` 和 `-` 怎么会是一元操作符？不要忘了正数和负数哦！`+5`，`-6` 这些其实是在使用一元操作符，而不是单纯的整数哦。

`true` 和 `false` 也能被重载？是的，重载之后，你可以改变 `if(foo)` 这样的判断的行为。参见：[C# 很少人知道的科技](https://lindexi.gitee.io/post/C-%E5%BE%88%E5%B0%91%E4%BA%BA%E7%9F%A5%E9%81%93%E7%9A%84%E7%A7%91%E6%8A%80.html)。

#### 二元操作符

`+`, `-`, `*`, `/`, `%`, `&`, `|`, `~`, `^`, `<<`, `>>`

其中 `~` 操作符的重载是微软操作符重载部分的官方文档中并没有提及的。不过 Avalonia 项目利用这个不怎么常用的运算符做出了丧心病狂的绑定语法糖。参见 [Avalonia/Popup.cs at master · AvaloniaUI/Avalonia](https://github.com/AvaloniaUI/Avalonia/blob/master/src/Avalonia.Controls/Primitives/Popup.cs)。

```csharp
_popupRoot = new PopupRoot(DependencyResolver)
{
    [~ContentControl.ContentProperty] = this[~ChildProperty],
    [~WidthProperty] = this[~WidthProperty],
    [~HeightProperty] = this[~HeightProperty],
    [~MinWidthProperty] = this[~MinWidthProperty],
    [~MaxWidthProperty] = this[~MaxWidthProperty],
    [~MinHeightProperty] = this[~MinHeightProperty],
    [~MaxHeightProperty] = this[~MaxHeightProperty],
};
```

#### 必须成对重载的操作符

`==`, `!=`, `<`, `>`, `<=`, `>=`

其实成对重载并不是什么很大的限制，大不了都写了就行。不过，重载它们依然能写出强大的语法糖代码来。

#### 虽不可被重载，却能被定义的操作符

索引器 `[]`, 显示转换或隐式转换 `(T) x`

前面 Avalonia 的绑定语法糖就充分利用了索引器的特点，使得能够在对象初始化器中初始化那些本没有直接定义在类型中的属性。

### 虽不可被重载，却能够被间接重载的操作符

`+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `|=`, `^=`, `<<=`, `>>=`

这些操作符不可被重载。不过，其实它们都算作是原本的二元操作符与赋值操作的组合。所以，可以通过重载二元操作符来达到间接重载这些操作符。（当然，这样的方式，其赋值的作用是绝对丢不掉的）。

### 不可被重载的操作符

`=`, `.`, `?:`, `??`, `->`, `=>`, `as`, `checked`, `unchecked`, `default`, `delegate`, `is`, `new`, `sizeof`, `typeof`

---

#### 参考资料

- [Overloadable Operators (C# Programming Guide) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/statements-expressions-operators/overloadable-operators)
