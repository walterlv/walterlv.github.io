---
title: "将 Direct3D11 在 GPU 中的纹理（Texture2D）导出到内存（Map）或导出成图片文件"
date: 2019-10-22 14:07:29 +0800
tags: directx sharpdx dotnet csharp
position: knowledge
permalink: /post/map-directx-surface-to-bitmap.html
---

Direct3D11 的使用通常不是应用程序唯一的部分，于是使用 Direct3D11 的代码如何与其他模块正确地组合在一起就是一个需要解决的问题。

本文介绍将 Direct3D11 在 GPU 中绘制的纹理映射到内存中，这样我们可以直接观察到此纹理是否是正确的，而不用担心是否有其他模块影响了最终的渲染过程。

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

## 来自于 Direct3D11 的渲染纹理

本文不会说如何创建或者获取来自 Direct3D11 的渲染纹理，不过如果你希望了解，可以：

- 自己创建：[WPF 使用封装的 SharpDx 控件](https://blog.lindexi.com/post/WPF-%E4%BD%BF%E7%94%A8%E5%B0%81%E8%A3%85%E7%9A%84-SharpDx-%E6%8E%A7%E4%BB%B6.html)
- 或者从其他进程/模块获取：[使用 Direct3D11 的 OpenSharedResource 方法渲染来自其他进程/设备的共享资源（SharedHandle）](/post/direct3d11-open-shared-resource)

本文接下来的内容，是在你已经获得了 `SharpDX.Direct3D11.Resource` 的引用，或者 `SharpDX.Direct3D11.Texture2D` 的前提之下。当然，如果你获得了其中任何一个实例，可以通过 COM 组件的 `QueryInterface` 方法获得其他实例。

```csharp
var texture = resource.QueryInterface<SharpDX.Direct3D11.Texture2D>();
```

```csharp
var resource = texture.QueryInterface<SharpDX.Direct3D11.Resource>();
```

## 关键代码（SharpDX.DXGI.Surface.Map）

要获得 GPU 中渲染的图片，我们必须要将其映射到内存中才行。而映射到内存中的核心代码是 `SharpDX.DXGI.Surface` 对象的 `Map` 方法。

```csharp
using (var surface = texture2D.QueryInterface<SharpDX.DXGI.Surface>())
{
    var map = surface.Map(SharpDX.DXGI.MapFlags.Read, out DataStream dataStream);
    for (var y = 0; y < surface.Description.Height; y++)
    {
        for (var x = 0; x < surface.Description.Width; x++)
        {
            // 在这里使用位图的像素数据，坐标为 (x, y)。
            // 得到此坐标下的像素指针：
            //     var ptr = ((byte*)map.DataPointer) + y * map.Pitch;
            // 得到此像素的颜色值：
            //     var b = *(ptr + 4 * x);
            //     var g = *(ptr + 4 * x + 1);
            //     var r = *(ptr + 4 * x + 2);
            //     var a = *(ptr + 4 * x + 3);
        }
    }
    dataStream.Dispose();
    surface.Unmap();
}
```

注意以上代码使用了不安全代码（指针），你需要为你的项目开启不安全代码开关，详见：

- [如何在 .NET 项目中开启不安全代码（以便启用 unsafe fixed 等关键字）](/post/allow-unsafe-code-in-dotnet-project)

## 你可能需要拷贝资源

实际上，在使用上面的代码时，你可能会遇到错误，错误出现在 `Map` 方法的调用上，描述为“参数错误”。实际上真正检查这里的两个参数时并不能发现究竟是哪个参数出了问题。

实际上出问题的参数是 `surface` 的实例。

一段 GPU 中的纹理要能够被映射到内存，必须要具有 CPU 的访问权。而是否具有 CPU 访问权在创建纹理的时候就已经确定下来了。

如果前面你得到的纹理是自己创建的，那么恭喜你，你只需要改一下创建纹理的参数就好了。给 `Texture2DDescription` 的 `CpuAccessFlags` 属性加上 `CpuAccessFlags.Read` 标识。

```csharp
desc.CpuAccessFlags = CpuAccessFlags.Read；
```

但是，如果此纹理不是由你自己创建的，那么就需要拷贝一份新的纹理了。当然，拷贝过程发生在 GPU 中，占用的也是 GPU 专用内存（即显存，如果有的话）。

拷贝需要做到两点：

1. 创建一个新的 `Texture2DDescription`（一定要是新的实例，你不能影响原来的实例），然后修改其 CPU 访问权限为 `Read`；
2. 使用 `ImmediateContext` 实例的 `CopyResource` 方法来拷贝资源（此实例可以通过 `SharpDX.Direct3D11.Device` 来找到）。

```csharp
var originalDesc = originalTexture.Description;
var desc = new Texture2DDescription
{
    CpuAccessFlags = CpuAccessFlags.Read,
    BindFlags = BindFlags.None,
    Usage = ResourceUsage.Staging,
    Width = originalDesc.Width,
    Height = originalDesc.Height,
    Format = originalDesc.Format,
    MipLevels = 1,
    ArraySize = 1,
    SampleDescription =
    {
        Count = 1,
        Quality = 0
    },
};

var texture2D = new Texture2D(device, desc);
device.ImmediateContext.CopyResource(originalTexture, texture2D);
```

需要注意，拷贝纹理会额外占用显存，一般不建议这么做，除非你真的有需求一定要 CPU 能够访问到这段纹理。

## 导出成图片文件

实际上，当你组合起来以上以上方法，你应该能够将纹理导出成图片了。

不过，为了理解更方便一些，我还是将导出成图片的全部代码贴出来：

```csharp
public static unsafe void MapTexture2DToFile(SharpDX.Direct3D11.Texture2D texture, string fileName)
{
    // 获取 Texture2D 的相关实例。
    var device = texture.Device;
    var originDesc = texture.Description;

    // 创建新的 Texture2D 对象。
    var desc = new Texture2DDescription
    {
        CpuAccessFlags = CpuAccessFlags.Read,
        BindFlags = BindFlags.None,
        Usage = ResourceUsage.Staging,
        Width = originDesc.Width,
        Height = originDesc.Height,
        Format = originDesc.Format,
        MipLevels = 1,
        ArraySize = 1,
        SampleDescription =
        {
            Count = 1,
            Quality = 0
        },
        OptionFlags = ResourceOptionFlags.Shared
    };
    var texture2D = new Texture2D(device, desc);

    // 拷贝资源。
    device.ImmediateContext.CopyResource(texture, texture2D);

    var bitmap = new System.Drawing.Bitmap(desc.Width, desc.Height);
    using (var surface = texture2D.QueryInterface<SharpDX.DXGI.Surface>())
    {
        var map = surface.Map(SharpDX.DXGI.MapFlags.Read, out DataStream dataStream);
        var lines = (int)(dataStream.Length / map.Pitch);
        var actualWidth = surface.Description.Width * 4;
        for (var y = 0; y < desc.Height; y++)
        {
            var h = desc.Height - y;
            var ptr = ((byte*)map.DataPointer) + y * map.Pitch;

            for (var x = 0; x < desc.Width; x++)
            {
                var b = *(ptr + 4 * x);
                var g = *(ptr + 4 * x + 1);
                var r = *(ptr + 4 * x + 2);
                var a = *(ptr + 4 * x + 3);
                bitmap.SetPixel(x, y, System.Drawing.Color.FromArgb(a, r, g, b));
            }
        }
        dataStream.Dispose();
        surface.Unmap();
        bitmap.Save(fileName);
    }
}
```

如果你是希望以纯软件的方式渲染到 WPF 中（WriteableBitmap），可以参考：

- [WPF 高性能位图渲染 WriteableBitmap 及其高性能用法示例](/post/wpf-high-performance-bitmap-rendering)

记得打开不安全代码开关哦！详见：

- [如何在 .NET 项目中开启不安全代码（以便启用 unsafe fixed 等关键字）](/post/allow-unsafe-code-in-dotnet-project)

---

**参考资料**

- [c++ - How to access pixels data from ID3D11Texture2D? - Stack Overflow](https://stackoverflow.com/a/47328796/6233938)
- [SharpDX Directx11 How to add normal mapping ? - Graphics and GPU Programming - GameDev.net](https://www.gamedev.net/forums/topic/692196-sharpdx-directx11-how-to-add-normal-mapping/)
- [directx 11 - How to create bitmap from Surface (SharpDX) - Stack Overflow](https://stackoverflow.com/q/16020988/6233938)
- [Desktop Duplication API - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/direct3ddxgi/desktop-dup-api?redirectedfrom=MSDN)
- [c# - Reading Datastream sharpDX Error all values are 0 - Stack Overflow](https://stackoverflow.com/q/44908867/6233938)
- [SharpDX-Samples/Program.cs at master · sharpdx/SharpDX-Samples](https://github.com/sharpdx/SharpDX-Samples/blob/master/Desktop/Direct3D11/MiniCube/Program.cs)

