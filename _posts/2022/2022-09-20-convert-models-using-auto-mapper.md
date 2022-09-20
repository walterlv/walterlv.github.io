---
title: "使用 AutoMapper 自动在多个数据模型间进行转换"
date: 2022-09-20 19:51:25 +0800
categories: dotnet csharp
position: starter
---

访问数据库、IPC 通信、业务模型、视图模型……对于同一个业务的同一种数据，经常会使用多种数据模型工作在不同的代码模块中。这时它们之间的互相转换便是大量的重复代码了。

使用 `AutoMapper` 便可以很方便地在不同的模型之间进行转换而减少编写太多的转换代码（如果这一处的代码对性能不太敏感的话）。

---

<div id="toc"></div>

## 安装 AutoMapper 库

这是 AutoMapper 的官方 GitHub 仓库：

- [AutoMapper/AutoMapper: A convention-based object-object mapper in .NET.](https://github.com/AutoMapper/AutoMapper)

安装 AutoMapper 的 NuGet 包即可在项目中使用 AutoMapper。

## 入门

以下是一个最简单的控制台演示程序的代码。

```csharp
// Program.cs
var mapper = InitializeMapper();

var dao = new Walterlv1Dao
{
    Id = "2ed3558ac938438fb2c1d2de71d7bb90",
    Name = "walterlv",
    Text = "blog.walterlv.com",
};
var vo = mapper.Map<Walterlv1Vo>(dao);
Console.WriteLine($"Name = {vo.Name}, Text = {vo.Text}");

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

在这段代码中：

1. 我们定义了一个方法 `InitializeMapper`，在里面初始化 `IMapper` 的新实例。
    - 初始化 `MapperConfiguration`，定义类型的映射关系
    - 在 `DEBUG` 下验证 `MapperConfiguration` 的映射是否正确
    - 创建一个 `IMapper` 的映射器，用于后续映射使用
2. 我们初始化了一个 `Walterlv1Dao` 类的实例
3. 我们调用 `mapper.Map` 将其映射到 `Walterlv1Vo` 类型

这两个类型的定义如下（虽然无关紧要）。

```csharp
public class Walterlv1Dao
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Text { get; set; }
}
public class Walterlv1Vo
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Text { get; set; }
}
```

如果你的应用程序中会使用到依赖注入，那么只需要把拿到的 `IMapper` 加入即可。

如果希望两个类型之间能够双向映射，那么在初始化 `IMapper` 的时候也应该双向写两遍，否则就会抛出异常 `AutoMapper.AutoMapperMappingException:“Missing type map configuration or unsupported mapping.”`。

```csharp
cfg.CreateMap<Walterlv1Dao, Walterlv1Vo>();
cfg.CreateMap<Walterlv1Vo, Walterlv1Dao>();
```

## 复杂类型和集合

现在，我们让模型稍复杂一些：

```csharp
public class Walterlv1Dao
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public FriendDao? Friend { get; set; }
}
public class FriendDao
{
    public string? Id { get; set; }
    public string? Name { get; set; }
}
public class Walterlv1Vo
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public FriendVo? Friend { get; set; }
}
public class FriendVo
{
    public string? Id { get; set; }
    public string? Name { get; set; }
}
```

AutoMapper 能处理这样的属性嵌套情况，只需要设置嵌套类型也能映射即可：

```csharp
cfg.CreateMap<Walterlv1Dao, Walterlv1Vo>();
cfg.CreateMap<Walterlv1Vo, Walterlv1Dao>();
cfg.CreateMap<FriendDao, FriendVo>();
cfg.CreateMap<FriendVo, FriendDao>();
```

如果两个模型中子模型的类型是一样的，那么只会进行简单的赋值，而不会创建新的对象。

例如上面例子里，如果 `FriendDao` 和 `FriendVo` 合并成 `Friend` 类型，两个类型都使用这个合并的类型，那么映射之后，`Friend` 将是同一个对象。

除了复杂类型，列表也是可以的：

```csharp
public class Walterlv1Dao
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public List<FriendDao>? Friend { get; set; }
}
public class Walterlv1Vo
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public List<FriendVo>? Friend { get; set; }
}
```

---

**参考资料**

- [AutoMapper/AutoMapper: A convention-based object-object mapper in .NET.](https://github.com/AutoMapper/AutoMapper)
