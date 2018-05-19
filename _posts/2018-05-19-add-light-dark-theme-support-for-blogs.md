---
title: "为博客添加可切换的暗色和亮色主题"
date: 2018-05-19 21:42:23 +0800
categories: jekyll html javascript css
---

不知从什么时候开始，越来越多的小伙伴喜欢在暗色的编辑器中编写代码；于是写博客的小伙伴们也得在博客中顺应这样的潮流，这样才能更接近平时写代码时的环境。

然而——绝大多数的技术类博客或技术文章都是亮色主题的，代码在其中以和谐但不太好看的亮色存在，或者扎眼但熟悉的暗色存在。这始终觉得不那么舒适。

于是，作为博主，我决定考虑添加亮色和暗色两种主题色的支持。如果你也喜欢这样的方式，可以读一读本文，快速 get 到修改方法。

---

<div id="toc"></div>

### 主题色改变的原理

html/css 带来的样式改变是非常简单的，html 中的 class 对应 css 中的样式即可完成各种各样的风格变化。

所以，我们考虑在 body 上额外添加一个 class，名为 `dark-theme`；运行时动态切换这个 class 的存在与否，我们便能在整个 body 范围之内切换样式。

而对于 css，我们为每一个与主题色相关的颜色添加一个与之对应的 `dark-theme` 样式。那么，我们只需要即时切换 body 的 `dark-theme` 的出现与否，就能让浏览器为我们使用全新的样式和颜色。

### 编写 css

第一个要改变的，当然是背景色了。如果原来的背景色是设置到 `body` 上的，那么我们就通过 `.dark-theme` 指定一个暗色版的背景色。

```css
body {
    background: white
}
body.dark-theme {
    background: #282c34
}
```

还有前景色。当然，我们只改颜色，其他的不改：

```css
.post-content p,
.post-content h1,
.post-content h2,
.post-content h3,
.post-content h4,
.post-content h5,
.post-content ul,
.post-content ol,
.post-content iframe,
.post-content div.post-inline {
    color: #4F4F4F;
    font-weight: 400;
}

body.dark-theme .post-content p,
body.dark-theme .post-content h1,
body.dark-theme .post-content h2,
body.dark-theme .post-content h3,
body.dark-theme .post-content h4,
body.dark-theme .post-content h5,
body.dark-theme .post-content ul,
body.dark-theme .post-content ol,
body.dark-theme .post-content iframe,
body.dark-theme .post-content div.post-inline {
    color: white
}
```

不过，在暗色背景下，我希望标题不需要加粗，只需要更亮即可：

```css
.post-content h1,
.post-content h2,
.post-content h3,
.post-content h4,
.post-content h5 {
    font-weight: 700;
    font-style: normal
}

body.dark-theme .post-content h1,
body.dark-theme .post-content h2,
body.dark-theme .post-content h3,
body.dark-theme .post-content h4,
body.dark-theme .post-content h5 {
    font-weight: 200
}
```

像这样依次改下去，直到整个页面的暗色看起来都比较协调。

当然，如果希望立即能够看到效果，应该在 `body` 上加上 `dark-theme` 这个 class。

### 编写 js

其实我们的 js 只有一句话，就是切换 `body` 上的 `dark-theme`，所以我选择直接内联。

我增加了一个按钮，直接在 `onclick` 中编写切换 class 的代码：

```html
<a title="切换黑白主题 (beta)" onclick="document.body.classList.toggle('dark-theme');">
  <span>切换黑白主题 (beta)</span>
</a>
```

这样，只需要点击这个按钮，即可完成黑白主题的切换。

### 处理第三方评论系统这样不支持动态切换主题色的部件

在我基本上改完之后，发现 Disqus 却没有办法很轻松地改掉。事实上，Disqus 的个人站点设置页面上可以选择亮色或者暗色主题，但是，那是静态的。

那么如何解决评论系统的问题呢？运行时动态切换吗？似乎没找到方法。

于是，我们可以使用设计巧妙地规避这个问题。我使用灰色背景替代之前的近黑色背景，然后加上周围的圆角；这样，第三方评论系统的样式便似乎是本就这样设计一样：

![切换 disqus 主题](/static/posts/2018-05-19-disqus-theme.gif)  
▲ 看起来还是很和谐的

### 保存主题色

简单的保存基本上就是使用 cookie，于是我准备了一个 `theme=dark` 这样的键值对。如果存在，则使用暗色，否则使用亮色。并且，在切换时设置 cookie。

于是完整的切换代码就像这样：

```html
<a href="#" title="切换黑白主题 (beta)" onclick="(function(){
    document.body.classList.toggle('dark-theme');
    if (document.body.classList.contains('dark-theme')) { document.cookie = 'theme=dark'; }
    else { document.cookie = 'theme=light'; }
})()">
    <span>切换黑白主题 (beta)</span>
</a>
<script type="text/javascript">
    if (document.cookie.split(';').filter((item) => {
        return item.includes('theme=light')
    }).length) {
        document.body.classList.remove('dark-theme');
    }
</script>
```

试试点击本文上面的“切换黑白主题”按钮吧！
