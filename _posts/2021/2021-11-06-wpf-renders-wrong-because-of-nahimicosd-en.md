---
title: "WHAT DID DELL DO? All WPF apps are rendered in a mess!"
publishDate: 2021-11-05 20:47:55 +0800
date: 2021-11-18 19:26:02 +0800
tags: wpf
position: problem
version:
  current: English
versions:
  - 中文: /post/wpf-renders-wrong-because-of-nahimicosd.html
  - English: #
coverImage: /static/posts/2021-11-05-20-07-45.png
permalink: /posts/wpf-renders-wrong-because-of-nahimicosd-en.html
---

Recently, we have received many feedbacks from users, saying that our software interface is a mess, and there is no way to find any button locations. That's really difficult to resolve because we do nothing extra about the rendering part of our software.

This article will first give a conclusion to help you solve the problem and then show our investigation process.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

## What happened

![the UI in a mess](/static/posts/2021-11-05-20-07-45.png)

Yes, all the buttons are displayed everywhere, and covered across each other, and be positioned here and there. You can't even read any UI texts. The UI elements change and flash after your mouse move.

## The bug

*Under normal circumstances, there are indeed many reasons for WPF rendering to blow up, but most of them are just broken in a single computer. But this blog talks about some widespread rendering problems that many computers are suffering from. And this time, DELL make this happen.*

Now please check the `NahimicOSD.dll` file which is the critical key point of this rendering issue. It may be in these locations:

* C:\ProgramData\A-Volute\DellInc.AlienwareSoundCenter\Modules\ScheduledModules\NahimicOSD.dll
* C:\ProgramData\AWHeadset\DellInc.AlienwareSoundCenter\Modules\ScheduledModules\NahimicOSD.dll
* C:\ProgramData\A-Volute\A-Volute.28054DF1F58B4\Modules\ScheduledModules\NahimicOSD.dll
* C:\ProgramData\A-Volute\A-Volute.Nahimic\Modules\Scheduled\NahimicOSD.dll
* C:\ProgramData\A-Volute\Modules\ScheduledModules\NahimicOSD.dll

All of the paths above are from DELL Alienware. Also, there are some other paths but I'm not sure whether it breaks the WPF rendering.

* C:\Program Files\Nahimic\Nahimic2\UserInterface\Nahimic2OSD.dll

NahimicOSD is an on-screen display library that displays something on any software using DirectX as its rendering engine. Unfortunately, the additional rendering blooms the rendering of WPF apps (DirectX 9 application precisely).

## Solutions

1. Renaming the NahimicOSD.dll (because it cannot be deleted in case of being occupied)
2. Restart your computer (Then it will not be injected into any programs)
3. Lose your temper at this file

I've posted the issue on the DELL Alienware community and waiting for their reply and new driver update. You can see my discussions there:

* [Solved: Area-51m R2, blurred text and images in some apps - Dell Community](https://www.dell.com/community/Alienware/Area-51m-R2-blurred-text-and-images-in-some-apps/m-p/8073108#M47622)
* [m17 R2, WPF apps distorted, disappearing window contents - Dell Community](https://www.dell.com/community/Alienware/m17-R2-WPF-apps-distorted-disappearing-window-contents/m-p/8069137#M47499)
* [The WPF UI is blurring and broken while the Alienware NahimicOSD.dll injects · Issue #5708 · dotnet/wpf](https://github.com/dotnet/wpf/issues/5708)

## How did we find the reason and solutions?

Some of our software users gave feedback to us with the messing UI as attachments. Most of them were DELL devices with a 10th CPU and two graphics cards which confuses us. We tried to switch the default graphics card and tried to upgrade the graphics drivers but nothing helped.

What made changes was a special user which was using a LENOVO device. We find that the DELL Alienware Sound Center was installed on his/her computer. It seems that the DELL Alienware Sound Center is the criminal. So we dumped our software and get the proves that the NahimicOSD.dll in DELL's path was injected into our software. We deleted the NahimicOSD.dll file and everything go back to fine.

## Other discussions

[This GitHub issue](https://github.com/dotnet/wpf/issues/707) made me surprised because this was the right topic to talk about the same issue which I was concerned about. What made me surprised more is that I was one of the talkers of them two years ago but I remember nothing.

---

**References**

- [Button renders wrong after mouse leave · Issue #707 · dotnet/wpf](https://github.com/dotnet/wpf/issues/707)
- [Solved: Area-51m R2, blurred text and images in some apps - Dell Community](https://www.dell.com/community/Alienware/Area-51m-R2-blurred-text-and-images-in-some-apps/m-p/8073108#M47622)
- [m17 R2, WPF apps distorted, disappearing window contents - Dell Community](https://www.dell.com/community/Alienware/m17-R2-WPF-apps-distorted-disappearing-window-contents/m-p/8069137#M47499)


