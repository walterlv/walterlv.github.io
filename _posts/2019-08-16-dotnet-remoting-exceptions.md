---
title: "在使用 .NET Remoting 技术开发跨进程通信时可能遇到的各种异常"
publishDate: 2019-08-19 08:44:13 +0800
date: 2019-08-29 15:02:19 +0800
categories: dotnet
position: problem
---

在使用 .NET Remoting 开发跨进程应用的时候，你可能会遇到一些异常。因为这些异常在后验的时候非常简单但在一开始有各种异常烦扰的时候却并不清晰，所以我将这些异常整理到此文中，方便小伙伴们通过搜索引擎查阅。

---

<div id="toc"></div>

## 连接到 IPC 端口失败: 系统找不到指定的文件。

> System.Runtime.Remoting.RemotingException:“连接到 IPC 端口失败: 系统找不到指定的文件。”

或者英文版：

> System.Runtime.Remoting.RemotingException: Failed to connect to an IPC Port: The system cannot find the file specified.

出现此异常时，说明你获取到了一个远端对象，但是在使用此对象的时候，甚至还没有注册 IPC 端口。

比如，下面的代码是注册一个 IPC 端口的一种比较粗暴的写法，传入的 `portName` 是 IPC 的 Uri 路径前缀。例如我可以传入 `walterlv`，这样一个 IPC 对象的格式大约类似 `ipc://walterlv/xxx`。

```csharp
private static void RegisterChannel(string portName)
{
    var serverProvider = new BinaryServerFormatterSinkProvider
    {
        TypeFilterLevel = TypeFilterLevel.Full,
    };
    var clientProvider = new BinaryClientFormatterSinkProvider();
    var properties = new Hashtable
    {
        ["portName"] = portName
    };
    var channel = new IpcChannel(properties, clientProvider, serverProvider);
    ChannelServices.RegisterChannel(channel, false);
}
```

当试图访问 `ipc://walterlv/foo` 对象并调用其中的方法的时候，如果连 `walterlv` 端口都没有注册，就会出现 `连接到 IPC 端口失败: 系统找不到指定的文件。` 异常。

如果你已经注册了 `walterlv` 端口，但是没有 `foo` 对象，则会出现另一个错误 `找不到请求的服务`，请看下一节。

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
