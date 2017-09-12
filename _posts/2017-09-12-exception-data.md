---
layout: post
title: "Exception.Data 为异常添加更多调试信息"
date: 2017-09-12 15:44:36 +0800
categories: dotnet
---

我们抛出异常是为了知道程序中目前的状态发生了错误。为了能够知道错误的详细信息便于我们将来避免产生这样的错误，我们会选用合适的异常类型，在异常中编写易于理解的 message 信息。但是有时我们需要更多的信息进行调试才能帮忙在将来避免这个异常。

---

`System.Exception` 类中就自带了这样的属性 `Data`，它是 `IDictionary` 类型的：

```CSharp
public virtual IDictionary Data { 
    [System.Security.SecuritySafeCritical]  // auto-generated
    get {
        if (_data == null)
            if (IsImmutableAgileException(this))
                _data = new EmptyReadOnlyDictionaryInternal();
            else
                _data = new ListDictionaryInternal();
        
        return _data;
    }
}
```

*别问我为什么把括号放最右边，那是微软自己写的源码* [点击这里查看](http://referencesource.microsoft.com/#mscorlib/system/exception.cs,150)

最近在调试 .Net Framework 内部代码的异常时就发现微软就是使用这个属性储存异常的更多细节的：

```CSharp
internal void RegisterStylusDeviceCore(StylusDevice stylusDevice)
{
    lock (__stylusDeviceLock)
    {
        int stylusDeviceId = stylusDevice.Id;
        // The map must contain unique entries for each stylus device.
        if (__stylusDeviceMap.ContainsKey(stylusDeviceId))
        {
            InvalidOperationException ioe = new InvalidOperationException();
            // We add a tag here so we can check for this specific exception
            // in TabletCollection when adding new tablet devices.
            ioe.Data.Add("System.Windows.Input.StylusLogic", "");
            throw(ioe);
        }
        __stylusDeviceMap[stylusDeviceId] = stylusDevice;
    }
}
```

*以上代码出自 .Net Framework 4.6 的* `System.Windows.Input.StylusLogic` *类型，http://referencesource.microsoft.com 里 .Net Framework 4.7 中找不到。*

需要注意的是，`Exception` 的 `ToString()` 方法并不会把这个字典转成字符串的任意一个部分；所以，如果需要在日志中记录程序中全局捕获的异常，需要自己去遍历异常中的 `Data` 的每一项。不过，为了解决掉更多的程序错误，我们记录日志的时候不已经写了更多的信息（比如 `InnerException`）了吗？
