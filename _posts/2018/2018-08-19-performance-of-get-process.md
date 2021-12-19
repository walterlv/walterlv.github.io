---
title: ".NET 中 GetProcess 相关方法的性能"
date: 2018-08-19 15:04:19 +0800
tags: dotnet windows
---

.NET 的 `Process` 类中提供了查找进程的若干方法，其中部分方法还比较消耗性能。如果你试图优化查找进程相关方法的性能，可能本文分享的一些耗时数据可以作为参考。

---

<div id="toc"></div>

## 性能比较

`Process` 类中提供了四种查询进程的方法：

- `GetProcesses`
    - 获取当前计算机或远程计算机上运行的所有进程。
- `GetProcessById`
    - 获取当前计算机或远程计算机上 pid 为 指定值的进程。
- `GetProcessesByName`
    - 根据进程的名字查找当前计算机或远程计算机上的进程。
- `GetCurrentProcess`
    - 获取当前进程的 `Process` 实例。

先给出我的实测数据（100 次执行耗时）：

+ `Process.GetProcesses()`
    - 00:00:00.7254688
+ `Process.GetProcessById(id)`
    - 00:00:01.3660640（实际数值取决于当前进程数）
+ `Process.GetProcessesByName("Walterlv.Demo")`
    - 00:00:00.5604279
+ `Process.GetCurrentProcess()`
    - 00:00:00.0000546

结果显示获取所有进程实例的 `GetProcesses` 方法速度竟然比获取单个进程实例的 `GetProcessById` 还要快得多！额外地，根据名称查找进程比前两者都快，获取当前进程实例的方法快得不是一个数量级。

## 这些速度差异源于哪里

我们先看看最慢的方法 `GetProcessIds`，它的最本质的实现在 `ProcessManager` 类中：

```csharp
// ProcessManager
public static int[] GetProcessIds() {
    int[] processIds = new int[256];
    int size;
    for (;;) {
        if (!NativeMethods.EnumProcesses(processIds, processIds.Length * 4, out size))
            throw new Win32Exception();
        if (size == processIds.Length * 4) {
            processIds = new int[processIds.Length * 2];
            continue;
        }
        break;
    }
    int[] ids = new int[size / 4];
    Array.Copy(processIds, ids, ids.Length);
    return ids;
}
```

先创建一个 256 长度的数组，然后使用本机函数枚举进程列表填充这个数组。如果实际所需的数组大小与传入的数组大小相等，说明数组用完了，有可能进程数比 256 个多。所以，将数组长度扩大为两倍，随后再试一次。直到发现申请的数组长度足够存下进程数为止。

这里用到了本机方法 `EnumProcesses` 来枚举进程。传入的 `size` 要乘以 4 是因为传入的是字节数，一个 `int` 是 4 个字节。

```csharp
// NativeMethods
[DllImport("psapi.dll", CharSet=System.Runtime.InteropServices.CharSet.Auto, SetLastError=true)]
public static extern bool EnumProcesses(int[] processIds, int size, out int needed);
```

所以我们可以得知，如果当前计算机中的进程数小于 256 个，那么枚举进程方法仅需执行一次；而如果大于或等于 256 个，则枚举进程的方法需要执行两次或更多次，这是性能很差的一个重要原因。

另外，`GetProcesses` 方法就要复杂得多，其核心调用的是 `ProcessManager.GetProcessInfos` 方法。方法很长，但其大体思路是获取当前计算机上的线程列表，然后将线程所在的进程储存到哈希表中（相当于去重），随后返回此哈希表的数组副本。

```csharp
// ProcessManager
static ProcessInfo[] GetProcessInfos(IntPtr dataPtr, Predicate<int> processIdFilter) {
    // 60 is a reasonable number for processes on a normal machine.
    Hashtable processInfos = new Hashtable(60);

    long totalOffset = 0;
    
    while(true) {
        IntPtr currentPtr = (IntPtr)((long)dataPtr + totalOffset);
        SystemProcessInformation pi = new SystemProcessInformation();

        Marshal.PtrToStructure(currentPtr, pi);

        // Process ID shouldn't overflow. OS API GetCurrentProcessID returns DWORD.
        int processInfoProcessId = pi.UniqueProcessId.ToInt32();

        if (processIdFilter == null || processIdFilter(processInfoProcessId)) {
            // get information for a process
            ProcessInfo processInfo = new ProcessInfo();
            processInfo.processId = processInfoProcessId;
            processInfo.handleCount = (int)pi.HandleCount;
            processInfo.sessionId = (int)pi.SessionId;                
            processInfo.poolPagedBytes = (long)pi.QuotaPagedPoolUsage;;
            processInfo.poolNonpagedBytes = (long)pi.QuotaNonPagedPoolUsage;
            processInfo.virtualBytes = (long)pi.VirtualSize;
            processInfo.virtualBytesPeak = (long)pi.PeakVirtualSize;
            processInfo.workingSetPeak = (long)pi.PeakWorkingSetSize;
            processInfo.workingSet = (long)pi.WorkingSetSize;
            processInfo.pageFileBytesPeak = (long)pi.PeakPagefileUsage;
            processInfo.pageFileBytes = (long)pi.PagefileUsage;
            processInfo.privateBytes = (long)pi.PrivatePageCount;
            processInfo.basePriority = pi.BasePriority;


            if( pi.NamePtr == IntPtr.Zero) {                    
                if( processInfo.processId == NtProcessManager.SystemProcessID) {
                    processInfo.processName = "System";
                }
                else if( processInfo.processId == NtProcessManager.IdleProcessID) {
                    processInfo.processName = "Idle";
                }
                else { 
                    // for normal process without name, using the process ID. 
                    processInfo.processName = processInfo.processId.ToString(CultureInfo.InvariantCulture);
                }
            }
            else {                     
                string processName = GetProcessShortName(Marshal.PtrToStringUni(pi.NamePtr, pi.NameLength/sizeof(char)));  
                //
                // On old operating system (NT4 and windows 2000), the process name might be truncated to 15 
                // characters. For example, aspnet_admin.exe will show up in performance counter as aspnet_admin.ex.
                // Process class try to return a nicer name. We used to get the main module name for a process and 
                // use that as the process name. However normal user doesn't have access to module information, 
                // so normal user will see an exception when we try to get a truncated process name.
                //                    
                if (ProcessManager.IsOSOlderThanXP && (processName.Length == 15)) {
                    if (processName.EndsWith(".", StringComparison.OrdinalIgnoreCase)) {
                        processName = processName.Substring(0, 14);
                    }
                    else if (processName.EndsWith(".e", StringComparison.OrdinalIgnoreCase)) {
                        processName = processName.Substring(0, 13);
                    }
                    else if (processName.EndsWith(".ex", StringComparison.OrdinalIgnoreCase)) {
                        processName = processName.Substring(0, 12);
                    }
                }
                processInfo.processName = processName;                                          
            }

            // get the threads for current process
            processInfos[processInfo.processId] =  processInfo;

            currentPtr = (IntPtr)((long)currentPtr + Marshal.SizeOf(pi));
            int i = 0;
            while( i < pi.NumberOfThreads) {
                SystemThreadInformation ti = new SystemThreadInformation();
                Marshal.PtrToStructure(currentPtr, ti);                    
                ThreadInfo threadInfo = new ThreadInfo();                    

                threadInfo.processId = (int)ti.UniqueProcess;
                threadInfo.threadId = (int)ti.UniqueThread;
                threadInfo.basePriority = ti.BasePriority;
                threadInfo.currentPriority = ti.Priority;
                threadInfo.startAddress = ti.StartAddress;
                threadInfo.threadState = (ThreadState)ti.ThreadState;
                threadInfo.threadWaitReason = NtProcessManager.GetThreadWaitReason((int)ti.WaitReason);

                processInfo.threadInfoList.Add(threadInfo);
                currentPtr = (IntPtr)((long)currentPtr + Marshal.SizeOf(ti));
                i++;
            }
        }

        if (pi.NextEntryOffset == 0) {
            break;
        }
        totalOffset += pi.NextEntryOffset;
    }

    ProcessInfo[] temp = new ProcessInfo[processInfos.Values.Count];
    processInfos.Values.CopyTo(temp, 0);
    return temp;
}
```

`GetProcessesByName` 方法就比较奇怪了，因为其本质上就是调用了 `Process.GetProcesses` 方法，并在其后额外执行了一些代码。理论上不应该出现耗时更短的情况。事实上，在测试中，我将 `GetProcesses` 和 `GetProcessesByName` 方法的执行调换顺序也能得到稳定一致的结果，都是 `GetProcessesByName` 更快。

```csharp
public static Process[] GetProcessesByName(string processName, string machineName) {
    if (processName == null) processName = String.Empty;
    Process[] procs = GetProcesses(machineName);
    ArrayList list = new ArrayList();

    for(int i = 0; i < procs.Length; i++) {                
        if( String.Equals(processName, procs[i].ProcessName, StringComparison.OrdinalIgnoreCase)) {
            list.Add( procs[i]);                    
        } else {
            procs[i].Dispose();
        }
    }
    
    Process[] temp = new Process[list.Count];
    list.CopyTo(temp, 0);
    return temp;
}
```

至于 `GetCurrentProcess` 方法能够这么快，很好理解，毕竟是自己进程，有什么拿不到的呢？其内部调用的是本机方法：

```csharp
[DllImport("kernel32.dll", CharSet=System.Runtime.InteropServices.CharSet.Auto)]
public static extern int GetCurrentProcessId();
```

另外，有个有意思的现象：

- [Windows的PID为什么是4的倍数 - 开源中国社区](https://www.oschina.net/question/23734_29378)
- [WINDOWS进程或线程号为什么是4的倍数 - GUO Xingwang - 博客园](http://www.cnblogs.com/Thriving-Country/archive/2011/09/18/2180143.html)
