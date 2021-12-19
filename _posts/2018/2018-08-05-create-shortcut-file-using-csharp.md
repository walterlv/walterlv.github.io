---
title: "使用 C# 代码创建快捷方式文件"
publishDate: 2015-04-07 12:48:00 +0800
date: 2018-08-11 09:58:29 +0800
tags: windows csharp dotnet
coverImage: /static/posts/2018-08-05-20-37-14.png
permalink: /posts/create-shortcut-file-using-csharp.html
---

快捷方式是一种特殊的文件，扩展名为 lnk。有很多种方式来创建快捷方式，不过使用 C# 代码创建一个却并不那么容易。

本文分享三种不同的方式创建快捷方式。

---

## 随处可用的代码

这是最方便的方式了，因为这段代码随便放到一段代码中就能运行：

```csharp
/// <summary>
/// 为当前正在运行的程序创建一个快捷方式。
/// </summary>
/// <param name="lnkFilePath">快捷方式的完全限定路径。</param>
/// <param name="args">快捷方式启动程序时需要使用的参数。</param>
private static void CreateShortcut(string lnkFilePath, string args = "")
{
    var shellType = Type.GetTypeFromProgID("WScript.Shell");
    dynamic shell = Activator.CreateInstance(shellType);
    var shortcut = shell.CreateShortcut(lnkFilePath);
    shortcut.TargetPath = Assembly.GetEntryAssembly().Location;
    shortcut.Arguments = args;
    shortcut.WorkingDirectory = AppDomain.CurrentDomain.SetupInformation.ApplicationBase;
    shortcut.Save();
}
```

以上代码为当前正在运行的程序创建一个快捷方式。当然，如果你希望给其他文件创建快捷方式，就改一改里面的代码吧，将 `TargetPath` 和 `WorkingDirectory` 改为其他参数。

![快捷方式属性](/static/posts/2018-08-05-20-37-14.png)  
▲ 快捷方式属性（其中 Target 等同于上面的 `TargetPath` 和 `Arguments` 一起，Start in 等同于上面的 `WorkingDirectory`）

### 引用 COM 组件

引用 COM 组件 Interop.IWshRuntimeLibrary.dll 能够获得类型安全，不过本质上和以上方法是一样的。

```csharp
private static void CreateShortcut(string lnkFilePath, string args = "")
{
    var shell = new IWshRuntimeLibrary.WshShell();
    var shortcut = (IWshRuntimeLibrary.IWshShortcut) shell.CreateShortcut(linkFileName);
    shortcut.TargetPath = Assembly.GetEntryAssembly().Location;
    shortcut.Arguments = args;
    shortcut.WorkingDirectory = AppDomain.CurrentDomain.SetupInformation.ApplicationBase;
    shortcut.Save();
}
```
### 兼容 .NET 3.5 或早期版本

如果你还在使用 .NET Framework 3.5 或更早期版本，那真的很麻烦。同情你一下，不过也贴一段代码：

```csharp
private static void CreateShortcut(string lnkFilePath, string args = "")
{
    var shellType = Type.GetTypeFromProgID("WScript.Shell");
    var shell = Activator.CreateInstance(shellType);
    var shortcut = shellType.InvokeMember("CreateShortcut",
        BindingFlags.Public | BindingFlags.Instance | BindingFlags.InvokeMethod,
        null, shell, new object[] { linkFileName });
    var shortcutType = shortcut.GetType();
    shortcutType.InvokeMember("TargetPath",
        BindingFlags.Public | BindingFlags.Instance | BindingFlags.SetProperty,
        null, shortcut, new object[] { Assembly.GetEntryAssembly().Location });
    shortcutType.InvokeMember("Arguments",
        BindingFlags.Public | BindingFlags.Instance | BindingFlags.SetProperty, 
        null, shortcut, new object[] { args });
    shortcutType.InvokeMember("WorkingDirectory",
        BindingFlags.Public | BindingFlags.Instance | BindingFlags.SetProperty, 
        null, shortcut, new object[] { AppDomain.CurrentDomain.SetupInformation.ApplicationBase });
    shortcutType.InvokeMember("Save",
        BindingFlags.Public | BindingFlags.Instance | BindingFlags.InvokeMethod,
        null, shortcut, null);
}
```


