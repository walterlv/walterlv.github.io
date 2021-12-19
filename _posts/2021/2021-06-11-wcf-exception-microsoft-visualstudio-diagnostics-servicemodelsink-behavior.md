---
title: "无法加载为扩展“Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior”注册的类型"
date: 2021-06-11 14:34:28 +0800
tags: dotnet
position: problem
permalink: /post/wcf-exception-microsoft-visualstudio-diagnostics-servicemodelsink-behavior.html
---

一天，某用户反馈过来说我们的软件无法运行，我一看异常信息看到了这个：“`System.Configuration.ConfigurationErrorsException: 无法加载为扩展“Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior”注册的类型“Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior, Microsoft.VisualStudio.Diagnostics.ServiceModelSink, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a”。 (C:\Windows\Microsoft.NET\Framework\v4.0.30319\Config\machine.config line 232)`”。

---

<div id="toc"></div>

## 异常

异常的完整堆栈如下：

```csharp
System.Configuration.ConfigurationErrorsException: 无法加载为扩展“Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior”注册的类型“Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior, Microsoft.VisualStudio.Diagnostics.ServiceModelSink, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a”。 (C:\Windows\Microsoft.NET\Framework\v4.0.30319\Config\machine.config line 232)
   在 System.Configuration.BaseConfigurationRecord.EvaluateOne(String[] keys, SectionInput input, Boolean isTrusted, FactoryRecord factoryRecord, SectionRecord sectionRecord, Object parentResult)
   在 System.Configuration.BaseConfigurationRecord.Evaluate(FactoryRecord factoryRecord, SectionRecord sectionRecord, Object parentResult, Boolean getLkg, Boolean getRuntimeObject, Object& result, Object& resultRuntimeObject)
   在 System.Configuration.BaseConfigurationRecord.GetSectionRecursive(String configKey, Boolean getLkg, Boolean checkPermission, Boolean getRuntimeObject, Boolean requestIsHere, Object& result, Object& resultRuntimeObject)
   在 System.Configuration.BaseConfigurationRecord.GetSectionRecursive(String configKey, Boolean getLkg, Boolean checkPermission, Boolean getRuntimeObject, Boolean requestIsHere, Object& result, Object& resultRuntimeObject)
   在 System.Configuration.BaseConfigurationRecord.GetSectionRecursive(String configKey, Boolean getLkg, Boolean checkPermission, Boolean getRuntimeObject, Boolean requestIsHere, Object& result, Object& resultRuntimeObject)
   在 System.Configuration.BaseConfigurationRecord.GetSectionRecursive(String configKey, Boolean getLkg, Boolean checkPermission, Boolean getRuntimeObject, Boolean requestIsHere, Object& result, Object& resultRuntimeObject)
   在 System.Configuration.BaseConfigurationRecord.GetSection(String configKey)
   在 System.Configuration.ClientConfigurationSystem.System.Configuration.Internal.IInternalConfigSystem.GetSection(String sectionName)
   在 System.Configuration.ConfigurationManager.GetSection(String sectionName)
   在 System.ServiceModel.Activation.AspNetEnvironment.UnsafeGetSectionFromConfigurationManager(String sectionPath)
   在 System.ServiceModel.Activation.AspNetEnvironment.UnsafeGetConfigurationSection(String sectionPath)
   在 System.ServiceModel.Configuration.ConfigurationHelpers.UnsafeGetAssociatedSection(ContextInformation evalContext, String sectionPath)
   在 System.ServiceModel.Description.ConfigLoader.LookupCommonBehaviors(ContextInformation context)
   在 System.ServiceModel.Description.ConfigLoader.LoadServiceDescription(ServiceHostBase host, ServiceDescription description, ServiceElement serviceElement, Action`1 addBaseAddress, Boolean skipHost)
   在 System.ServiceModel.ServiceHostBase.LoadConfigurationSectionInternal(ConfigLoader configLoader, ServiceDescription description, ServiceElement serviceSection)
   在 System.ServiceModel.ServiceHostBase.ApplyConfiguration()
   在 System.ServiceModel.ServiceHost.ApplyConfiguration()
   在 System.ServiceModel.ServiceHostBase.InitializeDescription(UriSchemeKeyedCollection baseAddresses)
   在 System.ServiceModel.ServiceHost.InitializeDescription(Type serviceType, UriSchemeKeyedCollection baseAddresses)
   在 System.ServiceModel.ServiceHost..ctor(Type serviceType, Uri[] baseAddresses)
   在 Walterlv.DemoLib.IPC.WCF.Duplex.Pipe.Server..ctor(Uri address, String serverId, IClientInfoBuilder clientInfoBuilder)
   在 Walterlv.DemoApp.IPCLinks.IPCCloudLinkProvider..ctor(String identity, IClientInfoBuilder clientInfoBuilder)
   在 Walterlv.DemoApp.IPCLinks.IPCLinkProviderFactory.Build(IIPCLinkEnvironment environment, IClientInfoBuilder clientInfoBuilder)
   在 Walterlv.DemoApp.Tasks.IPCLinkInitializeStartup.RunAsync(IStartupContext context)
   在 Walterlv.DemoApp.Startup.Core.StartupTask.<>c__DisplayClass0_0.<<JoinAsync>b__0>d.MoveNext()
--- 引发异常的上一位置中堆栈跟踪的末尾 ---
   在 System.Runtime.CompilerServices.TaskAwaiter.ThrowForNonSuccess(Task task)
   在 System.Runtime.CompilerServices.TaskAwaiter.HandleNonSuccessAndDebuggerNotification(Task task)
   在 Walterlv.DemoApp.Startup.Core.StartupTask.<JoinAsync>d__0.MoveNext()
--- 引发异常的上一位置中堆栈跟踪的末尾 ---
   在 System.Runtime.CompilerServices.TaskAwaiter.ThrowForNonSuccess(Task task)
   在 System.Runtime.CompilerServices.TaskAwaiter.HandleNonSuccessAndDebuggerNotification(Task task)
   在 Walterlv.DemoApp.Startup.Core.StartupTaskWrapper.<>c__DisplayClass36_0.<<ExecuteTask>b__1>d.MoveNext()
```

## 初步探索

这个异常消息提示基本已经把表层原因说得很明白了：

```csharp
System.Configuration.ConfigurationErrorsException: 无法加载为扩展“Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior”注册的类型“Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior, Microsoft.VisualStudio.Diagnostics.ServiceModelSink, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a”。 (C:\Windows\Microsoft.NET\Framework\v4.0.30319\Config\machine.config line 232)
```

即“C:\Windows\Microsoft.NET\Framework\v4.0.30319\Config\machine.config”文件的 232 行有一个关于 `Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior` 注册的类型无法加载。我打开那个文件，看到了相关行：

```xml
<commonBehaviors><endpointBehaviors><Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior/></endpointBehaviors><serviceBehaviors><Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior/></serviceBehaviors></commonBehaviors></system.serviceModel>
```

## 修复方法

将这一行里面的 `Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior` 部分删除后问题即解决。

也就是说，这一行会变成：

```xml
<commonBehaviors><endpointBehaviors></endpointBehaviors><serviceBehaviors></serviceBehaviors></commonBehaviors></system.serviceModel>
```

至于元素开闭不匹配的问题不用关心，放到整个文件中是匹配的。（不知道是什么程序写成这样的格式化乱的 XML 文件。）

记得要以管理员权限保存。如果目标电脑没有好用的编辑器，可将其复制到桌面等低权限的目录下，编辑好再放回去。

## 额外说明

无需担心删除这一行会造成什么不良影响，因为正常情况下没有装 Visual Studio 的电脑上，这个文件本就不应该有这一行的。（感谢 @kkwpsv 在 Win7/10 虚拟机中的试验。）

至于目标电脑上究竟是为什么会导致没有 Visual Studio 时注册了一个 WCF 的行为扩展，这就不得而知了……（如果你知道，欢迎评论区教教我！）

---

**参考资料**

- [ServiceModel Registration Tool (ServiceModelReg.exe) - WCF | Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wcf/servicemodelreg-exe?redirectedfrom=MSDN)
- [What is Microsoft.VisualStudio.Diagnostics.ServiceModelSink.dll?](https://social.msdn.microsoft.com/Forums/en-US/07ed7bd1-2c73-430b-a414-9a57e3aaf371/what-is-microsoftvisualstudiodiagnosticsservicemodelsinkdll?forum=wcf)
- [.net - microsoft.visualstudio.diagnostics.servicemodelsink.dll -- present on most systems, missing on new system - Stack Overflow](https://stackoverflow.com/a/40757383/6233938)
- [visual studio 2010 - 'Microsoft.VisualStudio.Diagnostics.ServiceModelSink.Behavior' could not be loaded - Stack Overflow](https://stackoverflow.com/questions/26732621/microsoft-visualstudio-diagnostics-servicemodelsink-behavior-could-not-be-load)
- [c# - WCF and Windows Store apps, ConfigurationErrorsException - Stack Overflow](https://stackoverflow.com/questions/17001861/wcf-and-windows-store-apps-configurationerrorsexception)
- [iis 7 - WCF: Routing service and "Unable to automatically debug 'service name'. The remote procedure could not be debugged - Stack Overflow](https://stackoverflow.com/questions/6271112/wcf-routing-service-and-unable-to-automatically-debug-service-name-the-remo)

