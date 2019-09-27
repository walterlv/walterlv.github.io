---
title: "推荐几款连字字体，在代码编辑器中启用连字字体（Visual Studio Code）"
publishDate: 2019-07-31 08:52:52 +0800
date: 2019-09-27 10:04:33 +0800
categories: windows vscode visualstudio dotnet
position: starter
---

启用转为编程设计的连字字体，可以给你的变成带来不一样的体验。

---

<div id="toc"></div>

## 连字字体

微软随 [Windows Terminal](https://github.com/microsoft/terminal) 设计了一款新的字体 Cascadia Code，而这是一款连字字体。

- [microsoft/cascadia-code: This is a fun, new monospaced font that includes programming ligatures and is designed to enhance the modern look and feel of the Windows Terminal.](https://github.com/microsoft/cascadia-code)

你可以看到，在 Windows Terminal 的终端中，`=>` `==` `!=` 符号显示成了更容易理解的连字符号：

![Cascadia Code](/static/posts/2019-09-27-10-01-28.png)

在 Cascadia Code 发布之前，Fira Code 是一款特别火的连字字体，下面是 Fira Code 连字字体在 Visual Studio Code 中的显示效果：

![Fira Code in Visual Studio Code](/static/posts/2019-07-30-08-30-37.png)

而显示的，其实是下面这一段代码：

```csharp
x =>
{
    if (x >= 2 || x == 0)
    {
        Console.WriteLine(" >=> 欢迎访问吕毅的博客 ~~> blog.walterlv.com");
    }
}
```

## 连字字体推荐

作为微软的粉丝，当然首推 [Cascadia Code](https://github.com/microsoft/cascadia-code)！不过我喜欢比较细的字体风格，目前 Cascadia Code 还没有提供细体，因此我可能还需要等一些时间才正式入坑。

在这里可以关注 Cascadia Code 的状态：

- [microsoft/cascadia-code: This is a fun, new monospaced font that includes programming ligatures and is designed to enhance the modern look and feel of the Windows Terminal.](https://github.com/microsoft/cascadia-code)

灵台，你也可以在这里找到其他一些好看的用于编程的连字字体：

- [8 Best monospace programming fonts with ligatures as of 2019 - Slant](https://www.slant.co/topics/5611/~monospace-programming-fonts-with-ligatures#2)

相关的开源项目链接：

- [tonsky/FiraCode: Monospaced font with programming ligatures](https://github.com/tonsky/FiraCode)
- [i-tu/Hasklig: Hasklig - a code font with monospaced ligatures](https://github.com/i-tu/Hasklig)
- [be5invis/Iosevka: Slender typeface for code, from code.](https://github.com/be5invis/Iosevka)
- [Victor Mono](https://rubjo.github.io/victor-mono/)

以 Fira Code 为例安装的话，去它的 GitHub 的 release 页面：

- [Releases · tonsky/FiraCode](https://github.com/tonsky/FiraCode/releases)

下载最新的发布文件 [FiraCode_1.207.zip](https://github.com/tonsky/FiraCode/releases/download/1.207/FiraCode_1.207.zip)。

下载解压后，你会看到五个不同的文件夹，这是四种不同的字体类型：

- otf (Open Type)
- ttf (True Type)
- variable_ttf (Variable True Type)
- woff (Web Open Font Format)
- woff2 (Web Open Font Format)

对于 Open Type 和 True Type 的选择，一般有对应的 Open Type 类型字体的时候就优先选择 Open Type 类型的，因为 True Type 格式是比较早期的，限制比较多，比如字符的数量受到限制，而 Open Type 是基于 Unicode 字符集来设计的新的跨平台的字体格式。

Variable True Type 是可以无极变换的 True Type 字体。

而 Web Open Font Format 主要为网络传输优化，其特点是字体均经过压缩，其大小会比较小。

我们点击进入 `otf` 文件夹，然后全选所有的字体文件，右键，安装，等待安装完成即可。

## 在编辑器中启用

### 在 Visual Studio Code 中启用

在 Visual Studio Code 中启用连字字体需要用到两个选项：

```json
"editor.fontFamily": "Fira Code Light, Consolas, Microsoft YaHei",
"editor.fontLigatures": true,
```

![打开 Visual Studio Code 设置](/static/posts/2019-07-31-08-48-38.png)

然后点击新打开的标签右上角的 `{}` 图标以打开 json 形式编辑的设置：

![使用 json 编辑设置](/static/posts/2019-07-31-08-49-46.png)

然后修改把上面两个设置增加或替换进去即可。下面是我的设置的部分截图：

![设置启用连字字体](/static/posts/2019-07-31-08-50-30.png)

### 在 Visual Studio 或其他 Windows 系统自带软件中启用

只需要将字体设置成 Fira Code 即可。

---

**参考资料**

- [Type is Beautiful » 参数化设计与字体战争：从 OpenType 1.8 说起](https://thetype.com/2016/09/10968/)
