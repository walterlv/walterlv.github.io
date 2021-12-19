---
title: "Windows 系统的默认字体是什么？应用的默认字体是什么？"
publishDate: 2019-11-24 17:29:29 +0800
date: 2020-04-11 09:48:31 +0800
tags: windows
position: knowledge
---

作为中文应用的开发者，我们多半会认为系统的默认字体是“微软雅黑”。然而如果真的产生了这种误解，则很容易在开发本地化应用的时候踩坑。

于是本文带你了解 Windows 系统的默认字体。

---

<div id="toc"></div>

## Windows 10/8.1/8/7/Vista

Windows 操作系统的默认字体是 Segoe UI（发音为 see go 这两个单词），默认的字体大小为 9 点。

![Segoe UI](/static/posts/2019-11-18-21-29-13.png)

Segoe UI 是 Segoe 字体家族中专为显示器显示而设计的一款字体。当然，Windows 系统中的其他字体也遵循这一命名规则，带 UI 后缀的适用于界面显示，而不带 UI 后缀的适用于打印和其他排版设计。

Segoe UI包含拉丁（Latin），希腊（Greek），西里尔字母（Cyrillic）和阿拉伯（Arabic）字符，覆盖了基本的英文俄文字母、数字和一些常用符号。然而其他语言就没有了。

其他语言的默认字体分别是：

| 语言                              | 字体               |
| --------------------------------- | ------------------ |
| 日语（Japanese）                  | Yu Gothic UI       |
| 韩语（Korean）                    | Malgun Gothic      |
| 繁体中文（Chinese (Traditional)） | Microsoft JhengHei |
| 简体中文（Chinese (Simplified)）  | Microsoft YaHei    |
| 希伯来语（Hebrew）                | Gisha              |
| 泰语（Thai）                      | Leelawadee         |

[注] 经 神樹桜乃 指出，日语系统默认字体是 Yu Gothic UI 而不是 Meiryo。

Windows 操作系统在启动应用程序的时候，会根据当前系统用户的地区决定默认字体应该采用哪一个。

## Windows XP 及更早系统

早期版本的 Windows，默认字体是 Tahoma。简体中文下则是宋体。

---

**参考资料**

- [Fonts - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/uxguide/vis-fonts)
