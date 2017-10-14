---
title: "查询已连接 Wi-Fi 的密码（入门和进阶两种方法）"
date: 2017-10-09 21:01:31 +0800
categories: windows
tags: Windows Wi-Fi wifi
description: 了解如何查询已连接 Wi-Fi 的密码
---

新买了手机或者带着朋友去好玩的地方，我自己的 Windows 10 设备连接上了 Wi-Fi，朋友也希望连接上，但是我忘记了密码怎么办？

---

### 进阶篇

其实重点并不是解决问题，而是解决问题的过程；所以使用命令行来解决这个问题当然更加炫酷一些，当然要第一个讲啦！让其他人投来羡慕的目光吧！

总共两条命令：

```powershell
netsh wlan show profiles
```

![netsh wlan show profiles](/static/posts/2017-10-09-20-48-55.png)

上图是第一条命令执行的结果，其实我们只是为了得到已记住的所有 Wi-Fi 名称而已，如果你知道名称，这一步可以省略。

```powershell
netsh wlan show profiles name="walterlv" key=Clear
```

![netsh wlan show profiles name="walterlv" key=Clear](/static/posts/2017-10-09-20-51-53.png)

第二条命令就是查看 `walterlv` 网络的信息。其中 `name` 换成你想查看的任何已记住的网络，`key` 设置为 `Clear` 是为了明文显示密码。我的 Wi-Fi 密码在图中可以看得到，被设置成了 `lvyi1009`。

### 入门篇

如果你觉得上面的方法太装了，想朴素一些，那么只需要点点鼠标即可。

打开网路和共享中心，然后点击正在连接的网络名称。

![打开网络和共享中心](/static/posts/2017-10-09-19-48-43.png)

![点击正在连接的网络名称](/static/posts/2017-10-09-20-41-55.png)

点击“无线属性”。

![无线属性](/static/posts/2017-10-09-20-54-39.png)

![无线网络属性](/static/posts/2017-10-09-20-58-19.png)

显示字符就能看到密码了。

不过这种方法只能看到当前正在连接的 Wi-Fi 网络的密码。

---

#### 参考资料
- [2 Ways To Find All Saved Wifi Passwords In Windows 10](https://www.itechtics.com/2-ways-find-saved-wifi-passwords-windows-10/)
