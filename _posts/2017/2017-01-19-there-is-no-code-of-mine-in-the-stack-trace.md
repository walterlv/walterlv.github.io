---
layout: post
title: "有些异常堆栈中真没我们写的源码"
date: 2017-01-19 14:54:00 +0800
categories: dotnet
permalink: /dotnet/2017/01/19/there-is-no-code-of-mine-in-the-stack-trace.html
keywords: dotnet
description: 有时候会发生一些异常，但异常的堆栈信息中完全找不到我们自己写的源码，这样的异常到底怎么调试！
---

有时候会发生一些异常，但异常的堆栈信息中完全找不到我们自己写的源码，这样的异常到底怎么调试！

---

*本文基于 WPF on .NET Framework 4.5*

文章一开始，先列出几个异常的前几行。
```
System.ComponentModel.Win32Exception (0x80004005): Not enough quota is available to process this command.
```
```
System.Runtime.InteropServices.COMException (0x80070008): Not enough storage is available to process this command. (Exception from HRESULT: 0x80070008)
```
```
System.Runtime.InteropServices.COMException (0x88980411): Exception from HRESULT: 0x88980411
```
```
System.OutOfMemoryException: Insufficient memory to continue the execution of the program.
```

异常堆栈太长了，这里只列出一行，详细的可以看本文文末的“**[附]()**”节，免得影响大家阅读。

## 为什么会发生这些异常？

初步看这些异常，几乎都没有什么头绪，因为根本就不是从我们的代码调用中引发的。所以，如果我们不能接触到发生异常的现场的话，几乎就只剩下搜索这一条路线可走了。

### 0x80004005: 配额不足，无法处理此命令。

问题状态：尚未解决。
复现步骤：未复现，通过日志搜集。
表现现象：未复现，未收到反馈，无法得知现象；但从查阅的资料来看，极有可能是导致窗口不渲染（Window Freezes）。
猜测原因：进程用尽了操作系统允许单个进程消耗的最大数量的 User Handle。（然而拿写 10000 个文件不关闭作为 DEMO 却没有复现。）
查阅资料：

- Mysterious “Not enough quota is available to process this command” in WinRT port of DataGrid
[https://stackoverflow.com/questions/12584619/mysterious-not-enough-quota-is-available-to-process-this-command-in-winrt-port](https://stackoverflow.com/questions/12584619/mysterious-not-enough-quota-is-available-to-process-this-command-in-winrt-port)
- Not enough quota is available to process this command -WPF  
[https://stackoverflow.com/questions/20964360/not-enough-quota-is-available-to-process-this-command-wpf](https://stackoverflow.com/questions/20964360/not-enough-quota-is-available-to-process-this-command-wpf)
- （在查阅此页一天后，此页已无法访问）   
[https://support.microsoft.com/en-us/kb/327699](https://support.microsoft.com/en-us/kb/327699)
- Invisible WPF dialog filling up windows message queue?  
[https://social.msdn.microsoft.com/Forums/vstudio/en-US/6e94283a-76be-42b3-98e6-a8e18c4e43de/invisible-wpf-dialog-filling-up-windows-message-queue?forum=wpf](https://social.msdn.microsoft.com/Forums/vstudio/en-US/6e94283a-76be-42b3-98e6-a8e18c4e43de/invisible-wpf-dialog-filling-up-windows-message-queue?forum=wpf)
- Diagnosis on “Quota Exceeded” Win32Exception  
[https://stackoverflow.com/questions/10086985/diagnosis-on-quota-exceeded-win32exception](https://stackoverflow.com/questions/10086985/diagnosis-on-quota-exceeded-win32exception)
- WPF app fails to start second time  
[https://social.msdn.microsoft.com/Forums/vstudio/en-US/664f2de6-342f-4527-977e-a7e12eac8d90/wpf-app-fails-to-start-second-time-?forum=wpf](https://social.msdn.microsoft.com/Forums/vstudio/en-US/664f2de6-342f-4527-977e-a7e12eac8d90/wpf-app-fails-to-start-second-time-?forum=wpf)
- MsOfficeTracker - Not enough quota available（由于我在此页上有回复，所以此页包含了以上所有链接。）  
[https://github.com/sealuzh/PersonalAnalytics/issues/62](https://github.com/sealuzh/PersonalAnalytics/issues/62)
- Pushing the Limits of Windows: Handles  
[https://blogs.technet.microsoft.com/markrussinovich/2009/09/29/pushing-the-limits-of-windows-handles/](https://blogs.technet.microsoft.com/markrussinovich/2009/09/29/pushing-the-limits-of-windows-handles/)
- Why does my WPF application use up so many Windows handles? [closed]  
[https://stackoverflow.com/questions/25316479/why-does-my-wpf-application-use-up-so-many-windows-handles](https://stackoverflow.com/questions/25316479/why-does-my-wpf-application-use-up-so-many-windows-handles)
- The current process has used all of its system allowance of handles for Window Manager objects  
[https://social.msdn.microsoft.com/Forums/windows/en-US/73aaa1f3-30a7-4593-b299-7ec1fd582b27/the-current-process-has-used-all-of-its-system-allowance-of-handles-for-window-manager-objects?forum=winforms](https://social.msdn.microsoft.com/Forums/windows/en-US/73aaa1f3-30a7-4593-b299-7ec1fd582b27/the-current-process-has-used-all-of-its-system-allowance-of-handles-for-window-manager-objects?forum=winforms)

### 0x80070008: 存储空间不足，无法处理此命令。

问题状态：尚未解决。
复现步骤：复现一次，但难以总结步骤，其它通过日志搜集。
表现现象：从唯一的一次复现来看，会导致整个窗口无法操作，无任何响应。
问题进展：  
微软说，这是 TextInterface 的内存泄露问题，.NET Framework 4.6 解了，要升 4.6 才行。
- [https://stackoverflow.com/questions/35182703/wpf-error-when-calling-measure-not-enough-storage-is-available-to-process-thi/41341668#41341668](https://stackoverflow.com/questions/35182703/wpf-error-when-calling-measure-not-enough-storage-is-available-to-process-thi/41341668#41341668)
- [https://social.msdn.microsoft.com/Forums/vstudio/en-US/350a8d21-f361-4983-9bc3-65c71a78cb52/comexception-this-command-is-not-enough-memory-available?forum=wpf](https://social.msdn.microsoft.com/Forums/vstudio/en-US/350a8d21-f361-4983-9bc3-65c71a78cb52/comexception-this-command-is-not-enough-memory-available?forum=wpf)
- [https://connect.microsoft.com/VisualStudio/feedback/details/1468770/exception-with-textinterface](https://connect.microsoft.com/VisualStudio/feedback/details/1468770/exception-with-textinterface)

### MS.Internal.Text.TextInterface.Native.Util.ConvertHresultToException 里的 System.OutOfMemoryException

问题状态：跟进中……


## 附：异常的详细堆栈

#### 1. `System.ComponentModel.Win32Exception (0x80004005): 配额不足，无法处理此命令。`
```
System.ComponentModel.Win32Exception (0x80004005): Not enough quota is available to process this command.
   at MS.Win32.UnsafeNativeMethods.PostMessage(HandleRef hwnd, WindowMessage msg, IntPtr wparam, IntPtr lparam)
   at System.Windows.Interop.HwndTarget.UpdateWindowSettings(Boolean enableRenderTarget, Nullable`1 channelSet)
   at System.Windows.Interop.HwndTarget.UpdateWindowPos(IntPtr lParam)
   at System.Windows.Interop.HwndTarget.HandleMessage(WindowMessage msg, IntPtr wparam, IntPtr lparam)
   at System.Windows.Interop.HwndSource.HwndTargetFilterMessage(IntPtr hwnd, Int32 msg, IntPtr wParam, IntPtr lParam, Boolean& handled)
   at MS.Win32.HwndWrapper.WndProc(IntPtr hwnd, Int32 msg, IntPtr wParam, IntPtr lParam, Boolean& handled)
   at MS.Win32.HwndSubclass.DispatcherCallbackOperation(Object o)
   at System.Windows.Threading.ExceptionWrapper.InternalRealCall(Delegate callback, Object args, Int32 numArgs)
   at MS.Internal.Threading.ExceptionFilterHelper.TryCatchWhen(Object source, Delegate method, Object args, Int32 numArgs, Delegate catchHandler)
```

#### 2. `System.Runtime.InteropServices.COMException (0x80070008): 存储空间不足，无法处理此命令。 (Exception from HRESULT: 0x80070008)`
```
System.Runtime.InteropServices.COMException (0x80070008): Not enough storage is available to process this command. (Exception from HRESULT: 0x80070008)
   at System.Runtime.InteropServices.Marshal.ThrowExceptionForHRInternal(Int32 errorCode, IntPtr errorInfo)
   at System.Runtime.InteropServices.Marshal.ThrowExceptionForHR(Int32 errorCode, IntPtr errorInfo)
   at MS.Internal.Text.TextInterface.Native.Util.ConvertHresultToException(Int32 hr)
   at MS.Internal.Text.TextInterface.FontFace.GetDisplayGlyphMetrics(UInt16* pGlyphIndices, UInt32 glyphCount, GlyphMetrics* pGlyphMetrics, Single emSize, Boolean useDisplayNatural, Boolean isSideways, Single pixelsPerDip)
   at System.Windows.Media.GlyphTypeface.GlyphMetrics(UInt16* pGlyphIndices, Int32 characterCount, GlyphMetrics* pGlyphMetrics, Double emSize, Single pixelsPerDip, TextFormattingMode textFormattingMode, Boolean isSideways)
   at System.Windows.Media.GlyphTypeface.GetGlyphMetricsAndIndicesOptimized(UInt32* pCodepoints, Int32 characterCount, Double emSize, Single pixelsPerDip, UInt16[] glyphIndices, GlyphMetrics[] glyphMetrics, TextFormattingMode textFormattingMode, Boolean isSideways)
   at System.Windows.Media.GlyphTypeface.GetGlyphMetricsOptimized(CharacterBufferRange characters, Double emSize, Single pixelsPerDip, UInt16[] glyphIndices, GlyphMetrics[] glyphMetrics, TextFormattingMode textFormattingMode, Boolean isSideways)
   at System.Windows.Media.Typeface.CheckFastPathNominalGlyphs(CharacterBufferRange charBufferRange, Double emSize, Single pixelsPerDip, Double scalingFactor, Double widthMax, Boolean keepAWord, Boolean numberSubstitution, CultureInfo cultureInfo, TextFormattingMode textFormattingMode, Boolean isSideways, Boolean breakOnTabs, Int32& stringLengthFit)
   at MS.Internal.TextFormatting.SimpleRun.CreateSimpleTextRun(CharacterBufferRange charBufferRange, TextRun textRun, TextFormatterImp formatter, Int32 widthLeft, Boolean emergencyWrap, Boolean breakOnTabs, Double pixelsPerDip)
   at MS.Internal.TextFormatting.SimpleRun.Create(FormatSettings settings, CharacterBufferRange charString, TextRun textRun, Int32 cp, Int32 cpFirst, Int32 runLength, Int32 widthLeft, Int32 idealRunOffsetUnRounded, Double pixelsPerDip)
   at MS.Internal.TextFormatting.SimpleTextLine.Create(FormatSettings settings, Int32 cpFirst, Int32 paragraphWidth, Double pixelsPerDip)
   at MS.Internal.TextFormatting.TextFormatterImp.FormatLineInternal(TextSource textSource, Int32 firstCharIndex, Int32 lineLength, Double paragraphWidth, TextParagraphProperties paragraphProperties, TextLineBreak previousLineBreak, TextRunCache textRunCache)
   at MS.Internal.TextFormatting.TextFormatterImp.FormatLine(TextSource textSource, Int32 firstCharIndex, Double paragraphWidth, TextParagraphProperties paragraphProperties, TextLineBreak previousLineBreak, TextRunCache textRunCache)
   at MS.Internal.Text.Line.Format(Int32 dcp, Double width, TextParagraphProperties lineProperties, TextLineBreak textLineBreak, TextRunCache textRunCache, Boolean showParagraphEllipsis)
   at System.Windows.Controls.TextBlock.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureCell(Int32 cell, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV, Boolean& hasDesiredSizeUChanged)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureCell(Int32 cell, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV, Boolean& hasDesiredSizeUChanged)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at MS.Internal.Helper.MeasureElementWithSingleChild(UIElement element, Size constraint)
   at System.Windows.Controls.ContentPresenter.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Border.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Control.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Documents.Adorner.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Documents.AdornerLayer.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Documents.AdornerDecorator.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Window.MeasureOverrideHelper(Size constraint)
   at System.Windows.Window.MeasureOverride(Size availableSize)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.ContextLayoutManager.UpdateLayout()
   at System.Windows.ContextLayoutManager.UpdateLayoutCallback(Object arg)
   at System.Windows.Media.MediaContext.InvokeOnRenderCallback.DoWork()
   at System.Windows.Media.MediaContext.FireInvokeOnRenderCallbacks()
   at System.Windows.Media.MediaContext.RenderMessageHandlerCore(Object resizedCompositionTarget)
   at System.Windows.Media.MediaContext.RenderMessageHandler(Object resizedCompositionTarget)
   at System.Windows.Threading.ExceptionWrapper.InternalRealCall(Delegate callback, Object args, Int32 numArgs)
   at System.Windows.Threading.ExceptionWrapper.TryCatchWhen(Object source, Delegate callback, Object args, Int32 numArgs, Delegate catchHandler)
……
```

#### 3. `System.Runtime.InteropServices.COMException (0x88980411): Exception from HRESULT: 0x88980411`

```
System.Runtime.InteropServices.COMException (0x88980411): Exception from HRESULT: 0x88980411
   at System.Windows.Media.Composition.DUCE.Channel.ReleaseOnChannel(ResourceHandle handle)
   at System.Windows.Media.Composition.DUCE.MultiChannelResource.ReleaseOnChannel(Channel channel)
   at System.Windows.Media.DashStyle.System.Windows.Media.Composition.DUCE.IResource.ReleaseOnChannel(Channel channel)
   at System.Windows.Media.Pen.DashStylePropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
   at System.Windows.DependencyObject.OnPropertyChanged(DependencyPropertyChangedEventArgs e)
   at System.Windows.Freezable.OnPropertyChanged(DependencyPropertyChangedEventArgs e)
   at System.Windows.DependencyObject.NotifyPropertyChange(DependencyPropertyChangedEventArgs args)
   at System.Windows.DependencyObject.UpdateEffectiveValue(EntryIndex entryIndex, DependencyProperty dp, PropertyMetadata metadata, EffectiveValueEntry oldEntry, EffectiveValueEntry& newEntry, Boolean coerceWithDeferredReference, Boolean coerceWithCurrentValue, OperationType operationType)
   at System.Windows.DependencyObject.SetValueCommon(DependencyProperty dp, Object value, PropertyMetadata metadata, Boolean coerceWithDeferredReference, Boolean coerceWithCurrentValue, OperationType operationType, Boolean isInternal)
   at System.Windows.DependencyObject.SetValueInternal(DependencyProperty dp, Object value)
   at System.Windows.Media.Pen.set_DashStyle(DashStyle value)
   at System.Windows.Shapes.Shape.GetNaturalSize()
   at System.Windows.Shapes.Shape.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureCell(Int32 cell, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV, Boolean& hasDesiredSizeUChanged)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Control.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.StackPanel.StackMeasureHelper(IStackMeasure measureElement, IStackMeasureScrollData scrollData, Size constraint)
   at System.Windows.Controls.StackPanel.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureCell(Int32 cell, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV, Boolean& hasDesiredSizeUChanged)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at MS.Internal.Helper.MeasureElementWithSingleChild(UIElement element, Size constraint)
   at System.Windows.Controls.ContentPresenter.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Border.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Control.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureCell(Int32 cell, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV, Boolean& hasDesiredSizeUChanged)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at MS.Internal.Helper.MeasureElementWithSingleChild(UIElement element, Size constraint)
   at System.Windows.Controls.ContentPresenter.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Border.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Control.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureCell(Int32 cell, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV, Boolean& hasDesiredSizeUChanged)
   at System.Windows.Controls.Grid.MeasureCellsGroup(Int32 cellsHead, Size referenceSize, Boolean ignoreDesiredSizeU, Boolean forceInfinityV)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at MS.Internal.Helper.MeasureElementWithSingleChild(UIElement element, Size constraint)
   at System.Windows.Controls.ContentPresenter.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Grid.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Controls.Border.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at Demo.PopupRoot.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Documents.AdornerDecorator.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.Window.MeasureOverrideHelper(Size constraint)
   at System.Windows.Window.MeasureOverride(Size availableSize)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.ContextLayoutManager.UpdateLayout()
   at System.Windows.ContextLayoutManager.UpdateLayoutCallback(Object arg)
   at System.Windows.Media.MediaContext.InvokeOnRenderCallback.DoWork()
   at System.Windows.Media.MediaContext.FireInvokeOnRenderCallbacks()
   at System.Windows.Media.MediaContext.RenderMessageHandlerCore(Object resizedCompositionTarget)
   at System.Windows.Media.MediaContext.RenderMessageHandler(Object resizedCompositionTarget)
   at System.Windows.Threading.ExceptionWrapper.InternalRealCall(Delegate callback, Object args, Int32 numArgs)
   at MS.Internal.Threading.ExceptionFilterHelper.TryCatchWhen(Object source, Delegate method, Object args, Int32 numArgs, Delegate catchHandler)
```
#### 4. `System.OutOfMemoryException: Insufficient memory to continue the execution of the program.`
```
System.OutOfMemoryException: Insufficient memory to continue the execution of the program. ---> System.OutOfMemoryException: Insufficient memory to continue the execution of the program.
   at System.Runtime.InteropServices.Marshal.ThrowExceptionForHRInternal(Int32 errorCode, IntPtr errorInfo)
   at System.Runtime.InteropServices.Marshal.ThrowExceptionForHR(Int32 errorCode, IntPtr errorInfo)
   at MS.Internal.Text.TextInterface.Native.Util.ConvertHresultToException(Int32 hr)
   at MS.Internal.Text.TextInterface.TextAnalyzer.GetGlyphs(UInt16* textString, UInt32 textLength, Font font, UInt16 blankGlyphIndex, Boolean isSideways, Boolean isRightToLeft, CultureInfo cultureInfo, DWriteFontFeature[][] features, UInt32[] featureRangeLengths, UInt32 maxGlyphCount, TextFormattingMode textFormattingMode, ItemProps itemProps, UInt16* clusterMap, UInt16* textProps, UInt16* glyphIndices, UInt32* glyphProps, Int32* pfCanGlyphAlone, UInt32& actualGlyphCount)
   at MS.Internal.TextFormatting.LineServicesCallbacks.GetGlyphsRedefined(IntPtr pols, IntPtr* plsplsruns, Int32* pcchPlsrun, Int32 plsrunCount, Char* pwchText, Int32 cchText, LsTFlow textFlow, UInt16* puGlyphsBuffer, UInt32* piGlyphPropsBuffer, Int32 cgiGlyphBuffers, Int32& fIsGlyphBuffersUsed, UInt16* puClusterMap, UInt16* puCharProperties, Int32* pfCanGlyphAlone, Int32& glyphCount)
   --- End of inner exception stack trace ---
   at MS.Internal.TextFormatting.TextMetrics.FullTextLine.FormatLine(FullTextState fullText, Int32 cpFirst, Int32 lineLength, Int32 formatWidth, Int32 finiteFormatWidth, Int32 paragraphWidth, LineFlags lineFlags, FormattedTextSymbols collapsingSymbol)
   at MS.Internal.TextFormatting.TextFormatterImp.FormatLineInternal(TextSource textSource, Int32 firstCharIndex, Int32 lineLength, Double paragraphWidth, TextParagraphProperties paragraphProperties, TextLineBreak previousLineBreak, TextRunCache textRunCache)
   at MS.Internal.TextFormatting.TextFormatterImp.FormatLine(TextSource textSource, Int32 firstCharIndex, Double paragraphWidth, TextParagraphProperties paragraphProperties, TextLineBreak previousLineBreak, TextRunCache textRunCache)
   at MS.Internal.Text.Line.Format(Int32 dcp, Double width, TextParagraphProperties lineProperties, TextLineBreak textLineBreak, TextRunCache textRunCache, Boolean showParagraphEllipsis)
   at System.Windows.Controls.TextBlock.MeasureOverride(Size constraint)
   at System.Windows.FrameworkElement.MeasureCore(Size availableSize)
   at System.Windows.UIElement.Measure(Size availableSize)
   at System.Windows.ContextLayoutManager.UpdateLayout()
   at System.Windows.ContextLayoutManager.UpdateLayoutCallback(Object arg)
   at System.Windows.Media.MediaContext.InvokeOnRenderCallback.DoWork()
   at System.Windows.Media.MediaContext.FireInvokeOnRenderCallbacks()
   at System.Windows.Media.MediaContext.RenderMessageHandlerCore(Object resizedCompositionTarget)
   at System.Windows.Media.MediaContext.RenderMessageHandler(Object resizedCompositionTarget)
   at System.Windows.Media.MediaContext.Resize(ICompositionTarget resizedCompositionTarget)
   at System.Windows.Interop.HwndTarget.OnResize()
   at System.Windows.Interop.HwndTarget.HandleMessage(WindowMessage msg, IntPtr wparam, IntPtr lparam)
   at System.Windows.Interop.HwndSource.HwndTargetFilterMessage(IntPtr hwnd, Int32 msg, IntPtr wParam, IntPtr lParam, Boolean& handled)
   at MS.Win32.HwndWrapper.WndProc(IntPtr hwnd, Int32 msg, IntPtr wParam, IntPtr lParam, Boolean& handled)
   at MS.Win32.HwndSubclass.DispatcherCallbackOperation(Object o)
   at System.Windows.Threading.ExceptionWrapper.InternalRealCall(Delegate callback, Object args, Int32 numArgs)
   at MS.Internal.Threading.ExceptionFilterHelper.TryCatchWhen(Object source, Delegate method, Object args, Int32 numArgs, Delegate catchHandler)
```
