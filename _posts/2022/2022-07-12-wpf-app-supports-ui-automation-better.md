---
title: "如何让 WPF 程序更好地适配 UI 自动化"
date: 2022-07-12 15:52:53 +0800
categories: wpf dotnet windows
position: starter
---

Windows 中很早就内置了 UI 自动化机制（UIAutomation 从 Windows XP SP3 就开始提供了），WPF 第一个版本开始也提供了 UI 自动化的支持。所以按道理说如果你使用了 WPF，那么你的 UI 做准备好了随时可被自动化的准备。

---

虽说 WPF 支持不错，但我还是有几点需要说明一下：

1. 这里我说的是“UI 自动化”，而不是“UI 自动化测试”；前者比后者范围更广泛，因为前者除了能用来做 UI 自动化测试之外，还能同时应用于读屏软件，为残障人士提供方便。
2. WPF 从机制层面提供了 UI 自动化的支持，但架不住很多不了解相关机制的人意外改坏，所以本文还是很有必要说一说的。

接下来，我会从下面几个方面来说，只谈及使用层面，不深入到原理层面。

<div id="toc"></div>

## WPF 自带的 UI 自动化

为了方便演示，我使用 Visual Studio 自带的模板创建一个默认的 WPF 应用程序，我会不断修改这个程序，然后用我自己写的 UI 自动化测试软件来验证它的自动化适配效果。

### 哪些控件自带完整的 UI 自动化

Windows 上

| UIAutomation 控件名 | 对应的 WPF 控件名 | 翻译       |
| ------------------- | ----------------- | ---------- |
| button              | Button            | 按钮       |
| calendar            | Calendar          | 日历       |
| checkbox            | CheckBox          | 检查框     |
| combobox            | ComboBox          | 组合框     |
| custom              | UserControl       | 自定义控件 |
| datagrid            | DataGrid          | 数据表     |
| dataitem            | DataItem          | 数据表项   |
| document            |                   | 文档       |
| edit                | TextBox           | 文本框     |
| group               |                   | 组合       |
| header              |                   | 标题       |
| headeritem          |                   | 标题项     |
| hyperlink           |                   | 超链接     |
| image               | Image             | 图像       |
| list                | ListBox           | 列表       |
| listitem            | ListBoxItem       | 列表项     |
| menu                | Menu              | 菜单       |
| menuitem            | MenuItem          | 菜单项     |
| menubar             |                   | 菜单栏     |
| pane                |                   | 容器       |
| progressbar         | ProgressBar       | 进度条     |
| radiobutton         | RadioButton       | 单选框     |
| scrollbar           | ScrollBar         | 滚动调     |
| separator           | Separator         | 分隔符     |
| slider              | Slider            | 滑块       |
| spinner             |                   | 旋转器     |
| splitbutton         |                   | 拆分按钮   |
| statusbar           | StatusBar         | 状态栏     |
| tab                 | TabControl        | 选项卡     |
| tabitem             | TabItem           | 选项卡项   |
| table               |                   | 表格       |
| text                | TextBlock         | 文本       |
| thumb               | Thumb             |            |
| titlebar            |                   | 标题栏     |
| toolbar             | ToolBar           | 工具栏     |
| tooltip             | ToolTip           | 工具提示   |
| tree                | TreeView          | 树视图     |
| treeitem            | TreeViewItem      | 树视图项   |
| window              | Window            | 窗口       |

额外的，在新的 Windows 系统（或者 UWP/WinUI 程序里）还存在另外两种支持 UI 自动化的全新控件类型：

| UIAutomation 控件名 | 对应的 WPF 控件名 | 翻译 |
| ------------------- | ----------------- | ---- |
| semanticzoom        | SemanticZoom      |      |
| appbar              | AppBar            |      |

不过从实际测试情况来看，微软自家都已经不用这两种特殊控件了，而是使用前面那些常用控件的组合来替代这两个特殊的控件。

### WPF 自带控件的支持情况

为了直观地看到 WPF 每个自带控件对 UI 自动化的支持情况，我给刚刚创建的 WPF 程序添加了各种常见控件，然后用自己写的 UI 自动化测试软件捕获一下这个窗口。

可以发现，WPF 自带控件给 UI 自动化正确暴露了各种需要的控件。至少，给盲人用的读屏软件能准确读出所有控件的文字描述。

下面是这个直观的捕获视频：

![WPF 自带控件的支持情况](/static/posts/2022-07-11-wpf-standard-controls-ui-automation-capturing.gif)

具体来说，WPF 默认情况下有这些特点：

1. 所有可交互的控件，其整体可被捕获，而且各个可被交互的部分也可以分别被捕获（例如日历和内部按钮，树和内部的项，滚动条和内部按钮等）。
2. 控件中变化的文字部分，也正确暴露给了 UI 自动化（例如按钮内的文本，列表项文本，菜单项等）。
3. 容器与布局类的控件并没有暴露给 UI 自动化（例如 Grid、StackPanel、Border 等，并没有出现在自动化测试中）。
4. 用户控件（`UserControl`）暴露给了 UI 自动化。

### 默认情况下 WPF 属性与 UI 自动化属性的对应关系

也许有人知道，WPF 有自动化相关的一套 API 用来适配 UI 自动化的。是一套附加属性，`UIAutomationProperties.Xxx` 这样的。比如：

- `AutomationProperties.AutomationId`
- `AutomationProperties.Name`
- 还有更多……

但我们在编写控件的时候，其实并不需要主动、直接地去设置这些属性。虽然没有为这些附加属性设置值，但在暴露相关属性给 UI 自动化时，已经暴露了其他有用的属性。

比如：

- 如果你设置了控件的名称 `x:Name="WalterlvDemoButton"`，那么 UI 自动化在捕获到此控件后，其自动化 Id 就是 `WalterlvDemoButton` 了。
- 如果你设置了控件的内容（例如按钮/复选框/单选框/列表项的 `Content`，例如菜单项/选项卡的 `Header`），那么 UI 自动化在捕获到此控件后，其自动化 Name 就是对应指定的这些属性。 
- 而且即使你没有任何设置，自动化 Class 名称就是控件的类名，`IsEnabled` 就对应了控件自身的 `IsEnabled`，`IsVisible` 也对应了控件自身的 `IsVisible`。

在有了以上那么多特点作为保底的情况下，好好善用这些自带控件，做控件布局以及调整样式的时候正确按照控件原有的属性含义来做，是不需要专门针对 UI 自动化做任何适配的。然而，实际情况却并不是这样……

## 哪些情况会破坏 WPF 的 UI 自动化

很多时候，我们在写代码时，可能太过于关注最终做成了什么样子，而忽略了控件原本的层次结构和属性含义，这就可能导致我们的程序暴露给 UI 自动化测试的控件和层次结构十分诡异，甚至不可读。

下面，我列举几个例子：

1. 本来给按钮（`Button`）设置文本属性用的是 `Content` 属性，但某天想做很特别的样式，单独在模板（`Template`）里面写死了文本，而没有直接设置按钮的 `Content` 属性。这样 UI 自动化软件抓取此按钮的时候，就不知道这个按钮到底是做什么功能的按钮了，会抓到一个没有文本描述的按钮。
2. 列表或树绑定了一个源（`ItemsSource`），而这个源集合中的每一个项都是 ViewModel 中的一项（例如 `Walterlv.Demo.DemoItem` 类型），这个类型没有重写 `ToString` 方法，于是列表项暴露给 UI 自动化的名称将是重复的毫无意义的字符串（例如都是 `Walterlv.Demo.DemoItem`）。
3. 有些按钮或列表项没有任何文字描述，它们是完全由图像构成的控件。如果这个按钮还没有指定名称的话，那就跟任何其他同类按钮没有区分度了；而列表类控件在这种情况下基本无法暴露任何有用的信息。
4. 有些控件明明是想做成可交互的，却偏偏用 `Grid`、`Border` 这种布局或装饰控件来做样式，最后用 `MouseDown` 这样的通用事件来做交互。这基本上等同于放弃了自带控件的所有 UI 自动化的支持。
5. 自己做非常复杂的可交互控件（例如自己做一个画布），它继承自非常底层的 `FrameworkElement`。虽然这个控件指定了控件样式和模板，但它已经没有对 UI 自动化暴露任何有用的信息了。

后面的 4 和 5 两种，UI 自动化甚至都无法捕获到这样的控件。毕竟 WPF 默认也不太好将全部控件暴露给 UI 自动化，否则对 UI 自动化测试软件或读屏软件来说，将面临着如 WPF 可视化树般复杂和庞大的 UI 自动化树。

## WPF 适配 UI 自动化的最佳实践

在了解到 WPF UI 自动化的已有特点后，我们将以上的坑点一个个击破，就是我们推荐的最佳实践。

1. 尽量保留 WPF 自带的 UI 自动化机制，避免对样式和模板做过于复杂的定制，如果要做，则尽可能使用现成常用的属性，而不是自己定义新属性（例如用好 `Content` 而不是定义一个新的 `TitleText` 之类的）。
2. 如果某个 `ViewModel` 集合会被绑定到 UI 列表或树中，这个 `ViewModel` 应该重写 `ToString()` 方法，返回对用户可读的有用的信息（不要像控制台输出一样一股脑把所有属性打印出来）。
3. 如果某个按钮或图像没有任何文本描述，请为其设置 `x:Name` 属性以增加一个唯一的 Id；更好地，可以设置 `AutomationProperties.Name` 附加属性指定一个友好的名称供视觉障碍人士阅读。
4. 如果没有文字描述的按钮或图像在列表中，请为其设置 `AutomationProperties.Id` 属性绑定一个能区分彼此的信息作为唯一 Id，然后设置 `AutomationProperties.Name` 附加属性指定一个友好的名称供视觉障碍人士阅读。
5. 尽量使用通用控件来做控件对应的交互（例如像一个按钮那就用按钮，像一个组合框那就用组合框），而不是使用 `Grid`、`Border` 等用来布局或装饰的控件来随意处理。
6. 如果一定要做特别的控件交互（没有任何现有控件可以代表这个交互方式），那么充分利用用户控件（`UserControl`）会自动暴露给 UI 自动化的特点，做一个用户控件。相反地，如果你用用户控件仅仅只是为了拆分代码，就应该为此控件重写 `OnCreateAutomationPeer` 方法，返回 `null` 避免这个控件出现在 UI 自动化层级当中。
7. 如果还希望特别交互的控件被复用（不适合用 `UserControl`），那么你需要为这个控件重写 `OnCreateAutomationPeer` 方法，返回一个合适的 `AutomationPeer` 的实例。

```csharp
// 对于上述第 6 点，应该为用户控件重写此方法。
protected override AutomationPeer? OnCreateAutomationPeer()
{
    return null;
}
```

```csharp
public class WalterlvDemoControl : FrameworkElement
{
    // 对于上述第 7 点，应该为用户控件重写此方法。
    protected override AutomationPeer? OnCreateAutomationPeer()
    {
        return new WalterlvDemoAutomationPeer(this);
    }
}

// 自定义的 AutomationPeer。只需要继承自 FrameworkElementAutomationPeer 就可自动拥有大量现成自动化属性的支持。
public class WalterlvDemoAutomationPeer : FrameworkElementAutomationPeer
{
    public WalterlvDemoAutomationPeer(WalterlvDemoControl demo) : base(demo)
    {
    }

    // 在 AutomationControlType 里找一个最能反应你所写控件交互类型的类型，
    // 准确返回类型可以让 UI 自动化软件针对性地做一些自动化操作（例如按钮的点击），
    // 如果找不到类似的就说明是全新种类的控件，应返回 Custom。
    protected override AutomationControlType GetAutomationControlTypeCore()
    {
        return AutomationControlType.Custom;
    }

    // 针对上面返回的类型，这里给一个本地化的控件类型名。
    protected override string GetLocalizedControlTypeCore()
    {
        return "吕毅的示例控件";
    }

    // 这里的文字就类似于按钮的 Content 属性一样，是给用户“看”的，可被读屏软件读出。
    // 你可以考虑返回你某个自定义属性的值或某些自定义属性组合的值，而这个值最能向用户反映此控件当前的状态。
    protected override string GetNameCore()
    {
        return "吕毅在 https://blog.walterlv.com 中展示的博客文本。";
    }
}
```

给一个几乎都是图像组成的 `ListBox` 的 UI 自动化适配例子。在下面动图中，如果完全没有适配，那么捕获的时候只会得到完全没有区分度的 `ViewModel` 的名称，也是就 `ToString` 默认生成的类名 `Walterlv.Demo.ThemeItem`。

![UI 自动化适配效果的一个例子](/static/posts/2022-07-12-practice-for-ui-automation-of-image-based-list-box.gif)

---

**参考资料**

- [UI Automation - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32)
- [UI Automation Overview - .NET Framework - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/ui-automation/ui-automation-overview)
