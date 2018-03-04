---
title: "语义耦合（Semantic Coupling）"
date_published: 2018-02-05 18:38:45 +0800
date: 2018-02-27 19:55:14 +0800
categories: dotnet architecture
---

跟小伙伴一起重构一段 UI，试图将用户界面和业务代码分离的时候，小伙伴试图在业务代码中直接调用 UI。我们当然都知道这会产生耦合，于是小伙伴试图定义一些属性、变量或接口来解决这个耦合。虽然在代码的静态分析中，这一的耦合消失了，但我始终觉得不妥。觉得耦合依然存在，只是不再能被静态分析了。

我想到一个词——“语义耦合（Semantic Coupling）”，搜索发现也有很多小伙伴在关心这个问题。而且，从他们的文章和讨论中，我也了解到更多关于语义耦合的种类和危害。

---

### 什么是语义耦合

这是区别于常规意义上的“耦合”而言的。

即类 Foo 依赖于类 Bar，即是常规意义上的耦合。静态代码分析工具就可以为我们发现这种耦合。如果将 Bar 拆开成两个部分，一是类 Bar 的实现本身，另一个是接口 IBar；现在 Foo 依赖的是接口 IBar，那么 Foo 就没有依赖类 Bar了。在静态代码分析工具中就会发现这样的依赖就解除了。

在静态代码分析工具认为没有耦合的情况之下，如果两个类之间还**交换带有隐含意义的数据**，**假设对方已为自己完成了某种工作**，**暗示对方执行期望的代码**，那么这两个类在语义上还存在着耦合。

我们说耦合的危害是修改一个类的时候，另一个类也需要做对应的修改。显式耦合有工具帮我们做重构时的解耦，而语义上的耦合却很难有准确帮助我们的工具。一些变态的工具（例如 ReSharper）能够帮助我们解决一部分。

### 哪些代码算作语义耦合

按照上面的定义，语义耦合的概念依然模糊，但都有一个统一的核心——**在实现细节上存在依赖**，而不是在调用上存在依赖。

#### 交换带有隐含意义的数据

在这段代码中，`Bar` 依赖于 `Foo`，他们都依赖于 `FooInfo`。至少静态代码分析工具是这么认为的。

```csharp
public class Foo
{
    public void Do(object arg)
    {
        var info = (FooInfo) arg;
        // 后续代码。
    }
}

public class Bar
{
    public void Test()
    {
        var info = new FooInfo();
        _foo.Do(info);
    }
}
```

但是，其实这里的 `Foo` 也依赖于 `Bar`（反向依赖），因为 `Foo` 总假设 `Bar` 一定传了一个 `FooInfo` 类型的参数。

在这里，`Foo` 对 `Bar` 的隐式依赖就构成了“**语义耦合**”。

如何消灭这段语义耦合呢？

将 `object` 类型的参数改为 `FooInfo` 类型是一个可选方案。但是，如果此函数是为了实现某个接口，`object` 是接口中对应方法的参数类型，那就不能这么改了。此时应该审视是否应该传入这个参数，或者审视接口设计的合理性。

#### 假设对方已为自己完成了某种工作

典型的情况是要求调用某方法前先调用 `Init`。

```csharp
public class Foo
{
    private string _demo;

    public void Init()
    {
        _demo = "walterlv";
    }

    public void Demo()
    {
        Console.WriteLine(_demo.Length);
    }
}

public class Bar
{
    public void Test()
    {
        var foo = new Foo();
        foo.Init();
        foo.Demo();
    }
}
```

在这段代码中，如果 `Bar` 在使用 `Demo` 方法之前没有调用 `Init`，`Foo` 是会抛出异常的（事实上实现代码的异常不应该抛出，详情请参阅我的另一篇文章 [永远不应该让实现异常抛出 - 吕毅](/post/throws-which-exception.html#%E6%B0%B8%E8%BF%9C%E4%B8%8D%E5%BA%94%E8%AF%A5%E8%AE%A9%E5%AE%9E%E7%8E%B0%E9%94%99%E8%AF%AF%E6%8A%9B%E5%87%BA)）。类似的情况还有 `Foo` 中存在必须先赋值才能正常使用的字段/属性，或者必须按照特定的顺序调用才能正常实现的业务。

这里 `Foo` 便产生了对 `Bar` 语义上的耦合。虽然并没有明显的依赖，但几乎所有使用 `Foo` 的对象都要求要写成 `Bar.Test()` 里面的实现那样，否则用起来就不正常。

解决这里的语义耦合倒是有很多方法：

- 去掉 `Init` 方法，改到构造函数中
- 将 `Init` 改为普通的别的名称（比如 `InitializeXxx`），然后让 `Demo` 方法允许在 `_demo` 为 `null` 时正常工作（并能解释为什么正常）
- 如果初始化非常复杂必须在其他方法中实现，那么需要在 `Demo` 方法的开头进行状态预判，并抛出异常说明必须先进行初始化（毕竟通过异常报告使用错误是强有力的文档，关于使用错误，请参阅我的另一篇文章 [使用错误 - 吕毅](/post/throws-which-exception.html#%E4%BD%BF%E7%94%A8%E9%94%99%E8%AF%AF)）。

只有去掉 `Init` 方法才是真的解决了语义耦合，其他都是缓解语义耦合带来的危害。

#### 暗示对方执行期望的代码

目前主流的 MVVM 框架几乎都支持 `Message` 机制，为了解决部分情况下 `ViewModel` 的操作需要通知到 `View` 来完成的情况。

这是一个好机制，因为它在框架层完成了 `ViewModel` 对 `View` 消息的传递，避免了 `ViewModel` 对 `View` 的依赖。

但是，这个机制太万能了，以至于各种不同的开发中可能写出实际上依然在耦合的代码（名义上已经不耦合了）：

```csharp
public class DemoView : IMessageReceiver<ShowErrorInfoMessage>, IMessageReceiver<DeleteAnimationMessage>
{
    public void OnReceived(ShowIOErrorInfoMessage message)
    {
        // 弹窗显示 IO 错误。
    }

    public void OnReceived(DeleteAnimationMessage message)
    {
        // 播放某一项数据删除的动画。
    }
}

public class DemoViewModel : ViewModelBase
{
    private void Test()
    {
        try
        {
            // 执行某段业务代码。
            SendMessage(new DeleteAnimationMessage(removingItemId));
            // 继续执行某段业务代码。
        }
        catch(IOException ex)
        {
            SendMessage(new ShowIOErrorInfoMessage(ex));
        }
    }
}
```

在代码中，`ViewModel` 试图向 `View` 发送播放删除动画的消息和显示错误提示的消息，让 `View` 来播放动画并显示这些错误。

如果进行静态代码分析，`ViewModel` 依然对 `View` 没有任何依赖，但它们依然存在**语义耦合**。因为已经可以通过阅读代码来明白 `ViewModel` 正在试图播放动画和显示错误提示框。`ViewModel`**正在期望对方来为自己实现某项自己无法单独实现的功能**。

`Message` 毕竟是 MVVM 框架中一个强大的组成部分，只依赖于此机制也能够部分消除此耦合。方法是将 `DeleteAnimationMessage` 改名为 `ItemRemovingMessage`，将 `ShowIOErrorInfoMessage` 改名为 `ErrorOccurredMessage`。如此改动，那么 `ViewModel` 的代码中将不再包含任何期望 `View` 执行的逻辑，`View` 自己决定删除元素时是否播放动画（还是决定元素变灰），自己决定是否显示错误提示（还是决定自动纠正）。

这样的改动基本上没有语义耦合了，但我认为依然存在很弱的耦合，因为依然存在 `ViewModel` 试图期望 `View` 做某个任务，只是任务已经非常抽象了。

我在自己编写的 MVVM 框架中弱化了 `Message` 的机制（是非常的弱），逼迫 `ViewModel` 的实现者不要试图通知 `View` 做任何事情，而是由 `View` 的实现者决定是否对 `ViewModel` 中任务的执行结果进行反馈。

### 为什么语义耦合也有危害

直接的耦合可以在静态代码分析工具的帮助下帮助我们理清楚依赖关系并批量重构（重命名等），不过这个过程是非常痛苦的，尤其是耦合是双向的时候，或者被非常多类耦合的时候。

而语义上的耦合很难被静态代码分析工具分析出来，危害没有直接的耦合那么大，改起来也不那么痛苦。不过也有一些问题：

- 可能会隐藏着某些 BUG（尤其是在修改了被语义耦合的类时，根本就不知道对方会用怎样的方式在语义上耦合自己，改完还不一定出异常）
- 不利于单元测试（语义耦合会使得单元测试的用例变多，但可能根本就是无效或重复的；或者使得某些用例变得不可测，例如上面例子中要求单元测试播放动画或者显示错误提示框是不合理的）
- 设计上不那么好看（至少对强迫症患者来说是这样）

---

#### 参考资料

- [The Perils of Semantic Coupling - Wide Awake Developers](http://www.michaelnygard.com/blog/2015/04/the-perils-of-semantic-coupling/)
- [Semantic coupling in code - Alejandro Duarte](http://www.alejandrodu.com/blog/semantic-coupling)
