---
layout: post
title:  "FileShare 读取一个其它进程正在写的文件"
date:   2014-09-22 22:36:00 +0800
categories: Windows WPF
---

```CSharp
private string[] ReadLogLines(string key)
{
    FileStream fs = new FileStream(_watchingFileNameDictionary[key], FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
    StreamReader sr = new StreamReader(fs, Encoding.GetEncoding("GBK"));
    string[] lines = sr.ReadToEnd().Split(new[] {Environment.NewLine}, StringSplitOptions.RemoveEmptyEntries);
    sr.Close();
    fs.Close();
    return lines;
}
```
关键在于不单要与只读方式打开文件，而是需要共享锁，还必须要选择 FlieShare 方式为 ReadWrite。（读方与写方都需要是 ReadWrite。）

> 如果要一个程序要监视另一个程序的写入，然后读取写入的内容，可参考 FileSystemWatcher。
