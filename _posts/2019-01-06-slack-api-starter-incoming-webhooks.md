---
title: "Slack 开发入门之 Incoming Webhooks：往 Slack 的 Channel 中发消息"
date: 2019-01-06 14:40:39 +0800
categories: slack web
position: starter
---

一个工程师团队使用 Slack 进行团队协作比 QQ / 微信流的效率高多啦。除了基本的 IM 之外，它的扩展性也是非常重要的一点。

本文介绍 Slack 的开发入门：Incoming Webhooks 篇。

---

<div id="toc"></div>

### 创建一个新 Slack 应用

在这里 <https://api.slack.com/apps/new> 创建一个新的 Slack 应用：

![填写新应用信息](/static/posts/2019-01-06-14-14-32.png)

填写完两个信息之后，你就可以选择五种不同的应用类型：

- Incoming Webhooks
    - Post messages from external sources into Slack.
    - 将外部的资源作为一个消息发送到 Slack 中。
- Interactive Components
    - Add buttons to your app’s messages, and create an interactive experience for users.
    - 为 Slack 中消息添加一个按钮，以便让你的应用与用户之间可以有交互。
- Slash Commands
    - Allow users to perform app actions by typing commands in Slack.
    - 允许用户在 Slack 中敲入命令来控制应用的行为。
- Event Subscriptions
    - Make it easy for your app to respond to activity in Slack.
    - 允许你的应用响应 Slack 中的一些活动。
- Bots
    - Add a bot to allow users to exchange messages with your app.
    - 开发一个机器人，与 Slack 中的其他人进行交流。
- Permissions
    - Configure permissions to allow your app to interact with the Slack API.
    - 管理你的应用与 Slack API 之间的权限。

![五中不同的应用类型](/static/posts/2019-01-06-14-16-48.png)

### 创建 Webhooks 应用

本文，我们选中 Incoming Webhooks。

### 激活 Incoming Webhooks

按一下右上角的激活按钮，使得 Incoming Webhooks 功能激活。

![激活](/static/posts/2019-01-06-14-23-21.png)

### 添加一个 Webhook Url

继续把网页往下滑，点击 [Add New Webhook to Workspace]。

![添加一个 Webhook Url](/static/posts/2019-01-06-14-27-28.png)

然后选择需要发消息的 Channel：

![添加一个可以发消息的 Channel](/static/posts/2019-01-06-14-29-26.png)

这时，页面还会继续回到添加 Url 的地方，但示例 Demo 已经换上了真实的 Url，而且你可以复制到剪贴板。

![可以复制的新 Url](/static/posts/2019-01-06-14-31-14.png)

### 模拟发送一个消息

为了迅速验证，我们可以使用 Postman 来发送这条消息。

关于下载和使用 Postman，你可以参考我的另一篇博客：[使用 Postman 调试 ASP.NET Core 开发的 API](/post/use-postman-to-debug-asp-net-core-api.html)。

填写要 POST 的 Url，然后在消息的 Body 中填写 JSON 格式的消息内容：

```json
{
  "text": "Hi! 给你个 **任务** 玩玩。"
}
```

![使用 Postman](/static/posts/2019-01-06-14-35-41.png)

这时，点击 Send 按钮，消息发送成功。

于是我的 Slack 通道中收到了一条来自这个应用发来消息：

![看看新发送的消息](/static/posts/2019-01-06-14-38-26.png)

---

#### 参考资料

- [Enabling interactions with bots - Slack](https://api.slack.com/bot-users)
