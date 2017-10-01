---
layout: post
title:  "创建快捷方式"
date:   2015-04-07 12:48:00 +0800
date_modified: 2017-09-12 22:42:22 +0800
categories: windows
---

虽然我们都知道快捷方式是一种特殊的文件，扩展名为 lnk。但是使用 C# 代码创建一个快捷方式却不那么容易。本文分享三种不同的方式创建快捷方式。

---

#### 引用 COM 组件

```csharp
Interop.IWshRuntimeLibrary.dll
var shell = new IWshRuntimeLibrary.WshShell();
var shortcut = (IWshRuntimeLibrary.IWshShortcut)shell.CreateShortcut(linkFileName);
shortcut.TargetPath = Application.ExecutablePath;
shortcut.WorkingDirectory = Application.StartupPath;
shortcut.Save();
```

#### .NET 4 可使用 dynamic

```csharp
Type shellType = Type.GetTypeFromProgID("WScript.Shell");
dynamic shell = Activator.CreateInstance(shellType);
dynamic shortcut = shell.CreateShortcut(linkFileName);
shortcut.TargetPath = Application.ExecutablePath;
shortcut.WorkingDirectory = Application.StartupPath;
shortcut.Save();
```

#### .NET 3.5 或早期版本使用反射

```csharp
Type shellType = Type.GetTypeFromProgID("WScript.Shell");
object shell = Activator.CreateInstance(shellType);
object shortcut = shellType.InvokeMember("CreateShortcut",
      BindingFlags.Public | BindingFlags.Instance | BindingFlags.InvokeMethod,
      null, shell, new object[] { linkFileName });
Type shortcutType = shortcut.GetType();
shortcutType.InvokeMember("TargetPath",
      BindingFlags.Public | BindingFlags.Instance | BindingFlags.SetProperty,
      null, shortcut, new object[] { Application.ExecutablePath });
shortcutType.InvokeMember("WorkingDirectory",
      BindingFlags.Public | BindingFlags.Instance | BindingFlags.SetProperty, 
      null, shortcut, new object[] { Application.StartupPath });
shortcutType.InvokeMember("Save",
      BindingFlags.Public | BindingFlags.Instance | BindingFlags.InvokeMethod,
      null, shortcut, null);
```

#### 参考资料
[https://stackoverflow.com/questions/6808369/call-com-wituout-com-interop-dll](https://stackoverflow.com/questions/6808369/call-com-wituout-com-interop-dll)
