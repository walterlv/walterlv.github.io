---
title: "项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量了）"
date: 2018-04-12 21:03:52 +0800
categories: visualstudio nuget csharp dotnet
---

知道了 csproj 文件中的一些常用变量，修改文件的时候就不会写很多的垃圾代码。

---

什么？你的 csproj 文件太长不想看？说明你用了旧格式的 csproj，阅读我的另一篇文章 [将 WPF、UWP 以及其他各种类型的旧样式的 csproj 文件迁移成新样式的 csproj 文件](/post/introduce-new-style-csproj-into-net-framework.html) 将它转为新格式之后，你就会觉得这么简短精炼的 csproj 文件，真不忍将它写杂。

比如通过以下写法，可以将所有的 *.xaml.cs 文件折叠到对应的 *.xaml 文件下（当然只对 IDE 有效，以下代码摘自 [AvaloniaUI](https://github.com/AvaloniaUI/Avalonia) 的项目模板）：

> ```xml
> <Compile Update="**\*.xaml.cs">
>     <DependentUpon>%(Filename)</DependentUpon>
> </Compile>
> ```

<div id="toc"></div>

### 项属性

写在 csproj 文件中 ItemGroup 组中的每一个元素即“项”。

对以下这一项进行说明的话：

> ```xml
> <ItemGroup>  
>     <Compile Include="src\Program.cs" />  
> </ItemGroup> 
> ```

那么，可用的属性有：

项属性|含义|举例
-|-|-
%(FullPath)|文件的完全路径|`C:\Users\lvyi\Development\Demo\src\Program.cs`
%(RootDir)|文件所在的根目录|`C:\`
%(Filename)|文件名（不含扩展名）|`Program`
%(Extension)|文件扩展名|`.cs`
%(RelativeDir)|文件所在的文件夹|`src\`
%(Directory)|除了根目录之外的目录|`Users\lvyi\Development\Demo\src\`
%(RecursiveDir)|如果项是用通配符写的，那么此值表示匹配到某一项时的目录|`Users\lvyi\Development\Demo\src\`
%(Identity)|项的标识符，也就是 Include 里写的东西|`src\Program.cs`
%(ModifiedTime)|文件的修改时间|2018-04-12 21:00:43.7851385
%(CreatedTime)|文件的创建时间|2018-04-12 21:01:50.1417635
%(AccessedTime)|文件最近被访问的时间|2018-04-12 21:02:15.4132476

---

#### 参考资料

- [MSBuild Well-known Item Metadata](https://msdn.microsoft.com/en-us/library/ms164313.aspx)
