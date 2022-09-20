---
title: "使用 AutoMapper 自动映射模型时，处理不同模型属性缺失的问题"
date: 2022-09-20 20:30:02 +0800
categories: dotnet csharp
position: starter
---

使用 `AutoMapper` 可以很方便地在不同的模型之间进行转换而减少编写太多的转换代码。不过，如果各个模型之间存在一些差异的话（比如多出或缺少一些属性），简单的配置便不太行。本文帮助你解决这个问题。

---

关于 AutoMapper 的系列文章：

- [使用 AutoMapper 自动在多个数据模型间进行转换](/post/convert-models-using-auto-mapper)
- [使用 AutoMapper 自动映射模型时，处理不同模型属性缺失的问题](/post/convert-models-using-auto-mapper-with-property-missing)

<div id="toc"></div>

## 属性增加或减少

前面我们所有的例子都是在处理要映射的类型其属性都一一对应的情况。然而，如果所有的属性都是一样的，那我们为什么还要定义多个属性类型呢（`Attribute` 不一样除外）。正常的开发情况下这些实体类型都会是大部分相同，但也有些许差异的情况。

现在，我们稍微改动一下我们的数据模型，给其中一个增加一个新属性 `Description`：

```csharp
public class Walterlv1Dao
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public List<FriendDao>? Friend { get; set; }
}
public class Walterlv1Vo
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public List<FriendVo>? Friend { get; set; }
}
```

如果使用一下代码对上述两个模型进行映射，非常需要注意映射方向：

```csharp
static IMapper InitializeMapper()
{
    var configuration = new MapperConfiguration(cfg =>
    {
        cfg.CreateMap<Walterlv1Dao, Walterlv1Vo>();
    });
#if DEBUG
    configuration.AssertConfigurationIsValid();
#endif
    var mapper = configuration.CreateMapper();
    return mapper;
}
```

这里，我们设定从 `Walterlv1Dao` 映射到 `Walterlv1Vo` 是正常的，因为前者比后者多出了一些属性。但反过来却不行，如果反过来写，我们将收到一个异常 `AutoMapper.AutoMapperConfigurationException`：

```csharp
cfg.CreateMap<Walterlv1Vo, Walterlv1Dao>();
```

```
Unmapped members were found. Review the types and members below.
Add a custom mapping expression, ignore, add a custom resolver, or modify the source/destination type
For no matching constructor, add a no-arg ctor, add optional arguments, or map all of the constructor parameters
==============================================================================================
Walterlv1Vo -> Walterlv1Dao (Destination member list)
Walterlv.Demo.AutoMapping.Models.Walterlv1Vo -> Walterlv.Demo.AutoMapping.Models.Walterlv1Dao (Destination member list)

Unmapped properties:
Description
```

如果确实希望反过来映射，那么应该使用正向映射之后，再将其反向：

```csharp
cfg.CreateMap<Walterlv1Dao, Walterlv1Vo>().ReverseMap();
```

---

**参考资料**

- [AutoMapper/AutoMapper: A convention-based object-object mapper in .NET.](https://github.com/AutoMapper/AutoMapper)
