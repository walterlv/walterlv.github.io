---
title: "在 MSBuild 编译过程中操作文件和文件夹（检查存在/创建文件夹/读写文件/移动文件/复制文件/删除文件夹）"
publishDate: 2019-12-26 19:10:17 +0800
date: 2019-12-26 19:47:26 +0800
categories: msbuild dotnet
position: knowledge
---

本文整理 MSBuild 在编译过程中对文件和文件夹处理的各种自带的编译任务（Task）。

---

<div id="toc"></div>

## `Exists` 检查文件存在

使用 `Exists` 可以判断一个文件或者文件夹是否存在。注意无论是文件还是文件夹，只要给定的路径存在就返回 `true`。可以作为 MSBuild 属性、项和编译任务的执行条件。

```xml
<PropertyGroup Condition=" Exists( '$(MSBuildThisFileDirectory)..\build\build.xml' ) ">
    <_WalterlvPackingDirectory>$(MSBuildThisFileDirectory)..\bin\$(Configuration)\</_WalterlvPackingDirectory>
</PropertyGroup>
```

## `MakeDir` 创建文件夹

下面的例子演示创建一个文件夹：

```xml
<Target Name="_WalterlvCreateDirectoryForPacking">
    <MakeDir Directories="$(MSBuildThisFileDirectory)..\bin\$(Configuration)\" />
</Target>
```

下面是使用到 `MakeDir` 全部属性的例子，将已经成功创建的文件夹提取出来。

```xml
<Target Name="_WalterlvCreateDirectoryForPacking">
    <MakeDir Directories="$(MSBuildThisFileDirectory)..\bin\$(Configuration)\">
        <Output TaskParameter="DirectoriesCreated" PropertyName="CreatedPackingDirectory" />
    </MakeDir>
</Target>
```

## `Move` 移动文件

下面的例子是将输出文件移动到一个专门的目录中，移动后，所有的文件将平级地在输出文件夹中（即所有的子文件夹中的文件也都被移动到同一层目录中了）。

```xml
<PropertyGroup>
    <_WalterlvPackingDirectory>$(MSBuildThisFileDirectory)..\bin\$(Configuration)\</_WalterlvPackingDirectory>
</PropertyGroup>

<Target Name="_WalterlvMoveFilesForPacking">
    <ItemGroup>
        <_WalterlvToMoveFile Include="$(OutputPath)**" />
    </ItemGroup>
    <Move SourceFiles="@(_WalterlvToMoveFile)"
          DestinationFolder="$(_WalterlvPackingDirectory)"
          SkipUnchangedFiles="True" />
</Target>
```

你可以通过下面的例子了解到 `Move` 的其他大多数属性及其用法：

```xml
<PropertyGroup>
    <_WalterlvPackingDirectory>$(MSBuildThisFileDirectory)..\bin\$(Configuration)\</_WalterlvPackingDirectory>
</PropertyGroup>

<Target Name="_WalterlvMoveFilesForPacking">
    <ItemGroup>
        <_WalterlvToMoveFile Include="$(OutputPath)**" />
        <_WalterlvTargetFile Include="$(_WalterlvPackingDirectory)\%(_WalterlvToMoveFile.RecursiveDir)" />
    </ItemGroup>
    <Move SourceFiles="@(_WalterlvToMoveFile)"
          DestinationFiles="$(_WalterlvTargetFile)"
          OverwriteReadOnlyFiles="True">
        <Output TaskParameter="MovedFiles" PropertyName="MovedOutputFiles" />
    </Copy>
</Target>
```

这段代码除了没有使用 `DestinationFolder` 之外，使用到了所有 `Move` 能用的属性：

- 将所有的 `_WalterlvToCopyFile` 一对一地复制到 `_WalterlvTargetFile` 指定的路径上。
- 即便目标文件是只读的，也会覆盖。

## `Copy` 复制文件

下面的例子是将输出文件拷贝到一个专门的目录中，保留原来所有文件之间的目录结构，并且如果文件没有改变则跳过。

```xml
<PropertyGroup>
    <_WalterlvPackingDirectory>$(MSBuildThisFileDirectory)..\bin\$(Configuration)\</_WalterlvPackingDirectory>
</PropertyGroup>

<Target Name="_WalterlvCopyFilesForPacking">
    <ItemGroup>
        <_WalterlvToCopyFile Include="$(OutputPath)**" />
    </ItemGroup>
    <Copy SourceFiles="@(_WalterlvToCopyFile)"
          DestinationFolder="$(_WalterlvPackingDirectory)\%(RecursiveDir)"
          SkipUnchangedFiles="True" />
</Target>
```

如果你希望复制后所有的文件都在同一级文件夹中，不再有子文件夹，那么去掉 `\%(RecursiveDir)`。

你可以通过下面的例子了解到 `Copy` 的其他大多数属性及其用法：

```xml
<PropertyGroup>
    <_WalterlvPackingDirectory>$(MSBuildThisFileDirectory)..\bin\$(Configuration)\</_WalterlvPackingDirectory>
</PropertyGroup>

<Target Name="_WalterlvCopyFilesForPacking">
    <ItemGroup>
        <_WalterlvToCopyFile Include="$(OutputPath)**" />
        <_WalterlvTargetFile Include="$(_WalterlvPackingDirectory)\%(_WalterlvToCopyFile.RecursiveDir)" />
    </ItemGroup>
    <Copy SourceFiles="@(_WalterlvToCopyFile)"
          DestinationFiles="@(_WalterlvTargetFile)"
          OverwriteReadOnlyFiles="True"
          Retries="10"
          RetryDelayMilliseconds="10"
          SkipUnchangedFiles="True"
          UseHardlinksIfPossible="True">
        <Output TaskParameter="CopiedFiles" PropertyName="CopiedOutputFiles" />
    </Copy>
</Target>
```

这段代码除了没有使用 `DestinationFolder` 之外，使用到了所有 `Copy` 能用的属性：

- 将所有的 `_WalterlvToCopyFile` 一对一地复制到 `_WalterlvTargetFile` 指定的路径上。
- 即便目标文件是只读的，也会覆盖。
- 如果复制失败，则重试 10 次，每次等待 10 毫秒
- 如果文件没有改变，则跳过复制
- 如果目标文件系统支持硬连接，则使用硬连接来提升性能

## `Delete` 删除文件

下面这个例子是删除输出目录下的所有的 pdb 文件（适合 release 下发布软件）。

```xml
<Target Name="_WalterlvDeleteFiles">
    <Delete Files="$(OutputPath)*.pdb" />
</Target>
```

也可以把此操作已经删除的文件列表拿出来。使用全部属性的 `Delete` 的例子：

```xml

<Target Name="_WalterlvDeleteFiles">
    <Delete Files="$(OutputPath)*.pdb" TreatErrorsAsWarnings="True">
        <Output TaskParameter="DeletedFiles" PropertyName="DeletedPdbFiles" />
    </Delete>
</Target>
```

## `ReadLinesFromFile` 读取文件

在编译期间，可以从文件中读出文件的每一行：

```xml
<PropertyGroup>
    <_WalterlvToWriteFile>$(OutputPath)walterlv.md</_WalterlvToWriteFile>
</PropertyGroup>

<Target Name="_WalterlvReadFilesToLines">
    <ReadLinesFromFile File="$(_WalterlvToWriteFile)">
        <Output TaskParameter="Lines" PropertyName="TheLinesThatRead" />
    </ReadLinesFromFile>
</Target>
```

## `WriteLinesToFile` 写入文件

可以在编译期间，将一些信息写到文件中以便后续编译的时候使用，甚至将代码写到文件中以便动态生成代码。

```xml
<PropertyGroup>
    <_WalterlvBlogSite>https://blog.walterlv.com</_WalterlvBlogSite>
    <_WalterlvToWriteFile>$(OutputPath)walterlv.md</_WalterlvToWriteFile>
</PropertyGroup>

<ItemGroup>
    <_WalterlvToWriteLine Include="This is the first line" />
    <_WalterlvToWriteLine Include="This is the second line" />
    <_WalterlvToWriteLine Include="My blog site is: $(_WalterlvBlogSite)" />
</ItemGroup>

<Target Name="_WalterlvWriteFilesForPacking">
    <WriteLinesToFile File="$(_WalterlvToWriteFile)"
                      Lines="@(_WalterlvToWriteLine)" />
</Target>
```

```xml
<Target Name="_WalterlvWriteFilesForPacking">
    <WriteLinesToFile File="$(_WalterlvToWriteFile)"
                      Lines="@(_WalterlvToWriteLine)"
                      Overwrite="True"
                      Encoding="Unicode"
                      WriteOnlyWhenDifferent="True" />
</Target>
```

## `RemoveDir` 删除文件夹

在编写编译命令的时候，可能会涉及到清理资源。或者为了避免无关文件的影响，在编译之前删除我们的工作目录。

```xml
<Target Name="_WalterlvRemoveDirectoryForPacking">
    <RemoveDir Directories="$(MSBuildThisFileDirectory)..\bin\$(Configuration)\" />
</Target>
```

下面是使用到 `MakeDir` 全部属性的例子，将已经成功创建的文件夹提取出来。

```xml
<Target Name="_WalterlvRemoveDirectoryForPacking">
    <RemoveDir Directories="$(MSBuildThisFileDirectory)..\bin\$(Configuration)\">
        <Output TaskParameter="RemovedDirectories" PropertyName="RemovedPackingDirectory" />
    </RemoveDir>
</Target>
```
