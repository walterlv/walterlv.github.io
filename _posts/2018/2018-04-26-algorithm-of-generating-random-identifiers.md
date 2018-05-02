---
title: "冷算法：自动生成代码标识符（类名、方法名、变量名）"
date: 2018-04-26 08:04:56 +0800
categories: algorithm
---

竟然有小伙伴喜欢在编写代码时使用随机字符当作类名、方法名、变量名，例如这一篇博客里的代码：[使用 Resharper 特性 - 林德熙](https://lindexi.gitee.io/lindexi/post/%E4%BD%BF%E7%94%A8-Resharper-%E7%89%B9%E6%80%A7.html)。既然随机，那也随机得像一些啊！于是我改进了标识符的随机算法，使得生成的标识符更像真实单词的组合。

---

看看标识符的生成效果吧！0、2、4……行是 PascalCase，即首字母大写的；1、3、5……行是 camelCase 即首字母小写的。

![自动生成的标识符](/static/posts/2018-04-26-07-42-48.png)  
▲ 是不是感觉甚至能读出来？

嗯嗯，因为生成规则中考虑到了辅音和元音的组合，而且……嗯……还考虑到了部件出现的概率。

比如一个单词中的音节数，单音节概率 44%，双音节概率 31%，三音节概率 19%，四音节概率 6%。而这样的概率是通过一个幂函数来实现的。具体来说，是下面这个函数：

![音节数](/static/posts/2018-04-26-08-02-01.png)

好吧，把我的源码放出来：

```csharp
public class RandomIdentifier
{
    private readonly Random _random = new Random();

    public string Generate(bool pascal)
    {
        var builder = new StringBuilder();
        var wordCount = _random.Next(2, 4);
        for (var i = 0; i < wordCount; i++)
        {
            var syllableCount = 4 - (int) Math.Sqrt(_random.Next(0, 16));
            for (var j = 0; j < syllableCount; j++)
            {
                var consonant = Consonants[_random.Next(Consonants.Count)];
                var vowel = Vowels[_random.Next(Vowels.Count)];
                if ((pascal || i != 0) && j == 0)
                {
                    consonant = CultureInfo.CurrentCulture.TextInfo.ToTitleCase(consonant);
                }

                builder.Append(consonant);
                builder.Append(vowel);
            }
        }

        return builder.ToString();
    }

    private static readonly List<string> Consonants = new List<string>
    {
        "q","w","r","t","y","p","s","d","f","g","h","j","k","l","z","x","c","v","b","n","m",
        "w","r","t","p","s","d","f","g","h","j","k","l","c","b","n","m",
        "r","t","p","s","d","h","j","k","l","c","b","n","m",
        "r","t","s","j","c","n","m",
        "tr","dr","ch","wh","st",
        "s","s"
    };

    private static readonly List<string> Vowels = new List<string>
    {
        "a","e","i","o","u",
        "a","e","i","o","u",
        "a","e","i",
        "a","e",
        "e",
        "ar","as","ai","air","ay","al","all","aw",
        "ee","ea","ear","em","er","el","ere",
        "is","ir",
        "ou","or","oo","ou","ow",
        "ur"
    };
}
```

而使用方法，则是简单的一个调用：

```csharp
var identifier = new RandomIdentifier();
var pascal = _identifier.Generate(true);
var camel = _identifier.Generate(false);
```

传入 `true` 生成首字母大写的版本，传入 `false` 生成首字母小写的版本。
