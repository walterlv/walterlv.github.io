---
title: "如何让 .NET Core 命令行程序接受密码的输入而不显示密码明文"
date_published: 2018-05-26 16:51:02 +0800
date: 2018-05-26 22:26:12 +0800
categories: dotnet
---

如果是在 GUI 中要求用户输入密码，各 UI 框架基本都提供了用于输入密码的控件；在这些控件中，用户在输入密码的时候会显示掩码。然而对于控制台程序来说，并没有用于输入密码的原生方法。

本文将讲述一种在控制台中输入密码，并仅显示掩码的方法。

---

### 开始简单的程序

让我们开始一个简单的 .NET Core 控制台程序。

```csharp
static void Main(string[] args)
{
    Console.Write("用户名: ");
    var userName = Console.ReadLine();
    Console.Write("密  码: ");
    var password = Console.ReadLine();
    Console.ReadKey();
}
```

![初步的程序](/static/posts/2018-05-26-16-40-58.png)

密码直接显示，暴露无遗。而且，由于我们后面持续不断的有输出，控制台不会清除掉这些输出，所以密码会一直显示到缓冲区中——**这显然是不能接受的**。

### 写一个让用户输入密码并显示掩码的方法

既然控制台本身并没有提供可以为密码进行掩码的方法，那么我们只能自己来写了：

```csharp
public static SecureString ReadPassword(string mask = "*")
{
    var password = new SecureString();
    while (true)
    {
        var i = Console.ReadKey(true);
        if (i.Key == ConsoleKey.Enter)
        {
            Console.WriteLine();
            break;
        }

        if (i.Key == ConsoleKey.Backspace)
        {
            if (password.Length > 0)
            {
                password.RemoveAt(password.Length - 1);
                Console.Write("\b \b");
            }
        }
        else
        {
            password.AppendChar(i.KeyChar);
            Console.Write(mask);
        }
    }
    return password;
}
```

方法内部接受用户的输入——如果是回车，则确认；如果是退格，则删除一个字；其他情况下输出掩码。全程使用安全的字符串 `SecureString`，这种字符串是没有办法直接通过托管代码获取值的。

这时再输入字符串，将只能看到掩码——再也看不出来 `walterlv 是不是一个逗比` 了……

![有掩码的输入](/static/posts/2018-05-26-16-49-03.png)

### 转换密码

当然，只有对安全级别比较高的库才会接受 `SecureString` 类型的字符串作为密码；一些简单的库只接受字符串类型的密码。那么在这些简单的库中我们如何才能得到普通的字符串呢？

可以使用 `Marshal` 来完成：

```csharp
private static string ConvertToString(SecureString value)
{
    var valuePtr = IntPtr.Zero;
    try
    {
        valuePtr = Marshal.SecureStringToGlobalAllocUnicode(value);
        return Marshal.PtrToStringUni(valuePtr);
    }
    finally
    {
        Marshal.ZeroFreeGlobalAllocUnicode(valuePtr);
    }
}
```

也可以间接使用 `NetworkCredential` 完成：

```csharp
private static string ConvertToString(SecureString secureString)
{
    return new NetworkCredential(string.Empty, secureString).Password;
}
```

因为 `NetworkCredential` 的内部其实也是使用类似的方式获取到字符串的（详见 [SecureStringHelper.CreateString - Reference Source](https://referencesource.microsoft.com/#System/net/System/Net/UnsafeNativeMethods.cs,182c88988a485cda,references)）。

```csharp
internal static string CreateString(SecureString secureString)
{
    string plainString;
    IntPtr bstr = IntPtr.Zero;

    if (secureString == null || secureString.Length == 0)
        return String.Empty;

    try
    {
        bstr = Marshal.SecureStringToBSTR(secureString);
        plainString = Marshal.PtrToStringBSTR(bstr);
    }
    finally
    {
        if (bstr != IntPtr.Zero)
            Marshal.ZeroFreeBSTR(bstr);
    }
    return plainString;
}
```

---

#### 参考资料

- [c# - Password masking console application - Stack Overflow](https://stackoverflow.com/questions/3404421/password-masking-console-application?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [c# - How to convert SecureString to System.String? - Stack Overflow](https://stackoverflow.com/questions/818704/how-to-convert-securestring-to-system-string?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [SecureStringHelper.CreateString - Reference Source](https://referencesource.microsoft.com/#System/net/System/Net/UnsafeNativeMethods.cs,182c88988a485cda,references)
