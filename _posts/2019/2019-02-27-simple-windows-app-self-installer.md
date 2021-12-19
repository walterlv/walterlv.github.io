---
title: "制作一个极简的 .NET 客户端应用自安装或自更新程序"
publishDate: 2019-02-27 10:36:29 +0800
date: 2019-03-22 00:44:03 +0800
tags: windows dotnet csharp
position: starter
permalink: /post/simple-windows-app-self-installer.html
---

本文主要说的是 .NET 客户端应用，可以是只能在 Windows 端运行的基于 .NET Framework 或基于 .NET Core 的 WPF / Windows Forms 应用，也可以是其他基于 .NET Core 的跨平台应用。但是不是那些更新权限受到严格控制的 UWP / iOS / Android 应用。

本文将编写一个简单的程序，这个程序初次运行的时候会安装自己，如果已安装旧版本会更新自己，如果已安装最新则直接运行。

---

<div id="toc"></div>

## 自安装或自更新的思路

简单的安装过程实际上是 `解压 + 复制 + 配置 + 外部命令`。这里，我只做 `复制 + 配置 + 外部命令`，并且把 `配置 + 外部命令` 合为一个步骤。

于是：

1. 启动后，检查安装路径下是否有已经安装的程序；
1. 如果没有，则直接复制自己过去；
1. 如果有，则比较版本号，更新则复制过去。

## 本文用到的知识

- [在 Windows 系统上降低 UAC 权限运行程序（从管理员权限降权到普通用户权限） - walterlv](/post/start-process-with-lowered-uac-privileges)
- [Windows 上的应用程序在运行期间可以给自己改名（可以做 OTA 自我更新） - walterlv](/post/rename-executable-self-when-running)
- [仅反射加载（ReflectionOnlyLoadFrom）的 .NET 程序集，如何反射获取它的 Attribute 元数据呢？ - walterlv](/post/get-attributes-for-reflection-only-loaded-assembly)

## 使用

于是我写了一个简单的类型用来做自安装。创建完 `SelfInstaller` 的实例后，根据安装完的结果做不同的行为：

- 显示安装成功的窗口
- 显示正常的窗口
- 关闭自己

```csharp
using System.IO;
using System.Windows;
using Walterlv.Installing;

namespace Walterlv.ENPlugins.Presentation
{
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            var installer = new SelfInstaller(@"C:\Users\lvyi\AppData\Local\Walterlv");

            var state = installer.TryInstall();
            switch (state)
            {
                case InstalledState.Installed:
                case InstalledState.Updated:
                case InstalledState.UpdatedInUse:
                    new InstallTipWindow().Show();
                    break;
                case InstalledState.Same:
                case InstalledState.Ran:
                    new MainWindow().Show();
                    break;
                case InstalledState.ShouldRerun:
                    Shutdown();
                    break;
            }
        }
    }
}
```

## 附全部源码

本文代码在 <https://gist.github.com/walterlv/33bdd62e2411c69c2699038e2bc97488>。

```csharp
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;

namespace Walterlv.EasiPlugins.Installing
{
    /// <summary>
    /// 自安装或字更新的安装器。
    /// </summary>
    public class SelfInstaller
    {
        /// <summary>
        /// 初始化 <see cref="SelfInstaller"/> 的新实例。
        /// </summary>
        /// <param name="targetFilePath">要安装的主程序的目标路径。</param>
        /// <param name="installingProcedure">如果需要在安装后执行额外的安装步骤，则指定自定义的安装步骤。</param>
        public SelfInstaller(string targetFilePath, IInstallingProcedure installingProcedure = null)
        {
            var assembly = Assembly.GetCallingAssembly();
            var extensionName = assembly.GetCustomAttribute<AssemblyTitleAttribute>().Title;
            TargetFileInfo = new FileInfo(Path.Combine(
                targetFilePath ?? throw new ArgumentNullException(nameof(targetFilePath)),
                extensionName, extensionName + Path.GetExtension(assembly.Location)));
            InstallingProcedure = installingProcedure;
        }

        /// <summary>
        /// 获取要安装的主程序的目标路径。
        /// </summary>
        private FileInfo TargetFileInfo { get; }

        /// <summary>
        /// 获取或设置当应用重新启动自己的时候应该使用的参数。
        /// </summary>
        public string RunSelfArguments { get; set; } = "--rerun-reason {reason}";

        /// <summary>
        /// 获取此自安装器安装中需要执行的自定义安装步骤。
        /// </summary>
        public IInstallingProcedure InstallingProcedure { get; }

        /// <summary>
        /// 尝试安装，并返回安装结果。调用者可能需要对安装结果进行必要的操作。
        /// </summary>
        public InstalledState TryInstall()
        {
            var state0 = InstallOrUpdate();
            switch (state0)
            {
                // 已安装或更新，由已安装的程序处理安装后操作。
                case InstalledState.Installed:
                case InstalledState.Updated:
                case InstalledState.UpdatedInUse:
                case InstalledState.Same:
                    break;
                case InstalledState.ShouldRerun:
                    Process.Start(TargetFileInfo.FullName, BuildRerunArguments(state0.ToString(), false));
                    return state0;
            }

            var state1 = InstallingProcedure?.AfterInstall(TargetFileInfo.FullName) ?? InstalledState.Ran;

            if (state0 is InstalledState.UpdatedInUse || state1 is InstalledState.UpdatedInUse)
            {
                return InstalledState.UpdatedInUse;
            }

            if (state0 is InstalledState.Updated || state1 is InstalledState.Updated)
            {
                return InstalledState.Updated;
            }

            if (state0 is InstalledState.Installed || state1 is InstalledState.Installed)
            {
                return InstalledState.Installed;
            }

            return state1;
        }

        /// <summary>
        /// 进行安装或更新。执行后将返回安装状态以及安装后的目标程序路径。
        /// </summary>
        private InstalledState InstallOrUpdate()
        {
            var extensionFilePath = TargetFileInfo.FullName;
            var selfFilePath = Assembly.GetExecutingAssembly().Location;

            // 判断当前是否已经运行在插件目录下。如果已经在那里运行，那么不需要安装。
            if (string.Equals(extensionFilePath, selfFilePath, StringComparison.CurrentCultureIgnoreCase))
            {
                // 继续运行自己即可。
                return InstalledState.Ran;
            }

            // 判断插件目录下的软件版本是否比较新，如果插件目录已经比较新，那么不需要安装。
            var isOldOneExists = File.Exists(extensionFilePath);
            if (isOldOneExists)
            {
                var isNewer = CheckIfNewer();
                if (!isNewer)
                {
                    // 运行已安装目录下的自己。
                    return InstalledState.Same;
                }
            }

            // 将自己复制到插件目录进行安装。
            var succeedOnce = CopySelfToInstall();
            if (!succeedOnce)
            {
                // 如果不是一次就成功，说明目标被占用。
                return InstalledState.UpdatedInUse;
            }

            return isOldOneExists ? InstalledState.Updated : InstalledState.Installed;

            bool CheckIfNewer()
            {
                Version installedVersion;
                try
                {
                    var installed = Assembly.ReflectionOnlyLoadFrom(extensionFilePath);

                    var installedVersionString =
                        installed.GetCustomAttributesData()
                            .FirstOrDefault(x =>
                                x.AttributeType.FullName == typeof(AssemblyFileVersionAttribute).FullName)
                            ?.ConstructorArguments[0].Value as string ?? "0.0";
                    installedVersion = new Version(installedVersionString);
                }
                catch (FileLoadException)
                {
                    installedVersion = new Version(0, 0);
                }
                catch (BadImageFormatException)
                {
                    installedVersion = new Version(0, 0);
                }

                var current = Assembly.GetExecutingAssembly();
                var currentVersionString =
                    current.GetCustomAttribute<AssemblyFileVersionAttribute>()?.Version ?? "0.0";
                var currentVersion = new Version(currentVersionString);
                return currentVersion > installedVersion;
            }
        }

        /// <summary>
        /// 将自己复制到目标安装路径。
        /// </summary>
        private bool CopySelfToInstall()
        {
            var extensionFolder = TargetFileInfo.Directory.FullName;
            var extensionFilePath = TargetFileInfo.FullName;
            var selfFilePath = Assembly.GetExecutingAssembly().Location;

            if (!Directory.Exists(extensionFolder))
            {
                Directory.CreateDirectory(extensionFolder);
            }

            var isInUse = false;
            for (var i = 0; i < int.MaxValue; i++)
            {
                try
                {
                    if (i > 0)
                    {
                        File.Move(extensionFilePath, extensionFilePath + $".{i}.bak");
                    }

                    File.Copy(selfFilePath, extensionFilePath, true);
                    return !isInUse;
                }
                catch (IOException)
                {
                    // 不退出循环，于是会重试。
                    isInUse = true;
                }
            }

            return !isInUse;
        }

        /// <summary>
        /// 生成用于重启自身的启动参数。
        /// </summary>
        /// <param name="rerunReason">表示重启原因的一个单词（不能包含空格）。</param>
        /// <param name="includeExecutablePath"></param>
        /// <param name="executablePath"></param>
        /// <returns></returns>
        private string BuildRerunArguments(string rerunReason, bool includeExecutablePath, string executablePath = null)
        {
            if (rerunReason == null)
            {
                throw new ArgumentNullException(nameof(rerunReason));
            }

            if (rerunReason.Contains(" "))
            {
                throw new ArgumentException("重启原因不能包含空格", nameof(rerunReason));
            }

            var args = new List<string>();

            if (includeExecutablePath)
            {
                args.Add(string.IsNullOrWhiteSpace(executablePath)
                    ? Assembly.GetEntryAssembly().Location
                    : executablePath);
            }

            if (!string.IsNullOrWhiteSpace(RunSelfArguments))
            {
                args.Add(RunSelfArguments.Replace("{reason}", rerunReason));
            }

            return string.Join(" ", args);
        }
    }

    /// <summary>
    /// 表示安装完后的状态。
    /// </summary>
    public enum InstalledState
    {
        /// <summary>
        /// 已安装。
        /// </summary>
        Installed,

        /// <summary>
        /// 已更新。说明运行此程序时，已经存在一个旧版本的应用。
        /// </summary>
        Updated,

        /// <summary>
        /// 已更新。但是原始文件被占用，可能需要重启才可使用。
        /// </summary>
        UpdatedInUse,

        /// <summary>
        /// 已代理启动新的程序，所以此程序需要退出。
        /// </summary>
        ShouldRerun,

        /// <summary>
        /// 两个程序都是一样的，跑谁都一样。
        /// </summary>
        Same,

        /// <summary>
        /// 没有执行安装、更新或代理，表示此程序现在是正常启动。
        /// </summary>
        Ran,
    }
}
```
