---
title: "Linux Shell 中需要转义的字符"
date: 2020-04-30 10:24:16 +0800
categories: linux
position: knowledge
---

本文整理 Linux Shell 中的转义字符。

---

在 Linux Shell 中，有很多字符是有特殊含义的，如果期望把这个字符当作普通字符来处理，需要经过 `\` 的转义。

<div id="toc"></div>

## 在双引号中即可变普通字符的特殊字符

` ` `*`

### 空格 '\ `

这是转义空格。如果路径中包含空格，那么使用 `\` 转义可以避免路径被分割成 Shell 的两个参数。

我有另一篇描述 Linux Shell 中路径空格转义相关的博客：

- [了解 Windows/Linux 下命令行/Shell 启动程序传参的区别，这下不用再担心 Windows 下启动程序传参到 Linux 下挂掉了 - walterlv](https://blog.walterlv.com/post/typing-difference-among-shells-in-different-operating-systems.html)

### 星号 '\*`

如果单独使用 `*` 将会表示当前路径下枚举的所有文件或文件夹。如果希望保持 `*` 的原意，那么将其包裹在引号内，或者使用转义 `\*`。

### 井号 `#`

表示注释。

### 换行符

在引号中，也可以直接换行。这样换行符就是字符串的一部分。

## 即便在引号中也依然被 Shell 解释的特殊字符

`"` `$` `` ` `` `\`

### 双引号 '\"'

双引号的作用是避免空格将本来属于同一段参数的字符串分割成两部分。那么如果真的需要双引号的话就需要使用 `\` 来转义。

```bash
echo "Hello \"Walterlv\""
```

这样才可以输出：`Hello "Walterlv"`。

### 反引号 `` ` ``

跟引号一样的作用。

在引号中也需要转义。

### 美元符 `\$`

在 Linux Shell 中，这是变量的引用。例如 ${x} 就是引用 `x` 变量。

```bash
$ echo "上一个程序的返回值为：\$? = $?"
上一个程序的返回值为：$? = 127
```

在引号中也需要转义。

### 反斜杠 `\`

因为 `\` 是转义字符，所以其本身的使用也必然需要转义。

在引号中也需要转义。

## 任意字符

任意字符也可以使用 `\` 转义，虽然没用，但也是一个特性。

```bash
$ echo \H\e\l\l\o\ \"\W\a\l\t\e\r\l\v\"
Hello "Walterlv"
```

---

**参考资料**

- [Escape Characters - Shell Scripting Tutorial](https://www.shellscript.sh/escape.html)
- [How to enable linux support double backslashes "\\" as the path delimiter - Stack Overflow](https://stackoverflow.com/q/9734212/6233938)
- [shell - Backslash in Path - Unix & Linux Stack Exchange](https://unix.stackexchange.com/questions/484197/backslash-in-path)
- [shell - Which characters need to be escaped when using Bash? - Stack Overflow](https://stackoverflow.com/a/20053121/6233938)
