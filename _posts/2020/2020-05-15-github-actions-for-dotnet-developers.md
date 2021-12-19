---
title: "适合 .NET 开发者用的 GitHub Actions（时不时更新）"
publishDate: 2020-05-15 19:42:55 +0800
date: 2020-12-03 17:44:51 +0800
tags: dotnet github
position: knowledge
permalink: /post/github-actions-for-dotnet-developers.html
---

本文制作并长期更新适合 .NET 开发者用的 GitHub Actions。整理方式为整个文件而不是单个可用的模块，这样可以方便大家以最快的速度为自己的项目添加 GitHub Actions。当然自己改改也可。

---

<div id="toc"></div>

## .NET 编译与单元测试（全平台）

**功能**：编译你的 .NET 项目，并进行单元测试。

**适用**：如果你的项目是纯 .NET 项目，无论项目是 .NET Core 还是 .NET Framework，无论是 Asp.NET Core 还是 WPF / Windows Forms，都可以用这个文件来编译和单元测试。

**要求**：仓库的根目录有且仅有一个 sln 文件，且这个文件包含了所有重要的项目和单元测试。

{% raw %}
```yaml
name: .NET Build & Test

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  build:
    strategy:
      matrix:
        configuration: [Debug, Release]
    runs-on: windows-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Setup
        uses: actions/setup-dotnet@v1
      - name: Build
        run: dotnet build --configuration $env:Configuration
        env:
          Configuration: ${{ matrix.configuration }}
      - name: Test
        run: dotnet test --configuration $env:Configuration
        env:
          Configuration: ${{ matrix.configuration }}
```
{% endraw %}

## .NET 编译与单元测试（仅限 Windows 系统下的编译）

**功能**：编译你的 .NET 项目，并进行单元测试。

**适用**：如果你的项目是纯 .NET 项目，无论项目是 .NET Core 还是 .NET Framework，无论是 Asp.NET Core 还是 WPF / Windows Forms，都可以用这个文件来编译和单元测试。

**要求**：仓库的根目录有且仅有一个 sln 文件，且这个文件包含了所有重要的项目和单元测试。

{% raw %}
```yaml
name: .NET Build & Test

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:

  build:

    strategy:
      matrix:
        configuration: [Debug, Release]

    runs-on: windows-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v2
      with:
        fetch-depth: 0

    # 安装 .NET Core
    - name: Install .NET Core
      uses: actions/setup-dotnet@v1
      with:
        dotnet-version: 3.1.202

    # 添加 MSBuild.exe 到环境变量: https://github.com/microsoft/setup-msbuild
    - name: Add msbuild to PATH
      uses: microsoft/setup-msbuild@v1.0.2

    # 安装 NuGet（如果后面需要，可以使用它）
    - name: Setup NuGet
      uses: nuget/setup-nuget@v1
      with:
        nuget-api-key: ${{ secrets.NuGetAPIKey }}
        nuget-version: '5.x'

    # 编译整个项目
    - name: Build the solution
      run: msbuild /p:Configuration=$env:Configuration -restore
      env:
        Configuration: ${{ matrix.configuration }}

    # 执行单元测试
    - name: Execute unit tests
      run: dotnet test -c $env:Configuration
      env:
        Configuration: ${{ matrix.configuration }}
```
{% endraw %}

在这个文件中：

1. 我们测试编译了 DEBUG 和 Release 两个不同的环境
2. 我们使用的是 msbuild 来编译，因为这样对旧项目的兼容性最好，当然也就失去了跨平台的能力

## NuGet Push

**功能**：如果你的项目是要推送 NuGet 包的，那么可以使用此工作流推送 NuGet 包。

**适用**：任何 .NET 项目。

**要求**：仓库的根目录有且仅有一个 sln 文件。

{% raw %}
```yaml
name: NuGet Push

on:
  push:
    branches:
      - master

jobs:
  build:
    runs-on: windows-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Setup
        uses: actions/setup-dotnet@v1
      - name: Pack
        run: dotnet build --configuration Release
      - name: Push
        run: dotnet nuget push .\bin\Release\*.nupkg --source https://api.nuget.org/v3/index.json --api-key ${{ secrets.NuGetAPIKey }} --skip-duplicate --no-symbols 1
```
{% endraw %}

关于最后的那个参数 `1`，很魔性，只要有任何一个值都行。参见：[dotnet nuget push - Missing value for option · Issue #4864 · NuGet/Home](https://github.com/NuGet/Home/issues/4864)。

## 自带环境

GitHub Actions 自带了很多环境可以用，这些自带的环境不需要再去配了：

- [virtual-environments/Windows2019-Readme.md at master · actions/virtual-environments](https://github.com/actions/virtual-environments/blob/master/images/win/Windows2019-Readme.md)

