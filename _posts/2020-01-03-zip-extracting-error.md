---
title: ".NET/C# 解压 Zip 文件时出现异常：System.IO.InvalidDataException: 找不到中央目录结尾记录。"
date: 2020-01-03 13:19:33 +0800
categories: dotnet csharp
position: problem
---

在解压 Zip 文件时出现异常：`System.IO.InvalidDataException: 找不到中央目录结尾记录。`。

其原因是所解压的文件并非 zip 文件。

---

<div id="toc"></div>

## 异常

在解压 Zip 文件时出现异常：

```
System.IO.InvalidDataException: 找不到中央目录结尾记录。
   在 System.IO.Compression.ZipArchive.ReadEndOfCentralDirectory()
   在 System.IO.Compression.ZipArchive.Init(Stream stream, ZipArchiveMode mode, Boolean leaveOpen)
   在 System.IO.Compression.ZipArchive..ctor(Stream stream, ZipArchiveMode mode, Boolean leaveOpen, Encoding entryNameEncoding)
   在 System.IO.Compression.ZipFile.Open(String archiveFileName, ZipArchiveMode mode, Encoding entryNameEncoding)
   在 System.IO.Compression.ZipFile.ExtractToDirectory(String sourceArchiveFileName, String destinationDirectoryName, Encoding entryNameEncoding)
   在 System.IO.Compression.ZipFile.ExtractToDirectory(String sourceArchiveFileName, String destinationDirectoryName)
```

## 原因

如果一个文件并非 zip 文件，那么在解压的时候就会出现此异常。例如，它下载不全，是损坏的；或者，它实际上是一个 rar 文件或者 7z 文件。

验证也非常简单，直接使用其他任何成熟的解压缩工具试着解压以下这个文件就可以。如果其他工具也不能解压，通常说明文件下载不全或者已损坏，或者下载的是一个被重定向了的 html 文件。如果其他工具能够正常解压，说明这可能是其他格式的压缩包，而不是 zip。
