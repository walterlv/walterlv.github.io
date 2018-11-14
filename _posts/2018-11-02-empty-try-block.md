---
title: ".NET/C# 异常处理：写一个空的 try 块代码，而把重要代码写到 finally 中"
publishDate: 2018-11-02 21:14:25 +0800
date: 2018-11-14 19:10:10 +0800
categories: dotnet csharp
---

不知你是否见过 `try { } finally { }` 代码中，`try` 块留空，而只往 `finally` 中写代码的情况呢？这种写法有其特殊的目的。

本文就来说说这种不一样的写法。

---

你可以点开[这个链接](https://source.dot.net/#System.Private.CoreLib/src/System/Exception.cs,a445c4e8ae46b283,references)查看 `Exception` 类，在里面你可以看到一段异常处理的代码非常奇怪：

```csharp
// 代码已经过简化。
internal void RestoreExceptionDispatchInfo(ExceptionDispatchInfo exceptionDispatchInfo)
{
    // 省略代码。
    try{}
    finally
    {
        // 省略代码。
    }
    // 省略代码。
}
```

神奇之处就在于，其 `try` 块是空的，重要代码都放在 `finally` 中。那为什么会这么写呢？

在代码注释中的解释为：

> We do this inside a `finally` clause to ensure `ThreadAbort` cannot be injected while we have taken the lock. This is to prevent unrelated exception restorations from getting blocked due to TAE.

翻译过来是：

在 `finally` 子句中执行此操作以确保在获取锁时无法注入 `ThreadAbort`。这是为了防止不相关的异常恢复因 TAE 而被阻止。

也就是说，**此方法是为了与 `Thread.Abort` 对抗，防止 `Thread.Abort` 中断此处代码的执行。** `Thread.Abort` 的执行交给 CLR 管理，`finally` 的执行也是交给 CLR 管理。CLR 确保 `finally` 块执行的时候不会被 `Thread.Abort` 阻止。

代码在 .NET Core 和 .NET Framework 中的实现完全一样：

```csharp
// This is invoked by ExceptionDispatchInfo.Throw to restore the exception stack trace, corresponding to the original throw of the
// exception, just before the exception is "rethrown".
[SecuritySafeCritical]
internal void RestoreExceptionDispatchInfo(System.Runtime.ExceptionServices.ExceptionDispatchInfo exceptionDispatchInfo)
{
    bool fCanProcessException = !(IsImmutableAgileException(this));
    // Restore only for non-preallocated exceptions
    if (fCanProcessException)
    {
        // Take a lock to ensure only one thread can restore the details
        // at a time against this exception object that could have
        // multiple ExceptionDispatchInfo instances associated with it.
        //
        // We do this inside a finally clause to ensure ThreadAbort cannot
        // be injected while we have taken the lock. This is to prevent
        // unrelated exception restorations from getting blocked due to TAE.
        try{}
        finally
        {
            // When restoring back the fields, we again create a copy and set reference to them
            // in the exception object. This will ensure that when this exception is thrown and these
            // fields are modified, then EDI's references remain intact.
            //
            // Since deep copying can throw on OOM, try to get the copies
            // outside the lock.
            object _stackTraceCopy = (exceptionDispatchInfo.BinaryStackTraceArray == null)?null:DeepCopyStackTrace(exceptionDispatchInfo.BinaryStackTraceArray);
            object _dynamicMethodsCopy = (exceptionDispatchInfo.DynamicMethodArray == null)?null:DeepCopyDynamicMethods(exceptionDispatchInfo.DynamicMethodArray);
            
            // Finally, restore the information. 
            //
            // Since EDI can be created at various points during exception dispatch (e.g. at various frames on the stack) for the same exception instance,
            // they can have different data to be restored. Thus, to ensure atomicity of restoration from each EDI, perform the restore under a lock.
            lock(Exception.s_EDILock)
            {
                _watsonBuckets = exceptionDispatchInfo.WatsonBuckets;
                _ipForWatsonBuckets = exceptionDispatchInfo.IPForWatsonBuckets;
                _remoteStackTraceString = exceptionDispatchInfo.RemoteStackTrace;
                SaveStackTracesFromDeepCopy(this, _stackTraceCopy, _dynamicMethodsCopy);
            }
            _stackTraceString = null;

            // Marks the TES state to indicate we have restored foreign exception
            // dispatch information.
            Exception.PrepareForForeignExceptionRaise();
        }
    }
}
```

你可以在 [这里](https://referencesource.microsoft.com/#mscorlib/system/exception.cs,a445c4e8ae46b283) 查看 .NET Framework 版本，在[这里](https://source.dot.net/#System.Private.CoreLib/src/System/Exception.cs,a445c4e8ae46b283,references) 查看 .NET Core 的版本。

---

#### 参考资料

- [exception.cs - Reference Source](https://referencesource.microsoft.com/#mscorlib/system/exception.cs,a445c4e8ae46b283)
- [RestoreExceptionDispatchInfo](https://source.dot.net/#System.Private.CoreLib/src/System/Exception.cs,a445c4e8ae46b283,references)
- [The empty try block mystery - Some Creativity](http://web.archive.org/web/20130523155042/http://blog.somecreativity.com/2008/04/10/the-empty-try-block-mystery/)
- [c# - Why use try {} finally {} with an empty try block? - Stack Overflow](https://stackoverflow.com/q/2186101/6233938)
- [corefx/System.Runtime.cs at master · dotnet/corefx](https://github.com/dotnet/corefx/blob/master/src/System.Runtime/ref/System.Runtime.cs)
