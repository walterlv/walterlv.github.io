---
title: "如何快速编写和调试 Emit 生成 IL 的代码"
publishDate: 2018-04-22 20:23:26 +0800
date: 2018-09-01 08:10:32 +0800
categories: dotnet csharp
---

.NET Core/.NET Framework 的 `System.Reflection.Emit` 命名空间为我们提供了动态生成 IL 代码的能力。利用这项能力，我们能够在运行时生成一段代码/一个方法/一个类/一个程序集。

大家都知道反射的性能很差，通过缓存反射调用的方法则能够大幅提升性能。`Emit` 为我们提供了这项能力，我们能够在运行时生成一段代码，替代使用反射动态调用的代码，以提升性能。

---

<div id="toc"></div>

### 我们在解决什么问题？

之前我写过一篇[创建委托以大幅度提高反射调用的性能](/post/create-delegate-to-improve-reflection-performance.html)的方法，不过此方法适用于预先知道方法参数和返回值类型的情况。如果我们在编译期不知道类型，那么它就行不通了。（原因？注意到那篇文章中返回的委托有类型强转吗？也就是说需要编译期确定类型，即便是泛型。）

例如，我们在运行时得到一个对象，希望为这个对象的部分或全部属性赋值；此对象的类型和属性类型在编译期全部不可知（就算是泛型也没有）。

> ```csharp
> class SomeClass
> {
>     [DefaultValue("walterlv")]
>     public string SomeProperty { get; set; }
> }
> ```

众所周知的反射能够完成这个目标，但它不是本文讨论的重点；因为一旦这样的方法会被数万数十万甚至更多次调用的时候，反射将造成性能灾难。

既然反射不行，通过反射的创建委托也不行，那还有什么方法？

1. 使用表达式树（不是本文重点）
1. 使用 Emit（本文）

如果事先不能知道类型，那么只能每次通过反射去动态的调用，于是才会耗费大量的性能。如果我们能够在运行时动态地生成一段调用方法，那么这个调用方法将可以缓存下来供后续重复调用。如果我们使用 Emit，那么生成的方法与静态编写的代码是一样的，于是就能获得普通方法的性能。

为了实现动态地设置未知类型未知属性的值，我决定写出如下方法：

> ```csharp
> static void SetPropertyValue(object @this, object value)
> {
>     ((类的类型) @this).属性名称 = (属性的类型) value;
> }
> ```

不用考虑编译问题了，这段代码是肯定编译不过的。方法是一个静态方法，传入两个参数——类型的实例和属性的新值；方法内部为实例中某个属性赋新值。

类的类型、属性名称和属性的类型是编译期不能确定，但可以在运行时确定的；如果此生成的方法会被大量调用，那么性能优势将极其明显。

### 快速编写 Emit

为了快速编写和调试 Emit，我们需要 ReSharper 全家桶：

- [ReSharper](https://www.jetbrains.com/resharper/) - *用于实时查看 IL 代码*
- [dotPeek](https://www.jetbrains.com/decompiler/) - *免费，用于查看我们使用 Emit 生成的代码，便于对比分析*

相比于原生 Visual Studio，有此工具帮助的情况下，IL 的编写速度和调试速度将得到质的提升。（当然，利用这些工具依然只是**手工操作**，存在瓶颈；如果你阅读完本文之后找到或编写一个新的工具，更快，欢迎与我探讨。）

ReSharper 提供了 IL Viewer 窗格，从菜单依次进入 ReSharper->Windows->IL Viewer 可以打开。

![ReSharper IL Viewer](/static/posts/2018-04-22-18-35-42.png)

打开后立即可以看到我们当前正在编写的代码的 IL，而且还能高亮光标所在的代码块。（如果你的 IL Viewer 中没有代码或没有高亮，编译一遍项目即可。）

![IL Viewer 中的代码与编写的代码对应](/static/posts/2018-04-22-18-37-20.png)

我们要做的，就是得知 `SetPropertyValue` 在编译后将得到什么样的 IL 代码，这样我们才能编写出正确的 IL 生成代码来。于是编写这些辅助代码：

```csharp
namespace Walterlv.Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            var instance = new TempClass();
            SetPropertyValue(instance, "test");
        }

        static void SetPropertyValue(object @this, object value)
        {
            ((TempClass) @this).TempProperty = (string) value;
        }
    }

    public class TempClass
    {
        public string TempProperty { get; set; }
    }
}
```

编译之后去 IL Viewer 中看 `SetPropertyValue` 的 IL 代码：

```
.method private hidebysig static void 
    SetPropertyValue(
        object this, 
        object 'value'
    ) cil managed 
{
    .maxstack 8

    // [14 9 - 14 10]
    IL_0000: nop          

    // [15 13 - 15 63]
    IL_0001: ldarg.0      // this
    IL_0002: castclass    Walterlv.Demo.TempClass
    IL_0007: ldarg.1      // 'value'
    IL_0008: castclass    [System.Runtime]System.String
    IL_000d: callvirt     instance void Walterlv.Demo.TempClass::set_TempProperty(string)
    IL_0012: nop          

    // [16 9 - 16 10]
    IL_0013: ret          

} // end of method Program::SetPropertyValue
```

将这段 IL 代码抄下来。怎么抄呢？看下面我抄的代码，你应该能够很容易看出里面一一对应的关系。

```csharp
public static Action<object, object> CreatePropertySetter(PropertyInfo propertyInfo)
{
    var declaringType = propertyInfo.DeclaringType;
    var propertyType = propertyInfo.PropertyType;

    // 创建一个动态方法，参数依次为方法名、返回值类型、参数类型。
    // 对应着 IL 中的
    // .method private hidebysig static void
    //     SetPropertyValue(
    //     ) cil managed
    var method = new DynamicMethod("<set_Property>", typeof(void), new[] {typeof(object), typeof(object)});
    var il = method.GetILGenerator();

    // 定义形参。注意参数位置从 1 开始——即使现在在写静态方法。
    // 对应着 IL 中的
    //     object this,
    //     object 'value'
    method.DefineParameter(1, ParameterAttributes.None, "this");
    method.DefineParameter(2, ParameterAttributes.None, "value");

    // 用 Emit 生成 IL 代码。
    // 对应着 IL 中的各种操作符。
    il.Emit(OpCodes.Nop);
    il.Emit(OpCodes.Ldarg_0);
    il.Emit(OpCodes.Castclass, declaringType);
    il.Emit(OpCodes.Ldarg_1);
    // 注意：下一句代码会在文章后面被修改。
    il.Emit(OpCodes.Castclass, propertyType);
    il.Emit(OpCodes.Callvirt, propertyInfo.GetSetMethod());
    il.Emit(OpCodes.Nop);
    il.Emit(OpCodes.Ret);

    // 为生成的动态方法创建调用委托，返回返回这个委托。
    return (Action<object, object>) method.CreateDelegate(typeof(Action<object, object>));
}
```

现在我们用下面新的代码替换之前写在 `Main` 中直接赋值的代码：

```csharp
static void Main(string[] args)
{
    // 测试代码。
    var instance = new TempClass();
    var propertyInfo = typeof(TempClass).GetProperties().First();
    // 调用 Emit 核心代码。
    var setValue = QuickEmit.CreatePropertySetter(propertyInfo);
    // 测试生成的核心代码能否正常工作。
    setValue(instance, "test");
}
```

直接运行，在 `setValue` 之后我们查看 `instance` 中 `TempProperty` 属性的值，可以发现已经成功修改了。**大功告成**！

### 快速调试和修改 Emit

**才没有大功告成呢**！

试试把 `TempProperty` 的类型改为 `int`。把测试代码中传入的 `"test"` 字符串换成数字 `5`。运行看看：

![VerificationException](/static/posts/2018-04-22-19-37-33.png)  
▲ 为什么会崩溃？！

崩溃提示是“操作可能造成运行时的不稳定”。是什么造成了运行时的不稳定呢？难道是我们写的 IL 不对？

现在开始**利用 dotPeek 进行 IL 的调试**。

我们编写另外一个方法，用于将我们的生成的 IL 代码输出到 dll 文件。

```csharp
public static void OutputPropertySetter(PropertyInfo propertyInfo)
{
    var declaringType = propertyInfo.DeclaringType;
    var propertyType = propertyInfo.PropertyType;

    // 准备好要生成的程序集的信息。
    var assemblyName = new AssemblyName("Temp");
    var assembly = AppDomain.CurrentDomain.DefineDynamicAssembly(assemblyName, AssemblyBuilderAccess.Save);
    var module = assembly.DefineDynamicModule(assemblyName.Name, assemblyName.Name + ".dll");
    var type = module.DefineType("Temp", TypeAttributes.Public);
    var method = type.DefineMethod("<set_Property>",
        MethodAttributes.Static - MethodAttributes.Public, CallingConventions.Standard,
        typeof(void), new[] { typeof(object), typeof(object) });
    var il = method.GetILGenerator();
    
    // 跟之前一样生成 IL 代码。
    method.DefineParameter(1, ParameterAttributes.None, "this");
    method.DefineParameter(2, ParameterAttributes.None, "value");

    il.Emit(OpCodes.Nop);
    il.Emit(OpCodes.Ldarg_0);
    il.Emit(OpCodes.Castclass, declaringType);
    il.Emit(OpCodes.Ldarg_1);
    il.Emit(OpCodes.Castclass, propertyType);
    il.Emit(OpCodes.Callvirt, propertyInfo.GetSetMethod());
    il.Emit(OpCodes.Nop);
    il.Emit(OpCodes.Ret);

    // 将 IL 代码输出到程序的同级目录下。
    type.CreateType();
    assembly.Save($"{assemblyName.Name}.dll");
}
```

同样的，作为对照，我们在我们的测试程序中也修改那个参考代码。

> ```csharp
> static void SetPropertyValue(object @this, object value)
> {
>     // 注意！注意！string 已经换成了 int。
>     ((TempClass) @this).TempProperty = (int) value;
> }
> ```

重新生成可以得到一个 exe，调用新写的 `OutputPropertySetter` 可以得到 Temp.dll。于是我们的输出目录下现在存在两个程序集：

![两个输出程序集](/static/posts/2018-04-22-19-56-07.png)

将他们都拖进 dotPeek 中，然后在顶部菜单 Windows->IL Viewer 中打开 IL 显示窗格。

![比较生成的 IL](/static/posts/2018-04-22-20-03-08.png)

发现什么了吗？是的！对于结构体，用的是**拆箱**！！！而不是强制类型转换。

知道有了拆箱，于是就能知道应该怎样改了，生成 IL 的代码中 `Castclass` 部分应该根据条件进行判断：

```csharp
var castingCode = propertyInfo.PropertyType.IsValueType ? OpCodes.Unbox_Any : OpCodes.Castclass;
il.Emit(castingCode, propertyType);
```

现在运行，即可正常通过。如果你希望拥有完整的代码，可以自行将以上两句替换掉此前注释说明了 `注意：下一句代码会在文章后面被修改。` 的地方。

### 更进一步

- 如果要 Emit 的代码中存在 `if`-`else` 这样的非顺序结构怎么办？*阅读 [使用 Emit 生成 IL 代码 - 吕毅](/post/generate-il-using-emit.html) 可以了解做法。*
- 我们可以用 `int` 为 `double` 类型的属性赋值，但在本例代码中却不可行，如何解决这种隐式转换的问题？

如果你尝试编写了 Emit 的代码，那么上面的问题应该难不倒你。

### 总结

1. 通过 Emit，我们能够在运行时动态生成 IL 代码，以解决反射动态调用方法造成的大量性能损失。
1. 通过 ReSharper 插件，我们可以实时查看生成的 IL 代码。
1. 我们可以将 Emit 生成的代码输出到程序集文件。
1. 通过 dotPeek，我们可以查看程序集中类型和方法的 IL 代码。

---

#### 参考资料

+ 生成方法签名与元数据
    - [ParameterBuilder Class (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.parameterbuilder(v=vs.110).aspx)
    - [MethodBuilder.DefineParameter Method (Int32, ParameterAttributes, String) (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.methodbuilder.defineparameter(v=vs.110).aspx)
    - [Defining a Parameter with Reflection Emit](https://msdn.microsoft.com/en-us/library/9zksbcwc(v=vs.100).aspx)
    - [c# - How to set ".maxstack" with ILGenerator - Stack Overflow](https://stackoverflow.com/q/33656409/6233938)
+ 生成方法体
    - [ILGenerator.DefineLabel Method (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.ilgenerator.definelabel(v=vs.110).aspx)
    - [ILGenerator.MarkLabel Method (Label) (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.ilgenerator.marklabel(v=vs.110).aspx)
    - [c# - Emit local variable and assign a value to it - Stack Overflow](https://stackoverflow.com/a/15279066/6233938)
    - [C# reflection: If ... else? - Stack Overflow](https://stackoverflow.com/q/11139241/6233938)
    - [ILGenerator.Emit Method](https://msdn.microsoft.com/en-us/library/system.reflection.emit.ilgenerator.emit(v=vs.71).aspx)
    - [ILGenerator.Emit Method (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.ilgenerator.emit(v=vs.110).aspx)
    - [ILGenerator.Emit Method (OpCode, String) (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/yf2s00wd(v=vs.110).aspx)
    - [ILGenerator.Emit Method (OpCode, MethodInfo) (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/xz8067x2(v=vs.110).aspx)
    - [ILGenerator.EmitCall Method (OpCode, MethodInfo, Type[]) (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.ilgenerator.emitcall(v=vs.110).aspx)
    - [.net - Call and Callvirt - Stack Overflow](https://stackoverflow.com/a/193952/6233938)
+ IL 操作
    - [OpCodes.Ldarg_0 Field (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.opcodes.ldarg_0(v=vs.110).aspx)
    - [OpCodes.Brfalse_S Field (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.opcodes.brfalse_s(v=vs.110).aspx)
+ 输出程序集
    - [c# - Is there a way to view the generated IL code of a DynamicMethod (in Sigil)? - Stack Overflow](https://stackoverflow.com/q/29037961/6233938)
    - [c# - Can I use Reflection.Emit for generating code and save generated codes in .cs files or I could use CodeDom? - Stack Overflow](https://stackoverflow.com/a/6501618/6233938)
    - [AssemblyBuilder.Save Method (String) (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/8zwdfdeh(v=vs.110).aspx)
+ 运行时错误
    - [c# - Reflection.emit System.InvalidProgramException: Common Language Runtime detected an invalid program - Stack Overflow](https://stackoverflow.com/q/16950272/6233938)
    - ["Operation could destabilize the runtime." when using IL to create a DynamicMethod · Issue #14 · jbevain/mono.reflection](https://github.com/jbevain/mono.reflection/issues/14)
    - [c# - Emit Operation could destabilize the runtime for incrementing field - Stack Overflow](https://stackoverflow.com/q/21496490/6233938)
    - [.NET 4.5 : Operation could destabilize the runtime (yikes!) - ElegantCode](https://elegantcode.com/2012/08/23/net-4-5-operation-could-destabilize-the-runtime-yikes/)
    - [c# - Operation could destabilize the runtime? - Stack Overflow](https://stackoverflow.com/q/378895/6233938)
+ 其他
    - [Generating and Compiling Source Code from a CodeDOM Graph - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/reflection-and-codedom/generating-and-compiling-source-code-from-a-codedom-graph)
