---
title: "电脑总是意外从睡眠状态唤醒，可以找出原因然后解决"
date: 2019-02-27 14:09:22 +0800
tags: windows
position: problem
---

在昏暗的夜晚，一个人躺在房间的床上，静静的思考着什么。突然间电脑屏幕亮了！什么鬼！到底是谁唤醒了我的电脑！！！

本文将介绍如何寻找唤醒电脑的真凶。

---

<div id="toc"></div>

## 调查是谁唤醒了电脑

使用命令查看上一次是谁唤醒了电脑。

```cmd
powercfg -lastwake
```

![last wake](/static/posts/2019-02-18-09-16-28.png)

从图中可知上一次唤醒我计算机的是 [英特尔® 以太网连接 I219-V 82186](https://www.intel.cn/content/www/cn/zh/products/network-io/ethernet/controllers/connection-i219-v.html)。

## 查看还有谁可以唤醒电脑

使用命令查看所有可以唤醒电脑的设备。

```cmd
powercfg -devicequery wake_armed
```

![wake armed](/static/posts/2019-02-18-09-16-46.png)

发现能唤醒我电脑的设备是键盘鼠标以及刚刚的以太网。

![wake timers](/static/posts/2019-02-18-09-17-08.png)

## 查看下一次计划的唤醒

使用命令可以查看下一次计划的唤醒。

```cmd
powercfg -waketimers
```

当然这只能查到计划的唤醒，类似鼠标键盘还有以太网这种根据硬件状态触发的唤醒是看不到的。

## 修复意外的唤醒

由于我不知道到底是谁通过以太网唤醒了我的电脑，所以我直接关掉以太网的唤醒即可。

前往设备管理器，找到刚刚发现的硬件设备，查看属性。

![设备管理器](/static/posts/2019-02-27-14-03-21.png)

然后我关闭了此设备唤醒电脑的设置。

![关闭唤醒电脑](/static/posts/2019-02-27-14-03-52.png)

---

**参考资料**

- [How to find out why your PC wakes up, and how to stop it - gHacks Tech News](https://www.ghacks.net/2013/12/31/find-pc-wakes-stop/)
