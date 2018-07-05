---
title: "如何在 .NET 库的代码中判断当前程序运行在 Debug 下还是 Release 下"
date: 2018-07-05 19:39:00 +0800
categories: dotnet
---

我们经常会使用条件编译符 `#if DEBUG` 在 Debug 下执行某些特殊代码。但是一旦我们把代码打包成 dll，然后发布给其他小伙伴使用的时候，这样的判断就失效了，因为发布的库是 Release 配置的；那些 `#if DEBUG` 的代码根本都不会编译进库中。然而总有时候希望在库中也能得知程序是 Debug 还是 Release，以便库发布之后也能在 Debug 下多做一些检查。

那么有办法得知使用此库的程序是 Debug 配置还是 Release 配置下编译的呢？本文将介绍一个比较靠谱的方法（适用于 .NET Standard）。

---

<div id="toc"></div>

### 先上代码

```csharp
using System;
using System.Diagnostics;
using System.Linq;
using System.Reflection;

namespace Walterlv.ComponentModel
{
    /// <summary>
    /// 包含在运行时判断编译器编译配置中调试信息相关的属性。
    /// </summary>
    public static class DebuggingProperties
    {
        /// <summary>
        /// 检查当前正在运行的主程序是否是在 Debug 配置下编译生成的。
        /// </summary>
        public static bool IsDebug
        {
            get
            {
                if (_isDebugMode == null)
                {
                    var assembly = Assembly.GetEntryAssembly();
                    if (assembly == null)
                    {
                        var frames = new StackTrace().GetFrames();
                        if (frames == null)
                        {
                            // 由于调用 GetFrames 的 StackTrace 实例没有跳过任何帧，所以 frames 一定不为 null。
                            throw new NotSupportedException();
                        }

                        assembly = frames.Last().GetMethod().Module.Assembly;
                    }

                    var debuggableAttribute = assembly.GetCustomAttribute<DebuggableAttribute>();
                    _isDebugMode = debuggableAttribute.DebuggingFlags
                        .HasFlag(DebuggableAttribute.DebuggingModes.EnableEditAndContinue);
                }

                return _isDebugMode.Value;
            }
        }

        private static bool? _isDebugMode;
    }
}
```

### 再解释原理

#### 发现特性

所有 .NET 开发者都应该知道我们编译程序时有 Debug 配置和 Release 配置，具体来说是项目文件中一个名为 `<Configuration>` 的节点记录的字符串。

使用 Debug 编译后的程序和 Release 相比有哪些可以检测到的不同呢？我反编译了我的一个程序集。

.NET Core 程序集，Debug 编译：

```csharp
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: CompilationRelaxations(8)]
[assembly: RuntimeCompatibility(WrapNonExceptionThrows = true)]
[assembly: Debuggable(DebuggableAttribute.DebuggingModes.Default | DebuggableAttribute.DebuggingModes.DisableOptimizations | DebuggableAttribute.DebuggingModes.IgnoreSymbolStoreSequencePoints | DebuggableAttribute.DebuggingModes.EnableEditAndContinue)]
[assembly: AssemblyCompany("Walterlv.Demo")]
[assembly: AssemblyConfiguration("Debug")]
[assembly: AssemblyFileVersion("1.0.0.0")]
[assembly: AssemblyInformationalVersion("1.0.0")]
[assembly: AssemblyProduct("Walterlv.Demo")]
[assembly: AssemblyTitle("Walterlv.Demo")]
```

.NET Core 程序集，Release 编译：

```csharp
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: CompilationRelaxations(8)]
[assembly: RuntimeCompatibility(WrapNonExceptionThrows = true)]
[assembly: Debuggable(DebuggableAttribute.DebuggingModes.IgnoreSymbolStoreSequencePoints)]
[assembly: AssemblyCompany("Walterlv.Demo")]
[assembly: AssemblyConfiguration("Release")]
[assembly: AssemblyFileVersion("1.0.0.0")]
[assembly: AssemblyInformationalVersion("1.0.0")]
[assembly: AssemblyProduct("Walterlv.Demo")]
[assembly: AssemblyTitle("Walterlv.Demo")]
```

发现一个很棒的特性 `AssemblyConfiguration`，直接写明了当前是 Debug 还是 Release 编译的。

你以为这就完成了？我们再来看看 .NET Framework 下面的情况。

.NET Framework 程序集，Debug 编译：

```csharp
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: CompilationRelaxations(8)]
[assembly: RuntimeCompatibility(WrapNonExceptionThrows = true)]
[assembly: Debuggable(DebuggableAttribute.DebuggingModes.Default | DebuggableAttribute.DebuggingModes.DisableOptimizations | DebuggableAttribute.DebuggingModes.IgnoreSymbolStoreSequencePoints | DebuggableAttribute.DebuggingModes.EnableEditAndContinue)]
[assembly: AssemblyTitle("Walterlv.Demo")]
[assembly: AssemblyDescription("")]
[assembly: AssemblyConfiguration("")]
[assembly: AssemblyCompany("")]
[assembly: AssemblyProduct("Walterlv.Demo")]
[assembly: AssemblyCopyright("Copyright © walterlv 2018")]
[assembly: AssemblyTrademark("")]
[assembly: ComVisible(false)]
[assembly: AssemblyFileVersion("1.0.0.0")]
[assembly: TargetFramework(".NETFramework,Version=v4.7", FrameworkDisplayName = ".NET Framework 4.7")]
```

.NET Framework 程序集，Release 编译：

```csharp
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: CompilationRelaxations(8)]
[assembly: RuntimeCompatibility(WrapNonExceptionThrows = true)]
[assembly: Debuggable(DebuggableAttribute.DebuggingModes.IgnoreSymbolStoreSequencePoints)]
[assembly: AssemblyTitle("Walterlv.Demo")]
[assembly: AssemblyDescription("")]
[assembly: AssemblyConfiguration("")]
[assembly: AssemblyCompany("")]
[assembly: AssemblyProduct("Walterlv.Demo")]
[assembly: AssemblyCopyright("Copyright © walterlv 2018")]
[assembly: AssemblyFileVersion("1.0.0.0")]
[assembly: TargetFramework(".NETFramework,Version=v4.7", FrameworkDisplayName = ".NET Framework 4.7")]
```

已经没有 `AssemblyConfiguration` 特性可以用了。不过我们额外发现一个比较间接的特性可用 `Debuggable`，至少两者都是有的，可以写出兼容的代码。

`DebuggableAttribute.DebuggingModes` 有多个值：

- `None`
    - 自 .NET Framework 2.0 开始，JIT 跟踪信息始终会生成，所以这个属性已经没用了。如果指定为这个值，会直接按 `Default` 处理。
- `Default`
    - 允许 JIT 编译器进行优化。
- `DisableOptimizations`
    - 禁止编译器对输出程序集进行优化，因为优化可能导致调试过程非常困难。
- `IgnoreSymbolStoreSequencePoints`
- `EnableEditAndContinue`
    - 允许在进入断点的情况下编辑代码并继续执行。

通常在 Debug 下编译时，使用的值是 `EnableEditAndContinue`。

#### 寻找程序集

以上发现的程序集特性是需要找到一个程序集的，那么应该使用哪一个程序集呢？

通常我们调试的时候是运行一个入口程序的，所以可以考虑使用 `Assembly.GetEntryAssembly()` 来获取入口程序集。然而微软官网对此方法有一个描述：

> The assembly that is the process executable in the default application domain, or the first executable that was executed by AppDomain.ExecuteAssembly. Can return null when called from unmanaged code.

也就是说如果入口程序集是非托管程序集，那么这个可能返回 `null`。这可能发生在单元测试中、性能测试中或者其他非托管程序调用托管代码的情况；虽然不是主要场景，却很常见。所以，我们依然需要处理返回 `null` 的情况。

那么如何才能找到我们需要的入口程序集呢？考虑托管代码的调用栈中的第一个函数可能是最接近使用者调试的程序集的，所以我们可以采取查找栈底的方式：

```csharp
var assembly = new StackTrace().GetFrames().Last().GetMethod().Module.Assembly;
```

`StackTrace.GetFrames()` 方法可能返回 `null`，但那仅对于一个任意的 `StackTrace`。在我们的使用场景中是取整个托管调用栈的，由于这个方法本身就是托管代码，所以栈中至少存在一个帧；也就是说此方法在我们的场景中是不可能返回 `null` 的。所以代码静态检查工具如果提示需要处理 `null`，其实是多余的担心。

#### 性能

另外，一个编译好的程序集是不可能在运行时再去修改 Debug 和 Release 配置的，所以第一次获取完毕后就可以缓存下来以便后续使用。

---

#### 参考资料

- [Assembly.GetEntryAssembly Method (System.Reflection)](https://msdn.microsoft.com/en-us/library/system.reflection.assembly.getentryassembly.aspx?f=255&MSPPError=-2147217396)
- [c# - I need an alternative to `Assembly.GetEntryAssembly()` that never returns null - Stack Overflow](https://stackoverflow.com/questions/14165785/i-need-an-alternative-to-assembly-getentryassembly-that-never-returns-null)
- [StackTrace.GetFrames](https://referencesource.microsoft.com/#mscorlib/system/diagnostics/stacktrace.cs,84f88e3b241d29e3,references)
