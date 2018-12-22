---
title: "使用 WPF 开发一个 Windows 屏幕保护程序"
date: 2018-12-22 10:21:02 +0800
categories: windows wpf
position: starter
---

最近有小伙伴问我如何可以让 Windows 静置一段时间不操作之后，显示一个特殊的界面。我想了想，屏幕保护程序可以做到这一点，而且，屏幕保护程序的开发也是非常简单的。

本文将介绍如何为 Windows 这一悠久的功能进行开发。

---

<div id="toc"></div>

### 屏幕保护程序的本质

屏幕保护程序本质上就是一个 Win32 窗口应用程序。

好了，这一节真的结束了……

![屏幕保护程序的本质](/static/posts/2018-12-22-09-58-32.png)

编译好一个窗口应用程序之后，把扩展名改为 `scr`，于是你的屏幕保护程序就做好了。

### 安装屏幕保护程序

现在，在你的 `scr` 程序上点击右键，可以看到一个 “安装” 选项，点击之后就安装了。

![安装屏幕保护程序](/static/posts/2018-12-22-10-01-29.png)

安装之后，你会立即看到我们的屏幕保护程序已经运行起来了。

![首次运行的屏幕保护程序](/static/posts/2018-12-22-10-06-36.png)

为了方便截图，我调了下窗口大小。实际上本应该是 Visual Studio 创建的空 WPF 程序的默认大小。

### 处理屏幕保护程序参数

我的屏幕保护程序是一个非常简单的程序，几乎就是默认的模板。只是，现在加上了一点文字，输出命令行参数。

```xml
<Window x:Class="Walterlv.DirextXDemo.Wpf.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        mc:Ignorable="d"
        Title="Walterlv.ScreenSaver" Height="450" Width="800">
    <Grid>
        <TextBlock x:Name="ArgsTextBlock" VerticalAlignment="Center" TextAlignment="Center" />
    </Grid>
</Window>
```

```csharp
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        var args = Environment.GetCommandLineArgs().Skip(1).ToArray();
        Args.Text = string.Join(Environment.NewLine, args);
    }
}
```

在前面的截图中，我们看到参数是 “`/p 8457636`”，这是表示此程序需要在预览窗格中进行预览。

还有其他参数，用于处理其他情况：

- `/s` 屏幕保护程序开始，或者用户点击了 “预览” 按钮
- `/c:463970` 用户点击了 “设置” 按钮
- `/p 8457636` 用户选中屏幕保护程序之后，在预览窗格中显示

![屏幕保护程序参数](/static/posts/2018-12-22-10-15-32.png)

实际上屏幕保护程序开始和预览是不同的。预览的时候，只会启动你的程序；而实际开始的时候，Windows 会先为你创建一个白色的背景，覆盖所有的屏幕，然后你的屏幕保护程序窗口显示在那个白色的背景之上。

### 请预防一些坑

你可能会发现 Windows 自带的屏幕保护程序在 `C:\Windows\System32` 文件夹中。但！那不是你放屏幕保护程序的地方！如果把你的屏幕保护程序拷贝到那个 Windows 的受信任目录下，你的程序是无法运行起来的。正确的做法，是右键，使用 “安装” 选项进行安装。

我后面附的链接中可能说屏幕保护程序还要有一些其他的要求，例如必须全屏、不要显示到任务栏等等。但那其实并不是强制性的要求，比如本文就显示了一个普通的窗口。

---

#### 参考资料

- [Create a screensaver with .NET and WPF](https://wbsimms.com/create-screensaver-net-wpf/)
