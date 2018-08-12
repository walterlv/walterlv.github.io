---
title: "图片点击放大，你的网页也能做到！"
date_published: 2018-07-28 13:27:40 +0800
date: 2018-08-12 14:52:05 +0800
categories: site
---

我经常在博客中插入大图，然而总需要借助浏览器的滚轮缩放功能放大观看实在是不方便。于是我希望做一个点击即放大的功能。

---

下面就是一张可点击放大的图片，你可以点击试试！当然，我期望的效果是自动对所有博客中的图片生效。

![Fluent Design App Header](/static/posts/2018-07-28-11-11-16.png)  
▲ Fluent Design App Header

<div id="toc"></div>

### 创建一个用于放图片的 HTML 节点

如果你是普通的 HTML 网页，可以将下面的片段放入到你的页面中。

```html
<div id="image-cover-modal" class="image-cover-modal">
  <img id="image-cover-image" class="image-cover-modal-content">
  <div id="image-cover-caption"></div>
</div>
```

最外层是容器，里面包含一个关闭按钮，一张图片和一个图片标题。

### 为图片的 HTML 节点添加 CSS 样式

```css
.image-cover-modal {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    position: fixed;
    z-index: 30;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.9);
    transition: opacity ease 0.3s;
    pointer-events: none;
}

.model-shown {
    pointer-events: all;
    opacity: 1;
}

.image-cover-modal-content {
    display: block;
    max-width: 80%;
    max-height: 80%;
}

#image-cover-caption {
    display: block;
    position: absolute;
    width: 100%;
    height: 3rem;
    bottom: 0;
    line-height: 3rem;
    text-align: center;
    color: #fff;
    background: rgba(255, 255, 255, 0.33);
}

@media only screen and (max-width: 45rem){
    .image-cover-modal-content {
        max-width: 100%;
        max-height: 100%;
    }
}
```

### 添加放大图片的 JS 脚本

```js
// Get the DOM
var modal = document.getElementById('image-cover-modal');
var modalImg = document.getElementById("image-cover-image");
var captionText = document.getElementById("image-cover-caption");
var span = document.getElementsByClassName("image-cover-close")[0];

// When the user clicks on <span> (x), close the modal
modal.onclick = function() {
    this.classList.remove("model-shown");
}

var i;
for (i = 0; i < document.images.length; i++) {

    // Get the image and insert it inside the modal - use its "alt" text as a caption
    var img = document.images[i];

    img.onclick = function(){
        modal.classList.add("model-shown");
        modalImg.src = this.src;
        captionText.innerHTML = this.alt;
    }
}
```

### 专为 Jekyll 设计的简化版本

如果你使用 Jekyll 搭建静态网页，那么只需要修改 3 个地方：

- 在 main.css 中添加前面的 css 片段。
- 在你想要添加放大图片的页面布局（例如 post.html）中添加 {% raw %}`{% include clickable-image.html %}`{% endraw %}。
- 在 _includes 文件夹中添加一个 clickable-image.html 文件，存放以下内容。

```html
<div id="image-cover-modal" class="image-cover-modal">
  <img id="image-cover-image" class="image-cover-modal-content">
  <div id="image-cover-caption"></div>
</div>
<script>
// Get the DOM
var modal = document.getElementById('image-cover-modal');
var modalImg = document.getElementById("image-cover-image");
var captionText = document.getElementById("image-cover-caption");
var span = document.getElementsByClassName("image-cover-close")[0];

// When the user clicks on <span> (x), close the modal
modal.onclick = function() {
    this.classList.remove("model-shown");
}

var i;
for (i = 0; i < document.images.length; i++) {

    // Get the image and insert it inside the modal - use its "alt" text as a caption
    var img = document.images[i];

    img.onclick = function(){
        modal.classList.add("model-shown");
        modalImg.src = this.src;
        captionText.innerHTML = this.alt;
    }
}
</script>
```

你可以参考我的文件：

- [/_includes/clickable-image.html](https://github.com/walterlv/walterlv.github.io/blob/master/_includes/clickable-image.html)
- [/_layouts/post.html](https://github.com/walterlv/walterlv.github.io/blob/eb07c3b685f94d8ce3963fb9f4a71f6346190355/_layouts/post.html#L32)
- [/assets/css/main.css at master · walterlv/walterlv.github.io](https://github.com/walterlv/walterlv.github.io/blob/master/assets/css/main.css)

---

#### 参考资料

- [How To Create Modal Images](https://www.w3schools.com/howto/howto_css_modal_images.asp)
