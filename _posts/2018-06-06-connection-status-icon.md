---
title: "微软 Windows 系统检测网络连通性（用于显示感叹号）竟然是通过访问一个特殊网址来实现的"
date: 2018-06-06 10:27:40 +0800
categories: windows
---

一次我走到了弱网环境中，意外地发现浏览器打开了 <http://www.msftconnecttest.com/redirect> 网址，随后右下角的网络图标出现了一枚“感叹号”。

---

<div id="toc"></div>

### 吹水的推断

从直观看来，这个网址的连通性和网络图标上的“感叹号”有着直接的联系。那么到底有没有联系呢？于是去知乎上看看，发现了[专业造轮子拉黑抢前排的轮子哥的回复](https://www.zhihu.com/question/59865134/answer/169818796)。

> **vczh** 专业造轮子，拉黑抢前排。http://gaclib.net
> 
> 这个网站是windows用来测试你有没有连上网的（  
> 编辑于 2017-05-15

而轮子哥是谁呢？Microsoft Office 团队的开发人员，所以对微软产品的一些技术性描述还是有些可信的（虽然吹水占了多数）。轮子哥不要怪我啊（逃

不过，吹水归吹水，还是需要更多地了解下这个网址。

### 官方的依据

这个网址用于检测网络连接状态，并以图标形式展示给用户。而这个图标称之为“网络连接状态图标”（Connection Status Icon，NCSI）。

自 Windows 8 开始，不同版本的 Windows 操作系统有不同的检测网络连接状态的 url，但都是通过 url 来检测的。

- Windows 10.0.15063 (1703) 至 10.0.07134 (1803)
    - <http://www.msftconnecttest.com/redirect>
- Windows 10.0.14393 (1607)
    - <http://www.msftconnecttest.com/connecttest.txt>
- Windows 8/8.1 至 10.0.15063 (1511)
    - <http://www.msftncsi.com/ncsi.txt>

而 Windows XP/Vista/7 的检测方式有些不同，但都是通过 Network Location Awareness (NLA) 方式来检测的。

关于 Windows XP/Vista/7 的检测方式，可以阅读：[Network Location Awareness (NLA) and how it relates to Windows Firewall Profiles - Networking Blog](https://blogs.technet.microsoft.com/networking/2010/09/08/network-location-awareness-nla-and-how-it-relates-to-windows-firewall-profiles/)。

### 局限性

- 如果计算机上有多张网络适配器可以工作，但只有一个探测到连通状态，那么图标上依然会有一个感叹号，即探测为“网络受限”。

---

#### 参考资料

- [开机总是有一个弹窗 http://www.msftconnecttest.com/redirect ? - 知乎](https://www.zhihu.com/question/59865134)
- [The Network Connection Status Icon - Networking Blog](https://blogs.technet.microsoft.com/networking/2012/12/20/the-network-connection-status-icon/)
- [Network Location Awareness (NLA) and how it relates to Windows Firewall Profiles - Networking Blog](https://blogs.technet.microsoft.com/networking/2010/09/08/network-location-awareness-nla-and-how-it-relates-to-windows-firewall-profiles/)
- [The Windows Network Connection Status Icon (NCSI) - markwilson.it](http://www.markwilson.co.uk/blog/2017/05/windows-network-connection-status-icon-ncsi.htm)
- [What must be unblocked for network icon to not say "no internet connection?" - Windows 10 - Spiceworks](https://community.spiceworks.com/topic/1644424-what-must-be-unblocked-for-network-icon-to-not-say-no-internet-connection?page=1#entry-5876238)
- [NLM_CONNECTIVITY enumeration (Windows)](https://msdn.microsoft.com/en-us/library/windows/desktop/aa370795%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396)
- [msftconnecttest.com - Microsoft Community](https://answers.microsoft.com/en-us/windows/forum/windows_10-networking/msftconnecttestcom/54cd5060-dbd3-4c82-b958-1a8706184a88?auth=1)
- [http://www.msftconnecttest.com/redirect](https://social.technet.microsoft.com/Forums/windows/en-US/5a696f31-04a8-4852-8050-780208263a0c/httpwwwmsftconnecttestcomredirect?forum=win10itpronetworking)
