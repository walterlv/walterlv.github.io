---
title: "解决 WPF 分组的 ItemsControl 内部控件无法被 UI 自动化识别的问题"
date: 2022-09-20 11:17:10 +0800
categories: wpf dotnet windows
position: problem
coverImage: /static/posts/2022-09-20-10-47-44.png
---

如果你试图给 WPF 的 ItemsControl 加入自动化识别，或者支持无障碍使用，会发现 ItemsControl 内的元素如果进行了分组，则只能识别到组而不能识别到元素本身。如果你正试图解决这个问题，那么本文正好能给你答案。

---

<div id="toc"></div>

## 现象

现在，我们在 ItemsControl 的内部放几个按钮并进行分组。用自动化软件去捕获它，会发现整个 ItemsControl 会被视为一个控件（如下图上方），而我们期望的是像下图下方那样可识别到内部的每一个按钮。

![ItemsControl 的自动化支持情况](/static/posts/2022-09-20-10-47-44.png)

这个例子的最简示例我已经开源到 GitHub 上了，感兴趣可以自行去看看：

- <https://github.com/walterlv/Walterlv.WpfIssues.ItemsControlAutomationIssue>

## 官方推荐的解决方法（但有 bug，无效）

官方其实有一个开关 `Switch.System.Windows.Controls.ItemsControlDoesNotSupportAutomation` 解决这个问题。但是自 .NET Framework 4.7 开始直到 .NET 6 正式版，这个开关实际上一直都不会生效。

关于如何打开这个开关，可以查看林德熙的博客：<https://blog.lindexi.com/post/WPF-Application-Compatibility-switches-list.html#switchsystemwindowscontrolsitemscontroldoesnotsupportautomation>

关于这个 bug，我已经向微软官方 GitHub 仓库提了：

- <https://github.com/dotnet/wpf/issues/6861>

后面我会解释原因。但是现在我们需要换一个新的方法来解决它。

## 临时解决方案（在官方 bug 修掉之前是最好方案）

在你的项目中增加一个自己实现的 `ItemsControl`，源码如下：

```csharp
namespace Walterlv.Windows.Controls;
// The fixed version of the ItemsControl.
public class FixedItemsControl : ItemsControl
{
    protected override AutomationPeer OnCreateAutomationPeer()
    {
        return new ItemsControlWrapperAutomationPeer(this);
    }

    private sealed class ItemsControlWrapperAutomationPeer : ItemsControlAutomationPeer
    {
        public ItemsControlWrapperAutomationPeer(ItemsControl owner) : base(owner)
        {
        }

        protected override ItemAutomationPeer CreateItemAutomationPeer(object item)
        {
            return new ItemsControlItemAutomationPeer(item, this);
        }

        protected override string GetClassNameCore()
        {
            return "ItemsControl";
        }

        protected override AutomationControlType GetAutomationControlTypeCore()
        {
            return AutomationControlType.List;
        }
    }

    private class ItemsControlItemAutomationPeer : ItemAutomationPeer
    {
        public ItemsControlItemAutomationPeer(object item, ItemsControlWrapperAutomationPeer parent)
            : base(item, parent)
        { }

        protected override AutomationControlType GetAutomationControlTypeCore()
        {
            return AutomationControlType.DataItem;
        }

        protected override string GetClassNameCore()
        {
            return "ItemsControlItem";
        }
    }
}
```

在你项目里原本需要使用到 `ItemsControl` 的地方，都换成以上这个修复版的 `FixedItemsControl` 就可以解决问题。

## 官方开关不生效的原因

会出现这个原因，是因为 `ItemsControl` 内部元素分组后，元素会在 `GroupItem` 中，`GroupItem` 重写了 `OnCreateAutomationPeer` 方法并返回了 `GroupItemAutomationPeer` 的实例。在其 `GetChhildrenCore` 方法中会试图从 `ItemsControl` 中获取它的 `ItemsControlAutomationPeer` 以返回子节点。然而在这段代码中，`itemsControl.CreateAutomationPeer()` 始终返回 `null`，所以永远没有子节点。

```csharp
// GroupItemAutomationPeer.cs
protected override List<AutomationPeer> GetChildrenCore()
{
    GroupItem owner = (GroupItem)Owner;
    ItemsControl itemsControl = ItemsControl.ItemsControlFromItemContainer(Owner);
    if (itemsControl != null)
    {
        ItemsControlAutomationPeer itemsControlAP = itemsControl.CreateAutomationPeer() as ItemsControlAutomationPeer;
        if (itemsControlAP != null)
        {
            List<AutomationPeer> children = new List<AutomationPeer>();
            // Ignore this code because in this case it will not be executed.
            return children;
        }
    }

    return null;
}
```

那 `ItemsControl` 的 `CreateAutomationPeer` 是怎么实现的呢？直接靠 `UIElement` 基类来实现。可以发现，它单独对 `ItemsControl` 判断了我们本文一开始所说的开关。

按名称进行推测，`ItemsControlDoesNotSupportAutomation` 指“ItemsControl 不支持自动化”，也就是说我们需要将其设置为 `false` 才是让它支持自动化。但实际上这个值无论设置为 `true` 还是 `false` 都不会让自动化生效。

```csharp
// UIElement.cs
protected virtual AutomationPeer OnCreateAutomationPeer()
{
    if (!AccessibilitySwitches.ItemsControlDoesNotSupportAutomation)
    {
        AutomationNotSupportedByDefaultField.SetValue(this, true);
    }
    return null;
}
```

假设设置为 `true`，那么上述方法直接返回 `null` 即不会生成自动化节点。显然不能解决问题。

假设设置为 `false`，那么会设置一个标识位 `AutomationNotSupportedByDefaultField` 为 `true`。

现在我们继续看与之相关的代码，即 `UIElement` 的 `CreateAutomationPeer` 方法。

```csharp
// UIElement.cs
// Method: CreateAutomationPeer
if (!AccessibilitySwitches.ItemsControlDoesNotSupportAutomation)
{
    // work around (ItemsControl.GroupStyle doesn't show items in groups in the UIAutomation tree)
    AutomationNotSupportedByDefaultField.ClearValue(this);
    ap = OnCreateAutomationPeer();

    // if this element returns an explicit peer (even null), use
    // it.  But if it returns null by reaching the default method
    // above, give it a second chance to create a peer.
    // [This whole dance, including the UncommonField, would be
    // unnecessary once ItemsControl implements its own override
    // of OnCreateAutomationPeer.]
    if (ap == null && !AutomationNotSupportedByDefaultField.GetValue(this))
    {
        ap = OnCreateAutomationPeerInternal();
    }
}
else
{
    ap = OnCreateAutomationPeer();
}
```

当 `ItemsControlDoesNotSupportAutomation` 标识设为 `false` 时，第一个 `if` 将进入，`OnCreateAutomationPeer` 将执行，然后将按前面的代码将 `AutomationNotSupportedByDefaultField` 标识设置为 `true`。这会导致第二个 `if` 不满足条件而退出，从而整个方法执行完毕——没有产生任何自动化节点。

而就算将 `ItemsControlDoesNotSupportAutomation` 标识设为 `true`，进入了 `else`，`OnCreateAutomationPeer` 内部也不会返回自动化节点。

于是，这个开关完全没有生效！

## 官方正在解决

在我查出以上原因之后，给官方提了此问题的修复方案，可以让这个开关正常工作。

- <https://github.com/dotnet/wpf/pull/6862>

目前这个方案正在审查中。

但在官方合并之前，可以使用我在本文第二小节中提到的方案临时解决问题。

