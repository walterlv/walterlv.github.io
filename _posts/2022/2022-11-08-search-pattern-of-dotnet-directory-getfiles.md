---
title: "Directory.GetFiles 中传入搜索字符串（Search Pattern）的神奇规则"
date: 2022-11-08 16:50:08 +0800
categories: dotnet windows
position: knowledge
coverImage: /static/posts/2022-11-08-16-40-16.png
---

众所周知，文件名的匹配规则里同配符 `?` 代表单个字符，通配符 `*` 代表多个字符。然而，具体到 `Directory.GetFiles(string path, string searchPattern)` 方法调用时，却又有一些大家不一定知道的细节。不信？我出一道题大家试试！

---

<div id="toc"></div>

## 一道测试题

假设在调用 `Directory.GetFiles(string path, string searchPattern)` 时，`searchPattern` 传入下表左侧的字符串；请在同一行的两个文件里，能匹配上的打个勾，不能匹配的打个叉。

| 搜索字符串  | 文件 1    | 文件 2                 |
| ----------- | --------- | ---------------------- |
| `*.xls`     | book.xls  | bool.xlsx              |
| `*.ai`      | file.ai   | file.aif               |
| `file?.txt` | file1.txt | file1.txtother         |
| `file*.txt` | file1.txt | file1.txtother         |
| `*1*.txt`   | file1.txt | thisisastrangefile.txt |

5 秒后给出答案。

<br><br><br><br><br>

5

<br><br><br><br><br>

4

<br><br><br><br><br>

3

<br><br><br><br><br>

2

<br><br><br><br><br>

1

<br><br><br><br><br>

答案为：

| 行  | 匹配字符串  | 文件 1      | 文件 2                   |
| --- | ----------- | ----------- | ------------------------ |
| 1   | `*.xls`     | ✔️ book.xls  | ✔️ bool.xlsx              |
| 2   | `*.ai`      | ✔️ file.ai   | ❌ file.aif               |
| 3   | `file?.txt` | ✔️ file1.txt | ❌ file1.txtother         |
| 4   | `file*.txt` | ✔️ file1.txt | ✔️ file1.txtother         |
| 5   | `*1*.txt`   | ✔️ file1.txt | ✔️ thisisastrangefile.txt |

如果你觉得奇怪，那就不奇怪了。因为这 5 个搜索案例均来自于微软官方文档，而微软花了很大篇幅来解释为什么是这样的行为。

## 解答

第 1、2 行，不一样的地方是扩展名长度。

- 如果搜索字符串扩展名长度为 3，那么文件名里扩展名前 3 位为此扩展名的文件都将匹配上
- 如果搜索字符串扩展名长度不是 3，那么扩展名必须严格匹配

第 3、4 行，不一样 的地方是 `?` 和 `*`。

- 如果使用 `?` 匹配文件，那么文件扩展名必须完全相同才能匹配上
- 如果使用 `*` 匹配文件，那么文件扩展名以此开头的都能匹配上

第 5 行，为什么明明文件名里没有 `1` 却也能匹配上呢？

这需要简单说一下 8.3 文件名。

> 8.3文件名一种文件名规范，它主要运用于FAT文件系统中。其后继者NTFS文件系统也支持8.3文件名。这种规范之所以被称为“8.3”，是因为其文件名的特殊格式：文件名的主体部分最多只能包含8个字符，而文件扩展名最多只能包含3个字符。二者之间用“.”相连。8.3文件名的目录和文件名都仅使用大写字母，但DOS和命令提示符都不大小写敏感（当然，如果使用UNIX或类Unix等一般大小写敏感的操作系统，则应注意）。
>
> 8.3文件名必须包含主体文件名，但不必须包含扩展名，二者之间用“.”相连。但是如果输入“.”后没有输入扩展名，则“.”没有意义，会被忽略。比如12345678.会被系统保存为12345678。

为了兼容老程序，Windows 会有一个算法让 8.3 文件名与长文件名对应，具体对应方法可以参考维基百科：[8.3文件名 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/8.3%E6%96%87%E4%BB%B6%E5%90%8D)。

前面的“thisisastrangefile.txt”对应的 8.3 文件名为“THISIS~1.TXT”，而 `Directory.GetFiles` 会同时匹配长文件名和 8.3 文件名，所以，“thisisastrangefile.txt”就神奇般地被匹配上了。

以下是实测结果。图片的上方是我创建的被测文件名，下方是调用 `Directory.GetFiles` 来验证搜索结果。

![实测结果](/static/posts/2022-11-08-16-40-16.png)

## 其他说明

需要注意的是，这个匹配规则只适用于 Windows 下的 API 调用，不适用于用户在文件资源管理器中的搜索操作。搜索操作里没有这么奇怪的规则，单单就是字符串包含以及通配符而已。

---

**参考资料**

- [Directory.GetFiles Method (System.IO) - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/api/system.io.directory.getfiles)
- [8.3文件名 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/8.3%E6%96%87%E4%BB%B6%E5%90%8D)

