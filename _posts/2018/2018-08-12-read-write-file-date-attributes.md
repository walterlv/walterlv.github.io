---
title: "C#/.NET 读取或修改文件的创建时间和修改时间"
date: 2018-08-12 19:44:24 +0800
tags: windows dotnet csharp
coverImage: /static/posts/2018-08-12-19-29-03.png
permalink: /posts/read-write-file-date-attributes.html
---

手工在博客中添加 Front Matter 文件头可是个相当费事儿的做法，这种事情就应该自动完成。

.NET 中提供了非常方便的修改文件创建时间的方法，使用这种方法，能够帮助自动完成一部分文件头的编写或者更新。

---

<div id="toc"></div>

## 相关类型

.NET 中提供了两个不同的设置创建和修改时间的入口：

- `File` 静态类
- `FileInfo` 类

![File 类的时间方法](/static/posts/2018-08-12-19-29-03.png)  
▲ File 静态类的方法

![FileInfo 类的时间方法](/static/posts/2018-08-12-19-30-17.png)  
▲ FileInfo 类的方法

很明显，使用 `FileInfo` 类可以使用属性直接获取和赋值，用法上会比 `File` 方便，不过需要一个 `FileInfo` 的实例。

## 修改时间

我期待能够读取文件的创建和修改时间来获知博客文章的发布和修改时间。不过在此之前，我需要先根据 Markdown 文件元数据更新文件时间。

```csharp
private void FixFileDate(FileInfo file, DateTimeOffset createdTime, DateTimeOffset modifiedTime)
{
    // 更改文件的创建时间。
    file.CreationTimeUtc = createdTime.UtcDateTime;
    // 更改文件的更新时间。
    file.LastWriteTimeUtc = modifiedTime.UtcDateTime;
    // 更改文件最近一次访问的时间。
    file.LastAccessTimeUtc = DateTimeOffset.Now.UtcDateTime;
}
```

至于如何获取 Markdown 文件元数据中的时间，可以使用 [YamlDotNet](https://www.nuget.org/packages/YamlDotNet/)（当然，需要自己提取 YAML 元数据头）。

## 读取时间

当此后需要使用文件的创建时间来更新 YAML 元数据时，只需要读取这几个属性即可。

```csharp
UpdateMetaTime(file, file.CreationTimeUtc, file.LastWriteTimeUtc);

void UpdateMetaTime(FileInfo file, DateTimeOffset publishDate, DateTimeOffset date)
{
    var publishDateString =  date.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss zz");
    var dateString =  date.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss zz");
    // 省略更新 YAML 元数据。
}
```

## 关于 UTC 时间

也许你注意到以上我使用的时间类型都是 `DateTimeOffset` 而不是 `DateTime`，这是因为 `DateTimeOffset` 中记录了时区信息，不至于在使用的过程中丢掉时区信息，出现重复时间转换，发生时间错误。


