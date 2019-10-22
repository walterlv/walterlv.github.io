---
title: "使用 Direct3D11 的 OpenSharedResource 方法渲染来自其他进程/设备的共享资源（SharedHandle）"
date: 2019-10-22 11:13:27 +0800
categories: directx dotnet
position: knowledge
---

如果你得到了一个来自于其他进程或者其他模块的 Direct3D11 的共享资源，即 SharedHandle 句柄，那么可以使用本文提到的方法将其转换成 Direct3D11 的设备和纹理，这样你可以进行后续的其他处理。

---

<div id="toc"></div>

## SharpDX

本文的代码会使用到 [SharpDX](https://www.nuget.org/packages?q=Tags%3A%22SharpDX%22) 库，因此，你需要在你的项目当中安装这些 NuGet 包：

```xml
<!-- 基础，必装 -->
<PackageReference Include="SharpDX" Version="4.2.0" />
<PackageReference Include="SharpDX.D3DCompiler" Version="4.2.0" />
<PackageReference Include="SharpDX.DXGI" Version="4.2.0" />
<PackageReference Include="SharpDX.Mathematics" Version="4.2.0" />
<PackageReference Include="SharpDX.Direct3D11" Version="4.2.0" />

<!-- 其他，可选 -->
<PackageReference Include="SharpDX.Direct2D1" Version="4.2.0" />
<PackageReference Include="SharpDX.Direct3D9" Version="4.2.0" />
```

## SharedHandle

Direct3D 支持在不同的 Direct3D 设备之间共享资源。需要设置 `ResourceOptionFlags` 为 `Shared` 的纹理才可以支持共享，当然这不是本文要说的重点。

本文要说的是，如果你拿到了一个来自于其他模块的共享资源句柄的时候，你可以如何使用它。

你的使用可能类似于这样：

```csharp
public void OnAcceleratedPaint(IntPtr sharedHandle, Int32Rect dirtyRect)
{
    // 通过 sharedHandle 进行后续的处理。
}
```

## OpenSharedResource

DirectX 中用来表示 Direct3D11 的设备类型是 `ID3D11Device`，它有一个 `OpenSharedResource` 方法可以用来打开来自于其他设备的共享资源。

对应到 SharpDX 中，用来表示 Direct3D11 的设备的类型是 `SharpDX.Direct3D11.Device`，其有一个 `OpenSharedResource<T>` 方法来打开来自于其他设备的共享资源。

我们必须要创建一个自己的 Direct3D11 设备，因为设备是不共享的，代码如下：

```csharp
var device = new SharpDX.Direct3D11.Device(DriverType.Hardware, DeviceCreationFlags.BgraSupport);
var resource = device.OpenSharedResource<SharpDX.Direct3D11.Resource>(sharedHandle);
```

## 后续操作

在得到此共享资源之后，我们可以获得更多关于此资源的描述，以及有限地使用此资源的方法。

### 获取 Texture2D

可以通过 `QueryInterface` 获取某个资源相关的 COM 对象的引用。我们拿到的共享资源是 2D 纹理的话，我们可以使用 `QueryInterface` 获取 `SharpDX.Direct3D11.Texture2D` COM 对象的引用。

```csharp
var texture = resource.QueryInterface<SharpDX.Direct3D11.Texture2D>();
```

### 获取 Texture2DDescription

可以从 `Texture2D` 的实例中获取到 `Texture2DDescription`，这是用来描述此 2D 纹理创建时的各种信息。

```csharp
// 在 DirectX 的传统代码中，通常使用 desc 来作为 Texture2DDescription 实例命名的后缀。
// 不过 C# 代码通常不这么干，这是 C++ 代码的习惯。在这里这么写是为了在得到 C++ 搜索结果的时候可以与本文所述的 C# 代码对应起来。
var desc = texture.Description;
```

### 获取 Surface

或者，我们可以获取到 2D 图面，用于做渲染、绘制等操作。当然，是否能真正进行这些操作取决于 `Texture2DDescription` 中是否允许相关的操作。

```csharp
var surface = texture2D.QueryInterface<SharpDX.DXGI.Surface>();
```

在获取到 `SharpDX.DXGI.Surface` 的 COM 组件引用之后，可以在内存中映射位图用于调试，可以参见：

- [将 Direct3D11 在 GPU 中的纹理（Texture2D）导出到内存或导出成图片文件](/post/map-directx-buffer-into-bitmap.html)

---

**参考资料**

- [c++ - Direct3D11: Sharing a texture between devices: black texture - Stack Overflow](https://stackoverflow.com/a/43347246/6233938)
- [ID3D11Device::OpenSharedResource (d3d11.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/d3d11/nf-d3d11-id3d11device-opensharedresource)
- [IDXGIResource interface (Windows)](https://msdn.microsoft.com/en-us/windows/hardware/bb174560(v=vs.110))
- [IDXGIResource (dxgi.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/dxgi/nn-dxgi-idxgiresource)
- [IUnknown::QueryInterface(Q,) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/unknwn/nf-unknwn-iunknown-queryinterface(q_))
