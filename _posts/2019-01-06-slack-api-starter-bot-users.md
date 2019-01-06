---
title: "Slack 开发入门之 Bot User：Slack 机器人"
date: 2019-01-06 16:58:16 +0800
categories: slack web
position: starter
published: false
---

一个工程师团队使用 Slack 进行团队协作比 QQ / 微信流的效率高多啦。除了基本的 IM 之外，它的扩展性也是非常重要的一点。

---

<div id="toc"></div>

### 创建一个新的 Slack 应用

如果你已经创建了一个 Slack 应用，可以跳过这一节。

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

![五种不同的应用类型](/static/posts/2019-01-06-14-16-48.png)

### 创建 Bot Users 应用

本文，我们选中 Bot Users。

或者如果这已经是你创建好的应用了，可以左边的列表中选择 Bot Users。

然后点击按钮 [Add a Bot User] 之后，再点击 [Add Bot User]。

![添加新 Bot User](/static/posts/2019-01-06-15-27-20.png)

如果顶部有提示因为权限问题需要重新安装，那么就点进去重新安装。

![提示重新安装](/static/posts/2019-01-06-15-28-41.png)

在安装完应用之后，就可以在 Slack 的 Apps 界面中看到自己的机器人了（虽然实际上我们还没有开始开发）。

![看到机器人](/static/posts/2019-01-06-16-52-17.png)

### 开始开发机器人

---

#### 参考资料

- [Enabling interactions with bots - Slack](https://api.slack.com/bot-users)
