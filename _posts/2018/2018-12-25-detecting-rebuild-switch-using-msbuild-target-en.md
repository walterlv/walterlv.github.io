---
title: "Write a MSBuild Target to detect whether the project is rebuilding or not"
publishDate: 2018-12-24 11:59:45 +0800
date: 2018-12-25 08:07:34 +0800
tags: visualstudio msbuild
version:
  current: English
versions:
  - 中文: /post/detecting-rebuild-switch-using-msbuild-target.html
  - English: #
---

MSBuild or the dotnet build command both supports Incremental Building for compiling performance. You can read [How to: Build Incrementally - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-build-incrementally) to lean more about incremental building. When a target supports increment building and the project is rebuilding for the moment, the Target will not execute. So if it affects followed other Targets, it cannot be set to incremental building.

But how can I detect a incremental building behavior and do something different things if my Target affects followed other Targets? In this post, I'll talk about that.

---

<div id="toc"></div>

## The Problem

SourceFusion is a pre-compile framework and allows you to change you code during the compiling. You can visit [dotnet-campus/SourceFusion: SourceFusion is a pre-compile framework based on Roslyn. It helps you to build high-performance .NET code.](https://github.com/dotnet-campus/SourceFusion) to view the open-source project.

The Target in the SourceFusion takes long time and affects followed Targets such as the `CoreCompile` Target. If it use a completely incremental building, the Target will be skipped when building and no more source code will be added or removed before the `CoreCompile` Target. So nothing will happen during a incremental building and the SourceFusion changes nothing.

## The Solution

We can write another Target helps us to detect rebuilding behavior. We can define a property to tell us whether it is a incremental building or not.

```xml

<Target Name="_WalterlvDemoRebuildingTest" BeforeTargets="WalterlvDemoCoreTarget"
        Inputs="$(MSBuildProjectFullPath)" Outputs="$(WalterlvDemoFolder)RebuildingTest.txt">
  <ItemGroup>
    <RebuildingTestLine Include="true" />
  </ItemGroup>
  <CallTarget Targets="_WalterlvDemoRebuildingTestInitialize" />
  <WriteLinesToFile File="$(WalterlvDemoFolder)RebuildingTest.txt" Lines="@(RebuildingTestLine)" Overwrite="True" />
</Target>

<Target Name="_WalterlvDemoRebuildingTestInitialize">
  <PropertyGroup>
    <WalterlvDemoRebuildRequired>true</SourceFusionRebuildRequired>
  </PropertyGroup>
</Target>

```

In this code, I write two Targets and the second one doesn't define any `BeforeTargets` or `AfterTargets` attributes. So this Target will not be executed automatically unless you call it explicitly. I define a property named `SourceFusionRebuildRequired` in it to flag the *rebuilding* status.

I call this separated Target in the first target which defines `Inputs` and `Outputs` attributes. We can know that if a Target want to support incremental building the two attributes are important. So this Target supports that.

These are the three mentioned Targets:

- `_WalterlvDemoRebuildingTest` The Target that supports the incremental building
- `_WalterlvDemoRebuildingTestInitialize` The Target to assign a value to property `SourceFusionRebuildRequired`
- `WalterlvDemoCoreTarget` The long-time Target that will use the incremental building test value

I use a csproj file as a input file and another temp file as a output file. Then if a project file changed and a rebuilding will happen. To generate a temp output file I should use `WriteLinesToFile` Task to write one.

I need `WalterlvDemoRebuildRequired` property to detect the rebuilding behavior. If the project is rebuilding the property will be assigned because the `_WalterlvDemoRebuildingTestInitialize` is called and if the project is incremental building the property will not be assigned.

Then we can check the value of `WalterlvDemoRebuildRequired` to detect a rebuilding or incremental building.

## How to use this property

For the long-time Target `WalterlvDemoCoreTarget`, it should detect the property and do something different.

```xml
<Target Name="WalterlvDemoCoreTarget" BeforeTargets="CoreCompile">
  <PropertyGroup>
    <WalterlvDemoRebuildRequired Condition="'$(WalterlvDemoRebuildRequired)' == ''">false</WalterlvDemoRebuildRequired>
  </PropertyGroup>
  <Exec ConsoleToMSBuild="True" Command="WalterlvDemo.exe -r $(WalterlvDemoRebuildRequired)" />
</Target>
```

We define the same property only if it is not been assigned. But we assign it as a `false` value which is different to the `_WalterlvDemoRebuildingTestInitialize` Target.

Then pass the property value to the core Task, and the Task will know whether it is completely rebuilding or incremental building.

---

### References

- [CallTarget Task - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/calltarget-task)
- [How to: Build Incrementally - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-build-incrementally)
- [Property Functions - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/property-functions)
