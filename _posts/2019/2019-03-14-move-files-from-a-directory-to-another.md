---
title: "C#/.NET 移动或重命名一个文件夹（如果存在，则合并而不是出现异常报错）"
date: 2019-03-14 22:46:56 +0800
categories: dotnet csharp
position: problem
---

.NET 提供了一个简单的 API 来移动一个文件夹 `Directory.Move(string sourceDirName, string destDirName)`。不过如果你稍微尝试一下这个 API 就会发现其实相当不实用。

---

在使用 `Directory.Move(string sourceDirName, string destDirName)` 这个 API 来移动文件夹的时候，比如我们需要将 A 文件夹移动成 B 文件夹（也可以理解成重命名成 B）。

一旦 B 文件夹是存在的，那么这个时候会抛出异常。

![抛出了异常](/static/posts/2019-03-14-22-42-34.png)

然而实际上我们可能希望这两个文件夹能够合并。

.NET 的 API 没有原生提供合并两个文件夹的方法，所以我们需要自己实现。

方法是递归遍历里面的所有文件，然后将源文件夹中的文件依次移动到目标文件夹中。为了应对复杂的文件夹层次结构，我写的方法中也包含了递归。

```csharp
private static void MoveDirectory(string sourceDirectory, string targetDirectory)
{
    MoveDirectory(crashFolder, crashFolder + ".bak", 0);

    void MoveDirectory(string source, string target, int depth)
    {
        if (!Directory.Exists(source))
        {
            return;
        }

        if (!Directory.Exists(target))
        {
            Directory.CreateDirectory(target);
        }

        var sourceFolder = new DirectoryInfo(source);
        foreach (var fileInfo in sourceFolder.EnumerateFiles("*", SearchOption.TopDirectoryOnly))
        {
            var targetFile = Path.Combine(target, fileInfo.Name);

            if (File.Exists(targetFile))
            {
                File.Delete(targetFile);
            }

            File.Move(fileInfo.FullName, targetFile);
        }

        foreach (var directoryInfo in sourceFolder.EnumerateDirectories("*", SearchOption.TopDirectoryOnly))
        {
            var back = string.Join('\\', Enumerable.Repeat("..", depth));
            MoveFolder(directoryInfo.FullName,
                Path.GetFullPath(Path.Combine(target, back, directoryInfo.Name)), depth + 1);
        }

        Directory.Delete(source);
    }
}
```

`depth` 是一个整型，表示递归深度。我在计算文件需要移动到的新文件夹的路径的时候，需要使用到这个递归深度，以便回溯到最开始需要移动的那个文件夹上。
