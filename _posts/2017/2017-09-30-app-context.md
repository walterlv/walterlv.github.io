---
layout: post
title: "用 AppContext 解决类库的更新兼容问题"
date: 2017-09-30 23:45:25 +0800
categories: dotnet
permalink: /post/dotnet/2017/09/30/app-context.html
keywords: dotnet AppContext
---

还记得微软在 [Mitigation: Pointer-based Touch and Stylus Support](https://docs.microsoft.com/en-us/dotnet/framework/migration-guide/mitigation-pointer-based-touch-and-stylus-support) 中告诉大家如何在 .Net Framework 4.7 中迁移 WPF 的触控到基于 Pointer 消息？记得关键的 `<AppContextSwitchOverrides value="Switch.System.Windows.Input.Stylus.EnablePointerSupport=true"/>` 这一句吗？

有没有好奇为何这一句话能用来控制微软基础类库中某一块功能的行为呢？阅读本文将了解微软为开发者提供的一套类库更新的兼容性解决方案——`AppContext`。

---

这是微软自 .Net Framework 4.6 开始为开发者们提供的方案。

比如你打算为你的类库增加了一个功能——指定一个文件夹名称用于存放文件。你写出了这样的代码：

```csharp
// 1.0 版本的类库
public static class StorageSomeInfo
{
    public static void SetDirectoryName(string directoryName)
    {
        _directory = directoryName ?? throw new ArgumentNullException(nameof(directoryName));
        // 其他逻辑。
    }
}
```

### 故事背景

你将类库发布到 NuGet 上，一切运行安好。

直到有一天，某人给 `directoryName` 传入了空字符串。结果你的文件全部都不再存到指定的文件夹下，而是存到了根目录……这跟你的预期不符啊！

然而，类库发布了这么久，这么多人都下载安装使用了，要是随随便便把代码改成这样，搞不好一大堆小伙伴将面临着崩溃……（谁知道他们有没有依赖于你的 BUG 编程呢？搞不好他们绞尽脑汁发现这样还可以存到根目录呢于是就开开心心地用了呢！）

```csharp
// 2.0 版本的类库
public static class StorageSomeInfo
{
    public static void SetDirectoryName(string directoryName)
    {
        if (string.IsNullOrWhitespace(directoryName))
            throw new ArgumentException(nameof(directoryName));
        // 其他逻辑。
    }
}
```

`[Obsolete]` 是一个好方案，他能够指导开发者一步步迁移他们对 API 的使用。不过：

1. 如果调用的代码太多了，迁移起来就是个痛苦的差事儿。
1. 难得取了个好名字，要知道取名字可是编程中最难的事儿之一啊！
1. 更多的开发者们其实根本没意识到你写出了这个坑，于是凭什么让他们升级 API？！

---

### 使用 AppContext

这时候祭出——`AppContext`！

将你的 2.0 代码改成这样：

```csharp
// 2.0 版本的类库
public static class StorageSomeInfo
{
    public static void SetDirectoryName(string directoryName)
    {
        if (AppContext.TryGetSwitch("Switch.StorageSomeInfo.UseLegacyDirectoryName", out var flag)
            && flag == true)
            // 跑以前的代码
        else
            // 跑新的代码
         
        // 其他逻辑。
    }
}
```

那么开发者们更新你的类库时，就有可以挽回的方案了：

1. 如果开发者们没有遇到什么问题，那么恭喜你那位开发者很幸运没有踩到你的坑，你平滑迁移过去了！
1. 如果开发者们遇到了根目录问题，那么你的更新日志中的指导说明将起作用。

你可以在更新日志中写下说明：

> 1. 建议开发者们修改此方法的调用，避免写出错误的代码；
> 1. 如果开发者们很难改动这样的代码，可以要求开发者在 `app.config` 文件中添加以下代码以使用“遗弃的”逻辑。

> ```xml
> <configuration>  
>    <runtime>  
>       <AppContextSwitchOverrides value="Switch.StorageSomeInfo.UseLegacyDirectoryName=true" />   
>    </runtime>  
> </configuration>  
> ```

---

### 更多 AppContext 的信息

开发者们如果有多个开关需要开启或关闭，则使用分号分隔多个开关：

```xml
<AppContextSwitchOverrides value="switchName1=value1;switchName2=value2" /> 
```

开发者们如果不想写配置文件，也可以直接在程序中调用：

```csharp
AppContext.SetSwitch(string, bool);
```

当然，甚至可以直接动用注册表：`HKLM\SOFTWARE\Microsoft\.NETFramework\AppContext` 作为 Key，字符串作为 Value。依然是分号分割的键值对作为注册表项的值来存。如果采用注册表方案，将影响这台计算机上运行的所有程序。

这三种方式的优先级是：

1. 代码中直接调用的优先级最高；
1. 在 `app.config` 中指定的优先级其次；
1. 在注册表中指定的优先级最低。

### 一点坑

在从 .Net Framework 4.6 升级到 4.7 后，注册表的方式貌似失效了。参考：[FIX: AppContext switch overrides are not applied to applications that run on the .NET Framework 4.7](https://support.microsoft.com/en-us/help/4036977/fix-appcontext-switch-overrides-are-not-applied-to-applications-that-r)
