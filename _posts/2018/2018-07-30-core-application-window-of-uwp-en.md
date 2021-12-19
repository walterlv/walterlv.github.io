---
title: "UWP CoreApplication / Application Vs CoreApplicationView / ApplicationView Vs CoreWindow / Window"
publishDate: 2018-07-30 09:21:58 +0800
date: 2018-12-14 09:54:00 +0800
tags: uwp
version:
  current: English
versions:
  - 中文: /post/core-application-window-of-uwp.html
  - English: #
coverImage: /static/posts/2018-07-27-08-37-42.png
permalink: /post/core-application-window-of-uwp-en.html
---

I find a question on Stack Overflow [CoreApplicationView vs CoreWindow vs ApplicationView](https://stackoverflow.com/a/51585979/6233938), so I write this post for the answer.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

## The namespace

Sometimes we have to view the full class names with namespaces to determine their meanings.

- `Windows.ApplicationModel.Core.CoreApplication`
- `Windows.ApplicationModel.Core.CoreApplicationView`
- `Windows.UI.Xaml.Application`
- `Windows.UI.Core.CoreWindow`
- `Windows.UI.Xaml.Window`

Extra, if you're interested in the titlebar,

- `Windows.ApplicationModel.Core.CoreApplicationViewTitleBar`
- `Windows.UI.ViewManagement.ApplicationViewTitleBar`

Extra, if you're interested in the threading model,

- `Windows.UI.Core.CoreDispatcher`
- `Windows.UI.Xaml.DispatcherTimer`

We can split them into `Windows.ApplicationModel` and `Windows.UI`, or split them into `Core` and `Xaml`.

The `CoreApplication` and `CoreApplicationView` manage the application model, and the `Application`, `CoreWindow` and `Window` manage the application inner UI. The `CoreApplication`, `CoreApplicationView` and `CoreWindow` manages the core functions, but the `Application` and `Window` manage the XAML UI.

## From top to bottom

From top to bottom is from `Application` to `Window`, then to XAML. It's obvious that the application contains windows and the window contains the inner XAML UI. Then, what's the real relationship?

The `CoreApplication` manages all the views of a UWP application and the `CoreApplicationView` is the view that it manages directly. A `CoreApplicationView` contains a `CoreWindow` as the window and a `CoreDispatcher` as the threading model.

![UWP application view](/static/posts/2018-07-27-08-37-42.png)  
▲ UWP application view

You can read [Show multiple views for an app - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/layout/show-multiple-views?wt.mc_id=MVP) to learn how to write multiple views applications. You'll know more about the relationship between the `CoreApplication` and the `CoreApplicationView`.

`CoreWindow` is the window that we are all familiar with. 
`Windows.UI.XAML.Window` encapsulate the `CoreWindow` for easier usage. `CoreDispatcher` is the threading model based on the windows message loop. It's the `CoreDispatcher` that keeps the window to show all the time without being disposed.

## For outer or for inner

Most UWP developers are normal developers, so we should stand on their side to think about the outer and the inner. Normal UWP developers start writing code from `MainPage`, so the outer is out of the page and the inner is the XAML content of the page.

The outer part contains `CoreApplication`, `CoreApplicationView` and `CoreWindow` while the inner part contains `Application` and `Window`. Is it strange that the `Application` and the `Window` are the inner part? The reason is that they manage the XAML part of the application and the window.

The `Window` is the encapsulation of the `CoreWindow` to provide extra XAML UI functions. The same to the `ApplicationView`, it is the encapsulation of the `CoreApplication` providing extra XAML UI functions.

In details, the `CoreWindow` is the class that interop with the Windows Operating System and the UWP application model. It provides those functions such as the window size, location, the input status, etc. The `Window` is the class that provides the ability to use XAML UI for the window, such as setting the XAML content of the window, setting the titlebar of the window, or getting the `Compositor` of the window. The `CoreApplicationView` is the class that interop with the Windows Operating System and provides the mechanism of windows message loop and the ability to change the client area and the non-client area. The `ApplicationView` is the same as the `Window`, provides the ability to use XAML UI for the application.

In conclusion, the `CoreWindow` and the `CoreApplicationView` provide the low-level core functions of the operating system and the application model. The `Window` and the `ApplicationView` encapsulates them for XAML usage.

## Some usages of these concepts

I've written some other posts about UWP that take advantages of these concepts. Unfortunately, they are all not in English.

- [Create a UWP application from zero.](/post/create-uwp-app-from-zero-1)
- [Show multiple views for a UWP application](/post/show-multiple-views-for-an-uwp-app)
- [Extends the titlebar of a UWP application](/post/tips-for-customize-uwp-title-bar)

---

### References

- [Title bar customization - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/shell/title-bar?wt.mc_id=MVP)


