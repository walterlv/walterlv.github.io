---
layout: post
title: "找回你 C 盘丢失的空间（SpaceSniffer）"
date: 2017-09-17 15:13:33 +0800
tags: windows
permalink: /windows/2017/09/17/find-lost-space-using-space-sniffer.html
keywords: windows ScpaceSniffer C盘 空间不足
description: 使用神器 Space Sniffer，C 盘满了再也不用担心了。
---

什么鬼！C 盘空间满了！我分了 120GB 啊！！！是不是要删软件删游戏，是不是要重装系统？

![C 盘空间已满](/static/posts/2017-09-17-14-36-58.png)

尤其是程序员，那么多开发环境（Visual Studio 不说话 :)）空间占用那叫一个大啊！为了避免重装系统，我找到了一款神奇的软件——SpaceSniffer。

---

话不多说，上神器：
- SpaceSniffer 官网：[Uderzo Software SpaceSniffer](http://www.uderzo.it/main_products/space_sniffer/index.html)
- SpaceSniffer 官方下载镜像：[Download SpaceSniffer Portable](https://www.fosshub.com/SpaceSniffer.html)

下载完后解压：  
![Space Sniffer 文件夹](/static/posts/2017-09-17-14-49-11.png)

由于是绿色版，下载解压后直接运行即可。需要注意的是，为了能够发现系统文件夹中的大文件元凶，建议使用管理员权限运行。

启动后会弹出磁盘选择对话框，由于我 C 盘满了，所以我选择了 C。

![选择 C 盘](/static/posts/2017-09-17-14-50-33.png)

然后就看着它又炫酷又丑的界面慢慢等待分析吧！

![正在分析](/static/posts/2017-09-17-space-sniffer.gif)

等分析的速度放缓，则可以认为它分析完了。因为它还会随时监视文件的修改，所以分析是永远不会结束的，不用等了。我这边分析完之后，发现 AppData 目录居然占了 34.5 GB！

![分析结果](/static/posts/2017-09-17-15-01-35.png)

一层层点开，发现 Photoshop 临时文件夹占了我 26.6GB！

![Photoshop 是大头](/static/posts/2017-09-17-15-02-43.png)

于是这才发现我还开着 Photoshop，关掉它，C 盘空间恢复。

![C 盘空间恢复（计算机）](/static/posts/2017-09-17-15-04-42.png)
![C 盘空间恢复（Space Sniffer）](/static/posts/2017-09-17-15-04-04.png)

如果空间依然不够，继续一层层点开最大的的文件夹，把有问题的干掉：
- 如果是临时文件，可以关掉程序或直接删掉整个文件夹
- 如果是程序文件，则可以考虑只卸载这个程序

比如我还发现，原来 ReSharper 会占用这么大的空间……

![ReSharper](/static/posts/2017-09-17-15-06-43.png)

---

最后多说一句，不要吐槽为何我的 C 盘只有 120GB，因为我用的是 Surface pro 啊，总共就 256GB 可用。考虑到系统出问题可以随时重装，重要资料当然不会放到 C 盘。
