---
title: "常用输入法快速输入自定义格式的时间和日期（搜狗/QQ/微软拼音）"
publishDate: 2018-08-26 16:48:08 +0800
date: 2018-12-14 09:54:00 +0800
categories: ime windows
---

几个主流的输入法输入 `rq` 或者 `sj` 都可以得到预定义格式的日期或者时间。然而他们都是预定义的格式；当我们需要一些其他格式的时候该怎么做呢？

本文将介绍几个常用输入法自定义时间和日期格式的方法。

---

主流输入法的日期格式一般是这样的：

![微软拼音](/static/posts/2018-08-26-15-49-17.png)  
▲ 微软拼音

![搜狗拼音](/static/posts/2018-08-26-15-48-07.png)  
▲ 搜狗拼音

![QQ 拼音](/static/posts/2018-08-26-15-51-53.png)  
▲ QQ 拼音

如果自定义，可以是这样：

![UTC 自定义](/static/posts/2018-08-26-15-52-50.png)  
▲ UTC 自定义

输出效果像这样：

```
2018-08-26 15:58:05
```

### 微软拼音输入法

微软拼音输入法自定义短语的方法请前往：[用微软拼音快速输入自定义格式的时间和日期](/ime/2017/09/18/date-time-format-using-microsoft-pinyin.html)。

具体的自定义字符串是：

```
%yyyy%-%MM%-%dd% %HH%:%mm%:%ss%
```

更多自定义请参阅：[自定义日期和时间格式字符串 - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/standard/base-types/custom-date-and-time-format-strings?wt.mc_id=MVP)

### 搜狗拼音输入法

搜狗输入法的自定义短语入口在这里：

![搜狗输入法自定义短语](/static/posts/2018-08-26-15-59-22.png)  
▲ 搜狗输入法自定义短语

具体的自定义字符串是：

```
#$year-$month_mm-$day_dd $fullhour:$minute:$second
```

▲ 注意前面的 `#` 是必须保留的，否则输入法不会将字符串进行转义

字符串中的 `$month` 和 `$day` 后面跟着 `mm` 和 `dd`，这跟微软拼音的思路是类似的，代表具体的格式。

- `$year` *2018*
- `$year_yy` *18*
- `$year_cn` *二零一八*
- `$year_yy_cn` *一八*
- `$month` *8*
- `$month_mm` *08*
- `$month_cn` *八*
- `$day` *6*
- `$day_dd` *06*
- `$day_cn` *六*, *二十六*
- `$weekday` *0*, *1*
- `$weekday_cn` *日*, *一*
- `$fullhour` *15* (24 小时制)
- `$halfhour` *3* (12 小时制)
- `$fullhour_cn` *十五*
- `$halfhour_cn` *三*
- `$ampm` *AM*, *PM*
- `$ampm_cn` *上午*, *下午*
- `$minute` *44*
- `$minute_cn` *四十四*
- `$second` *40*
- `$second_cn` *四十*

### QQ 拼音输入法

QQ 拼音输入法的自定义短语入口在这里：

![QQ 输入法自定义短语](/static/posts/2018-08-26-16-16-37.png)  
▲ QQ 输入法自定义短语

具体的自定义字符串是：

```
$(Year)-$(month)-$(date) $(hour):$(minute):$(second)
```
