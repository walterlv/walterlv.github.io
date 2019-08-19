---
title: "在使用 .NET Remoting 技术开发跨进程通信时可能遇到的各种异常"
date: 2019-08-19 08:44:13 +0800
categories: dotnet
position: problem
---

在使用 .NET Remoting 开发跨进程应用的时候，你可能会遇到一些异常。因为这些异常在后验的时候非常简单但在一开始有各种异常烦扰的时候却并不清晰，所以我将这些异常整理到此文中，方便小伙伴们通过搜索引擎查阅。

---

<div id="toc"></div>

## 找不到请求的服务

> System.Runtime.Remoting.RemotingException:“找不到请求的服务”

或者英文版：

> System.Runtime.Remoting.RemotingException: Requested Service not found

当出现此异常时，可能的原因有三个：

1. 要查找的远端对象尚未创建；
2. 要查找的远端对象已被回收；
3. 没有使用匹配的方法创建和访问对象。

更具体来说，对于第一种情况，就是当你试图跨进程访问某对象的时候，此对象还没有创建。你需要做的，是控制好对象创建的时机，创建对象的进程需要比访问它的进程更早完成对象的创建和封送。也就是下面的代码需要先调用。

```csharp
RemotingServices.Marshal(@object, typeof(TObject).Name, typeof(TObject));
```

而对于第二种情况，你可能需要手动处理好封送对象的生命周期。重写 `InitializeLifetimeService` 方法并返回 `null` 是一个很偷懒却有效的方法。

```csharp
namespace Walterlv.Remoting.Framework
{
    public abstract class RemoteObject : MarshalByRefObject
    {
        public sealed override object InitializeLifetimeService() => null;
    }
}
```

而对于第三种情况，你需要检查你是如何注册 .NET Remoting 通道的，创建和访问方式必须匹配。

---

**参考资料**

- [c# - .Net remoting error "Requested Service not found" - Stack Overflow](https://stackoverflow.com/questions/44373484/net-remoting-error-requested-service-not-found)
