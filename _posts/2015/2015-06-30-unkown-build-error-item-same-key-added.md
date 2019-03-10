---
title: "未知的编译错误：“已添加具有相同键的项。Unknown build error, 'An item with the same key has already been added.'”"
date: 2015-06-30 20:13:00 +0800
categories: visualstudio
---

未知的编译错误：“已添加具有相同键的项。”

Unknown build error, 'An item with the same key has already been added.'

本文将解释编译时产生此问题的原因，并提供解决方法。

---

## 出现此问题的原因

出现此问题的原因是：csproj 文件中存在两个对相同文件的引用行。

例如：

```xml
<ItemGroup>
    <Resource Include="Walterlv\Demo\Icon\Clear.png" />
    <Resource Include="Walterlv\Demo\Icon\Clear.png" />
</ItemGroup>
```

出现此问题时，只需要去掉某一个重复行即可，如果找不到是哪个文件，则可以使用正则表达式匹配。

```
(?s)(<.+?>).*?\1
```

此正则表达式的作用是查找文件中的相同行。

或者写一个简短的程序来查找：

```csharp
namespace Walterlv.Tools
{
    class Program
    {
        static void Main(string[] args)
        {
            List<string> lines = new List<string>();
            foreach (string line in File.ReadAllLines(args[0]).Where(x=>!String.IsNullOrEmpty(x)).Select(x => x.Trim()))
            {
                if (lines.Contains(line)) Console.WriteLine(line);
                else lines.Add(line);
            }
            Console.Read();
        }
    }
}
```

此代码的作用是输出指定文件中所有相同的行。

## 一个让VS复现此问题的步骤

如下图，将一个已排除到项目之外的文件拖拽到另一个文件夹，并覆盖项目内的同名文件，则必现此问题。

所以，平时开发的过程中，如果要到处拖拽文件的话，小心哦！

[正在录制](正在录制.gif)
