---
title: "图片点击放大，你的网页也能做到！"
date: 2018-07-28 13:27:40 +0800
categories: jekyll
---

我经常在博客中插入大图，然而总需要借助浏览器的滚轮缩放功能放大观看实在是不方便。于是我希望做一个点击即放大的功能。

---

下面就是一张可点击放大的图片，你可以点击试试！当然，我期望的效果是自动对所有博客中的图片生效。

![Fluent Design App Header](/static/posts/2018-07-28-11-11-16.png)  
▲ Fluent Design App Header

<div id="toc"></div>

### 创建一个用于放图片的 HTML 节点

```html
<div id="image-cover-modal" class="image-cover-modal">
  <span class="image-cover-close">&times;</span>
  <img id="image-cover-image" class="image-cover-modal-content">
  <div id="image-cover-caption"></div>
</div>
```

最外层是容器，里面包含一个关闭按钮，一张图片和一个图片标题。

### 为图片的 HTML 节点添加 CSS 样式

```css
.image-cover-modal {
    display: none;
    position: fixed;
    z-index: 30;
    padding-top: 100px;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.9);
}

.image-cover-modal-content {
    margin: auto;
    display: block;
    width: 80%;
}

#image-cover-caption {
    margin: auto;
    display: block;
    text-align: center;
    color: #ccc;
    padding: 10px 0;
    height: 150px;
}

.image-cover-modal-content, #image-cover-caption { 
    animation-name: zoom;
    animation-duration: 0.3s;
}

@keyframes zoom {
    from {transform:scale(0)} 
    to {transform:scale(1)}
}

.image-cover-close {
    position: absolute;
    top: 15px;
    right: 35px;
    color: #f1f1f1;
    font-size: 2rem;
    font-weight: bold;
    transition: 0.3s;
}

.image-cover-close:hover, .image-cover-close:focus {
    color: #bbb;
    text-decoration: none;
    cursor: pointer;
}

@media only screen and (max-width: 45rem){
    .image-cover-modal-content {
        width: 100%;
    }
}
```

### 添加放大图片的 JS 脚本

```js
// 获取所需的 DOM 节点。
var modal = document.getElementById('image-cover-modal');
var modalImg = document.getElementById("image-cover-image");
var captionText = document.getElementById("image-cover-caption");
var span = document.getElementsByClassName("image-cover-close")[0];

// 为关闭按钮添加功能（事实上是点击任何地方都关闭）。
modal.onclick = function() { 
  modal.style.display = "none";
}

// 遍历页面中的每一张图片，为其添加点击事件，点击放大。
var i;
for (i = 0; i < document.images.length; i++) {

  // Get the image and insert it inside the modal - use its "alt" text as a caption
  var img = document.images[i];

  img.onclick = function(){
    modal.style.display = "block";
    modalImg.src = this.src;
    captionText.innerHTML = this.alt;
  }
}
```

---

#### 参考资料

- [How To Create Modal Images](https://www.w3schools.com/howto/howto_css_modal_images.asp)
