---
title: "Good Framework Rely on Good Api —— Six API Design Principles"
publishDate: 2018-06-30 19:09:53 +0800
date: 2018-08-12 16:04:26 +0800
categories: dotnet framework
version:
  - current: English
versions:
  - 中文: /post/framework-api-design.html
  - English: #
---

We have [S.O.L.I.D](https://en.wikipedia.org/wiki/SOLID) principles of object-oriented programming, and we also have [Software design patterns](https://en.wikipedia.org/wiki/Software_design_pattern) to solve general, reusable solution to a commonly occurring problem. But we don't have public-accepted API design principles or patterns for us to develop better APIs.

But we still have many API designing experiences to conclude some design principals. This post concludes them.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

The API design principles in this post mostly come from *Practical API Design* written by Jaroslav Tulach who is the NetBeans founder. I've read the whole book but find that most knowledge is his recommendations and are scattered to be in order. So I collect the core API design recommendations into six design principles. Maybe this post will help you to evaluate your Framework and API design quality and help you to write good APIs that gives the user better experience.

<div id="toc"></div>

### What is API?

API is the short of Application programming interface. Wikipedia has a definition for it, but it's a bit hard to understand. See this link to view the definition: [Application programming interface - Wikipedia](https://en.wikipedia.org/wiki/Application_programming_interface).

We can simply treat `class`, `interface`, Property, Field, Method, and the configuration file or the protocol provided by the library as APIs.

### API design principles

Even if you don't learn anything nor read any books about API design, if you have programmed a few times long, you'll feel that some APIs are easier to use and others are not. This means that every programmer has more or less API usage experience.

So the principals concluded in this post will help us design better API for our library users.

#### Easier to understand

Some users want to use a new API and find that they must learn some new knowledge about it to write correct code. The more the user should learn new knowledge the harder the API to understand.

We can follow these tips to help us design easier-to-understand APIs:

1. Don't introduce new concept if not necessary.
1. Prevent the user to use it incorrectly.
    - Make the user cannot write incorrect code. It means you can make the code uncompilable when the user uses it incorrectly.
    - If you find that is hard to make the wrong code uncompilable, you can throw exceptions to warn the user and provide tips for him/her to fix it.
    - You'd better make wrong code ugly at the same time. e.g. Make the IDE display underlines in the wrong code.
    - If you can only warn the user in your documentation, you may tried less. It's recommended to try more to do the things above.

Moq in .NET foundation is a very good practice for *Prevent the user to use it incorrectly*. You can install and try it in [Moq in nuget.org](https://www.nuget.org/packages/Moq/).

#### Easier to find

Most of us use IDE to develop and maybe some of us use code editor such as *Visual Studio Code*, *Sublime*, *Atom*, *Notepad++* or *Vim*. Whatever you use to write code, they all have IntelliSense which can help you know more context APIs and write correct API usage code.

If we can find some new API and use it correctly via IntelliSense, we can say that the API is easier to find.

How do we find the APIs via IntelliSense?

1. When we implement a method which we don't know anything about its parameters, we can get right values we want from the arguments via the IntelliSense.
1. When we call a method which we don't know anything about its parameters, we can fetch and create what it needs via the IntelliSense.
1. When we call a method whose return value type is unfamiliar for us, we can use the return value correctly via the IntelliSense.

There is a picture below I draw to describe APIs easier or harder to find.

![Easier/Harder to Find](/static/posts/2018-06-30-15-59-13.png)  
▲ The connection lines indicates that we can know the APIs through the method parameters and the returning value.

#### Related APIs are more similar

If the similar functions have similar APIs, the API users cost very less to learn the correct usage of the new API.

You may remember the `Select` method of LINQ. And when you use LINQ to XML to read/write XML files, you'll find `Select` method, too. Their usage experiences are very similar so that you can easily know how to use `Select` in LINQ to XML if you know the LINQ.

#### Simple task have simple implementation

If you only design your APIs in the recommendation of the three principles above, your classes may be too large so that they may violate the *Single Responsibility Principle* of S.O.L.I.D. So there is another principle to prevent this being happen. That is, a simple task should have a simple implementation.

`InkCanvas` of UWP is a good practice of this principal. You can use an `InkCanvas` To accept inks by writing only a simple line:

```xml
<InkCanvas x:Name="inkCanvas" />
```

You can write more advanced functions by writing more customization code, but all of them are not necessary:

> ```csharp
> // The code below is from https://docs.microsoft.com/en-us/windows/uwp/design/input/pen-and-stylus-interactions
> 
> // Set supported inking device types.
> inkCanvas.InkPresenter.InputDeviceTypes =
>     Windows.UI.Core.CoreInputDeviceTypes.Mouse |
>     Windows.UI.Core.CoreInputDeviceTypes.Pen;
> 
> // Set initial ink stroke attributes.
> InkDrawingAttributes drawingAttributes = new InkDrawingAttributes();
> drawingAttributes.Color = Windows.UI.Colors.Black;
> drawingAttributes.IgnorePressure = false;
> drawingAttributes.FitToCurve = true;
> inkCanvas.InkPresenter.UpdateDefaultDrawingAttributes(drawingAttributes);
> ```

#### Easier to test and to be tested

Better API helps the API user easier to test his/her API usage methods.

If you provide an API with a static method such as `Config.Get("SomeKey")` to retrieve configuration values, the API user will find it hard to write unit test method because he/she cannot create fake configuration.

#### Easier to keep compatibility even if upgrading frequently

Better APIs cost less for the users to upgrade their library versions and bring less burden for the API developers to make library compatible.

There are three kind of compatibility:

- **Binary compatibility**
    - When upgrading the library, the users can run their projects without a recompile.
- **Code compatibility**
    - When upgrading the library, the users can recompile their project without any code modification.
- **Behavior compatibility**
    - When upgrading the library, the users' applications run the same as before.

We can follow these tips to help us design better-future-compatibility APIs:

1. Don't release your APIs ahead of your whole solution.
    - If you are trying to release an API for the future usage, I recommend you not to do this. Because you don’t know the future needs, the APIs have a very high probability to be changed with a heavy compatibility burden.
1. Reserve enough extension points.
    - If an API which will have more chance to change in the future has fewer extension points, the API will change more frequently. But if you reserve some designed extension points, future change will be in the control.
1. Give tips for the users to migrate legacy APIs.
    - If an API is obsolete, you'd better not to delete it immediately. It's recommended to mark it obsolete and tell the users how to migrate to the new APIs.

### Framework design

The framework can be understood as a set of APIs developed for the complete solution of a certain kind of problems.

[Avalonia](https://github.com/AvaloniaUI/Avalonia) is a cross-platform UI framework and it uses [ReactiveUI](https://github.com/reactiveui/ReactiveUI) which is a reactive UI framework to develop MVVM pattern UI.

Hope you'll design better APIs by reading the six API design principals.

---

#### References

- *Practical API Design* by Jaroslav Tulach (The NetBeans founder)
