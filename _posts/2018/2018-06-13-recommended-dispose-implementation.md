---
title: "C#/.NET 中推荐的 Dispose 模式的实现"
publishDate: 2015-02-05 10:10:00 +0800
date: 2018-06-13 11:02:37 +0800
tags: csharp dotnet
permalink: /post/recommended-dispose-implementation.html
---

如果你觉得你的类需要实现 `IDisposable` 接口，还是需要注意一些坑的。不过前人准备了 **Dispose 模式** 供我们参考，最大程度避免这样的坑。

---

C#程序中的 Dispose 方法，一旦被调用了该方法的对象，虽然还没有垃圾回收，但实际上已经不能再使用了。所以使用上要仔细考虑细节。

需要明确一下 C# 程序（或者说 .NET）中的资源。简单的说来，C# 中的每一个类型都代表一种资源，而资源又分为两类：

- 托管资源：由 CLR 管理分配和释放的资源，即由 CLR 里 new 出来的对象；
- 非托管资源：不受 CLR 管理的对象，Windows 内核对象，如文件、数据库连接、套接字、COM 对象等；

毫无例外地，如果我们的类型使用到了非托管资源，或者需要显式释放的托管资源，那么，就需要让类型继承接口 `IDisposable`。这相当于是告诉调用者，该类型是需要显式释放资源的，你需要调用我的 `Dispose` 方法。

不过，这一切并不这么简单，一个标准的继承了 `IDisposable` 接口的类型应该像下面这样去实现。这种实现我们称之为 `Dispose` 模式：

```csharp
public class DisposableObject : IDisposable
{
    /// <summary>
    /// 获取或设置一个值。该值指示资源已经被释放。
    /// </summary>
    private bool _disposed;
  
    /// <summary>
    /// 执行与释放或重置非托管资源相关的应用程序定义的任务。
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
  
    /// <summary>
    /// 关闭此对象使用的所有资源。
    /// </summary>
    public void Close()
    {
        Dispose();
    }
  
    /// <summary>
    /// 由终结器调用以释放资源。
    /// </summary>
    ~DisposableObject()
    {
        Dispose(false);
    }
  
    /// <summary>
    /// 执行与释放或重置非托管资源相关的应用程序定义的任务。
    /// 派生类中重写此方法时，需要释放派生类中额外使用的资源。
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed)
        {
            return;
        }
        if (disposing)
        {
            // 清理托管资源
            // if (managedResource != null)
            // {
            //     managedResource.Dispose();
            //     managedResource = null;
            // }
        }
        // 清理非托管资源
        // if (nativeResource != IntPtr.Zero)
        // {
        //     Marshal.FreeHGlobal(nativeResource);
        //     nativeResource = IntPtr.Zero;
        // }
        // 标记已经被释放。
        _disposed = true;
    }
}
```

