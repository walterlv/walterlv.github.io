---
title: "详解 .NET 反射中的 BindingFlags 以及常用的 BindingFlags 使用方式"
date: 2019-03-10 14:51:00 +0800
categories: dotnet csharp
position: knowledge
published: false
---

使用 .NET 的反射 API 时，通常会要求我们传入一个 `BindingFlags` 参数用于指定反射查找的范围。不过如果对反射不熟的话，第一次写反射很容易写错导致找不到需要的类型成员。

本文介绍 `BindingFlags` 中的各个枚举标记的含义、用途，以及常用的组合使用方式。

---

<div id="toc"></div>

### 所有的 BindingFlags

默认值：

```csharp
// 默认值
Default
```

这些标记用于反射的时候查找类型成员：

```csharp
// 表示查找的时候，需要忽略大小写。
IgnoreCase

// 仅查找此特定类型中声明的成员，而不会包括这个类继承得到的成员。
DeclaredOnly

// 仅查找类型中的实例成员。
Instance

// 仅查找类型中的静态成员。
Static

// 仅查找类型中的公共成员。
Public

// 仅查找类型中的非公共成员（internal protected private）
NonPublic

// 会查找此特定类型继承树上得到的静态成员。但仅继承公共（public）静态成员和受保护（protected）静态成员；不包含私有静态成员，也不包含嵌套类型。
FlattenHierarchy
```

这些标记用于为 `InvokeMember` 方法提供参数，告知应该如何反射调用一个方法：

```csharp
// 调用方法。
InvokeMethod

// 创建实例。
CreateInstance

// 获取字段的值。
GetField

// 设置字段的值。
SetField

// 获取属性的值。
GetProperty

// 设置属性的值。
SetProperty
```

这些标记用于为 `InvokeMember` 方法提供参数，但是仅在调用一个 COM 组件的时候才应该使用：


```csharp
PutDispProperty
PutRefDispProperty
```
 
```csharp
ExactBinding = 0x010000,    // Bind with Exact Type matching, No Change type
SuppressChangeType = 0x020000,
```
 
```csharp
// DefaultValueBinding will return the set of methods having ArgCount or 
//    more parameters.  This is used for default values, etc.
OptionalParamBinding = 0x040000,
```
 
```csharp
// These are a couple of misc attributes used
IgnoreReturn = 0x01000000,  // This is used in COM Interop
DoNotWrapExceptions = 0x02000000, // Disables wrapping exceptions in TargetInvocationException
```


### 你可能会有的疑问

1. 如果 A 程序集对 B 程序集内部可见（`InternalsVisibleTo("B")`），那么 B 在反射查找 A 的时候，`internal` 成员的查找应该使用 `Public` 还是 `NonPublic` 标记呢？
    - 依然是 `NonPublic` 标记。
    - 因为反射的是程序集的元数据，这是静态的数据，跟运行时状态是无关的。

### 常用的组合


### 附 BindingFlags 的源码

```csharp
[Flags]
public enum BindingFlags
{
    // NOTES: We have lookup masks defined in RuntimeType and Activator.  If we
    //    change the lookup values then these masks may need to change also.

    // a place holder for no flag specifed
    Default = 0x00,

    // These flags indicate what to search for when binding
    IgnoreCase = 0x01,          // Ignore the case of Names while searching
    DeclaredOnly = 0x02,        // Only look at the members declared on the Type
    Instance = 0x04,            // Include Instance members in search
    Static = 0x08,              // Include Static members in search
    Public = 0x10,              // Include Public members in search
    NonPublic = 0x20,           // Include Non-Public members in search
    FlattenHierarchy = 0x40,    // Rollup the statics into the class.

    // These flags are used by InvokeMember to determine
    // what type of member we are trying to Invoke.
    // BindingAccess = 0xFF00;
    InvokeMethod = 0x0100,
    CreateInstance = 0x0200,
    GetField = 0x0400,
    SetField = 0x0800,
    GetProperty = 0x1000,
    SetProperty = 0x2000,

    // These flags are also used by InvokeMember but they should only
    // be used when calling InvokeMember on a COM object.
    PutDispProperty = 0x4000,
    PutRefDispProperty = 0x8000,

    ExactBinding = 0x010000,    // Bind with Exact Type matching, No Change type
    SuppressChangeType = 0x020000,

    // DefaultValueBinding will return the set of methods having ArgCount or 
    //    more parameters.  This is used for default values, etc.
    OptionalParamBinding = 0x040000,

    // These are a couple of misc attributes used
    IgnoreReturn = 0x01000000,  // This is used in COM Interop
    DoNotWrapExceptions = 0x02000000, // Disables wrapping exceptions in TargetInvocationException
}
```

---

#### 参考资料

- [BindingFlags.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/Reflection/BindingFlags.cs)
