---
title: "编写 MSBuild 内联编译任务（Task）用于获取当前编译环境下的所有编译目标（Target）"
date: 2019-03-01 15:35:27 +0800
tags: msbuild dotnet visualstudio csharp
position: problem
coverImage: /static/posts/2019-03-01-15-21-18.png
permalink: /posts/write-a-msbuild-inline-task-for-getting-all-targets.html
---

我之前写过一些改变 MSBuild 编译过程的一些博客，包括利用 Microsoft.NET.Sdk 中各种自带的 Task 来执行各种各样的编译任务。更复杂的任务难以直接利用自带的 Task 实现，需要自己写 Task。

本文将编写一个内联的编译任务，获取当前编译环境下的所有编译目标（Target）。获取所有的这些 Target 对我们调试一些与 MSBuild 或编译相关的问题时可能带来一些帮助。

---

编写纯 C# 版本编译任务获取所有编译目标（Target）的代码是这样的：

```csharp
using Microsoft.Build.Evaluation;
using Microsoft.Build.Execution;
using Microsoft.Build.Utilities;
using Microsoft.Build.Framework;

public class WalterlvGetAllTargets : Task
{
    public string ProjectFile { get; set; }

    public ITaskItem[] WalterlvTargets { get; set; }

    public override bool Execute()
    {
        var project = new Project(ProjectFile);

        var taskItems = new List<ITaskItem>(project.Targets.Count);
        foreach (KeyValuePair<string, ProjectTargetInstance> pair in project.Targets)
        {
            var target = pair.Value;
            var metadata = new Dictionary<string, string>
            {
                { "Condition", target.Condition },
                { "Inputs", target.Inputs },
                { "Outputs", target.Outputs },
                { "DependsOnTargets", target.DependsOnTargets }
            };
            taskItems.Add(new TaskItem(pair.Key, metadata));
        }

        WalterlvTargets = taskItems.ToArray();

        return true;
    }
}
```

那么转换成内联版本下面这样。为了方便验证，我直接把完整的 csproj 文件贴出来了。如果你希望在你的项目中去使用，可以只复制 `UsingTask` 和 `Target` 两个部分。

```xml
<Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>net472</TargetFramework>
    </PropertyGroup>

    <UsingTask TaskName="WalterlvGetAllTargets" TaskFactory="CodeTaskFactory"
               AssemblyFile="$(MSBuildToolsPath)\Microsoft.Build.Tasks.v4.0.dll" >
        <ParameterGroup>
            <!-- 内联 C# 代码的输入参数（Task 的输入属性），相当于 public string ProjectFile { get; set; } -->
            <ProjectFile ParameterType="System.String" Required="true"/>
            <!-- 内联 C# 代码的输出参数（Task 的输入属性），相当于 public ITaskItem[] WalterlvTargets { get; set; } -->
            <WalterlvTargets ParameterType="Microsoft.Build.Framework.ITaskItem[]" Output="true"/>
        </ParameterGroup>
        <Task>
            <!-- 引用程序集。 -->
            <Reference Include="System.Xml"/>
            <Reference Include="Microsoft.Build"/>
            <Reference Include="Microsoft.Build.Framework"/>
            <!-- 编写 C# 代码所用到的 using。 -->
            <Using Namespace="Microsoft.Build.Evaluation"/>
            <Using Namespace="Microsoft.Build.Execution"/>
            <Using Namespace="Microsoft.Build.Utilities"/>
            <Using Namespace="Microsoft.Build.Framework"/>
            <!-- 开始插入 C# 代码。 -->
            <Code Type="Fragment" Language="cs">
        <![CDATA[
            var project = new Project(ProjectFile);

            var taskItems = new List<ITaskItem>(project.Targets.Count);
            foreach (KeyValuePair<string, ProjectTargetInstance> pair in project.Targets)
            {
                var target = pair.Value;
                var metadata = new Dictionary<string, string>
                {
                    { "Condition", target.Condition },
                    { "Inputs", target.Inputs },
                    { "Outputs", target.Outputs },
                    { "DependsOnTargets", target.DependsOnTargets }
                };
                taskItems.Add(new TaskItem(pair.Key, metadata));
            }

            WalterlvTargets = taskItems.ToArray();
        ]]>
            </Code>
        </Task>
    </UsingTask>

    <Target Name="WalterlvOutputAllTargets" AfterTargets="Build">
        <!-- 执行刚刚写的内联 Task，然后获取它的输出参数 WalterlvTargets 并填充到 TargetItems 集合中。 -->
        <WalterlvGetAllTargets ProjectFile="$(MSBuildProjectFile)">
            <Output ItemName="TargetItems" TaskParameter="WalterlvTargets"/>
        </WalterlvGetAllTargets>
        <!-- 用一个 Message 输出刚刚生成的 TargetItems 集合中每一项的 Identity 属性（集合中每一项都会输出。） -->
        <Message Text="输出的 Target：%(TargetItems.Identity)"/>
    </Target>
<Project>
```

现在使用 `msbuild` 命令进行编译，我们将看到所有 Target 的输出：

![输出的所有 Target](/static/posts/2019-03-01-15-21-18.png)

```powershell
WalterlvOutputAllTargets:
  输出的 Target：OutputAll
  输出的 Target：_CheckForUnsupportedTargetFramework
  输出的 Target：_CollectTargetFrameworkForTelemetry
  输出的 Target：_CheckForUnsupportedNETCoreVersion
  输出的 Target：_CheckForUnsupportedNETStandardVersion
  输出的 Target：_CheckForUnsupportedAppHostUsage
  输出的 Target：_CheckForMismatchingPlatform
  输出的 Target：_CheckForNETCoreSdkIsPreview
  输出的 Target：AdjustDefaultPlatformTargetForNetFrameworkExeWithNoNativeCopyLocalItems
  输出的 Target：CreateManifestResourceNames
  输出的 Target：ResolveCodeAnalysisRuleSet
  输出的 Target：XamlPreCompile
  输出的 Target：ShimReferencePathsWhenCommonTargetsDoesNotUnderstandReferenceAssemblies
  输出的 Target：_BeforeVBCSCoreCompile
  输出的 Target：InitializeSourceRootMappedPaths
  输出的 Target：_InitializeSourceRootMappedPathsFromSourceControl
  输出的 Target：_SetPathMapFromSourceRoots
  输出的 Target：CoreCompile
  输出的 Target：ResolvePackageDependenciesDesignTime
  输出的 Target：CollectSDKReferencesDesignTime
  输出的 Target：CollectResolvedSDKReferencesDesignTime
  输出的 Target：CollectPackageReferences
  输出的 Target：_CheckCompileDesignTimePrerequisite
  输出的 Target：CollectAnalyzersDesignTime
  输出的 Target：CollectResolvedCompilationReferencesDesignTime
  输出的 Target：CollectUpToDateCheckInputDesignTime
  输出的 Target：CollectUpToDateCheckOutputDesignTime
  输出的 Target：CollectUpToDateCheckBuiltDesignTime
  输出的 Target：CompileDesignTime
  输出的 Target：_FixVCLibs120References
  输出的 Target：_AddVCLibs140UniversalCrtDebugReference
  输出的 Target：InitializeSourceControlInformation
  输出的 Target：_CheckForInvalidConfigurationAndPlatform
  输出的 Target：Build
  输出的 Target：BeforeBuild
  输出的 Target：AfterBuild
  输出的 Target：CoreBuild
  输出的 Target：Rebuild
  输出的 Target：BeforeRebuild
  输出的 Target：AfterRebuild
  输出的 Target：BuildGenerateSources
  输出的 Target：BuildGenerateSourcesTraverse
  输出的 Target：BuildCompile
  输出的 Target：BuildCompileTraverse
  输出的 Target：BuildLink
  输出的 Target：BuildLinkTraverse
  输出的 Target：CopyRunEnvironmentFiles
  输出的 Target：Run
  输出的 Target：BuildOnlySettings
  输出的 Target：PrepareForBuild
  输出的 Target：GetFrameworkPaths
  输出的 Target：GetReferenceAssemblyPaths
  输出的 Target：GetTargetFrameworkMoniker
  输出的 Target：GetTargetFrameworkMonikerDisplayName
  输出的 Target：GetTargetFrameworkDirectories
  输出的 Target：AssignLinkMetadata
  输出的 Target：PreBuildEvent
  输出的 Target：UnmanagedUnregistration
  输出的 Target：GetTargetFrameworkVersion
  输出的 Target：ResolveReferences
  输出的 Target：BeforeResolveReferences
  输出的 Target：AfterResolveReferences
  输出的 Target：AssignProjectConfiguration
  输出的 Target：_SplitProjectReferencesByFileExistence
  输出的 Target：_GetProjectReferenceTargetFrameworkProperties
  输出的 Target：GetTargetFrameworks
  输出的 Target：GetTargetFrameworkProperties
  输出的 Target：PrepareProjectReferences
  输出的 Target：ResolveProjectReferences
  输出的 Target：ResolveProjectReferencesDesignTime
  输出的 Target：ExpandSDKReferencesDesignTime
  输出的 Target：GetTargetPath
  输出的 Target：GetTargetPathWithTargetPlatformMoniker
  输出的 Target：GetNativeManifest
  输出的 Target：ResolveNativeReferences
  输出的 Target：ResolveAssemblyReferences
  输出的 Target：FindReferenceAssembliesForReferences
  输出的 Target：GenerateBindingRedirects
  输出的 Target：GenerateBindingRedirectsUpdateAppConfig
  输出的 Target：GetInstalledSDKLocations
  输出的 Target：ResolveSDKReferences
  输出的 Target：ResolveSDKReferencesDesignTime
  输出的 Target：FindInvalidProjectReferences
  输出的 Target：GetReferenceTargetPlatformMonikers
  输出的 Target：ExpandSDKReferences
  输出的 Target：ExportWindowsMDFile
  输出的 Target：ResolveAssemblyReferencesDesignTime
  输出的 Target：DesignTimeResolveAssemblyReferences
  输出的 Target：ResolveComReferences
  输出的 Target：ResolveComReferencesDesignTime
  输出的 Target：PrepareResources
  输出的 Target：PrepareResourceNames
  输出的 Target：AssignTargetPaths
  输出的 Target：GetItemTargetPaths
  输出的 Target：SplitResourcesByCulture
  输出的 Target：CreateCustomManifestResourceNames
  输出的 Target：ResGen
  输出的 Target：BeforeResGen
  输出的 Target：AfterResGen
  输出的 Target：CoreResGen
  输出的 Target：CompileLicxFiles
  输出的 Target：ResolveKeySource
  输出的 Target：Compile
  输出的 Target：_GenerateCompileInputs
  输出的 Target：GenerateTargetFrameworkMonikerAttribute
  输出的 Target：GenerateAdditionalSources
  输出的 Target：BeforeCompile
  输出的 Target：AfterCompile
  输出的 Target：_TimeStampBeforeCompile
  输出的 Target：_GenerateCompileDependencyCache
  输出的 Target：_TimeStampAfterCompile
  输出的 Target：_ComputeNonExistentFileProperty
  输出的 Target：GenerateSerializationAssemblies
  输出的 Target：CreateSatelliteAssemblies
  输出的 Target：_GenerateSatelliteAssemblyInputs
  输出的 Target：GenerateSatelliteAssemblies
  输出的 Target：ComputeIntermediateSatelliteAssemblies
  输出的 Target：SetWin32ManifestProperties
  输出的 Target：_SetExternalWin32ManifestProperties
  输出的 Target：_SetEmbeddedWin32ManifestProperties
  输出的 Target：_GenerateResolvedDeploymentManifestEntryPoint
  输出的 Target：GenerateManifests
  输出的 Target：GenerateApplicationManifest
  输出的 Target：_DeploymentComputeNativeManifestInfo
  输出的 Target：_DeploymentComputeClickOnceManifestInfo
  输出的 Target：_DeploymentGenerateTrustInfo
  输出的 Target：GenerateDeploymentManifest
  输出的 Target：PrepareForRun
  输出的 Target：CopyFilesToOutputDirectory
  输出的 Target：_CopyFilesMarkedCopyLocal
  输出的 Target：_CopySourceItemsToOutputDirectory
  输出的 Target：GetCopyToOutputDirectoryItems
  输出的 Target：GetCopyToPublishDirectoryItems
  输出的 Target：_CopyOutOfDateSourceItemsToOutputDirectory
  输出的 Target：_CopyOutOfDateSourceItemsToOutputDirectoryAlways
  输出的 Target：_CopyAppConfigFile
  输出的 Target：_CopyManifestFiles
  输出的 Target：_CheckForCompileOutputs
  输出的 Target：_SGenCheckForOutputs
  输出的 Target：UnmanagedRegistration
  输出的 Target：IncrementalClean
  输出的 Target：_CleanGetCurrentAndPriorFileWrites
  输出的 Target：Clean
  输出的 Target：BeforeClean
  输出的 Target：AfterClean
  输出的 Target：CleanReferencedProjects
  输出的 Target：CoreClean
  输出的 Target：_CleanRecordFileWrites
  输出的 Target：CleanPublishFolder
  输出的 Target：PostBuildEvent
  输出的 Target：Publish
  输出的 Target：_DeploymentUnpublishable
  输出的 Target：SetGenerateManifests
  输出的 Target：PublishOnly
  输出的 Target：BeforePublish
  输出的 Target：AfterPublish
  输出的 Target：PublishBuild
  输出的 Target：_CopyFilesToPublishFolder
  输出的 Target：_DeploymentGenerateBootstrapper
  输出的 Target：_DeploymentSignClickOnceDeployment
  输出的 Target：AllProjectOutputGroups
  输出的 Target：BuiltProjectOutputGroup
  输出的 Target：DebugSymbolsProjectOutputGroup
  输出的 Target：DocumentationProjectOutputGroup
  输出的 Target：SatelliteDllsProjectOutputGroup
  输出的 Target：SourceFilesProjectOutputGroup
  输出的 Target：GetCompile
  输出的 Target：ContentFilesProjectOutputGroup
  输出的 Target：SGenFilesOutputGroup
  输出的 Target：GetResolvedSDKReferences
  输出的 Target：CollectReferencedNuGetPackages
  输出的 Target：PriFilesOutputGroup
  输出的 Target：SDKRedistOutputGroup
  输出的 Target：AllProjectOutputGroupsDependencies
  输出的 Target：BuiltProjectOutputGroupDependencies
  输出的 Target：DebugSymbolsProjectOutputGroupDependencies
  输出的 Target：SatelliteDllsProjectOutputGroupDependencies
  输出的 Target：DocumentationProjectOutputGroupDependencies
  输出的 Target：SGenFilesOutputGroupDependencies
  输出的 Target：ReferenceCopyLocalPathsOutputGroup
  输出的 Target：SetCABuildNativeEnvironmentVariables
  输出的 Target：RunCodeAnalysis
  输出的 Target：RunNativeCodeAnalysis
  输出的 Target：RunSelectedFileNativeCodeAnalysis
  输出的 Target：RunMergeNativeCodeAnalysis
  输出的 Target：ImplicitlyExpandDesignTimeFacades
  输出的 Target：GetWinFXPath
  输出的 Target：DesignTimeMarkupCompilation
  输出的 Target：PrepareResourcesForSatelliteAssemblies
  输出的 Target：_AfterCompileWinFXInternal
  输出的 Target：AfterCompileWinFX
  输出的 Target：AfterMarkupCompilePass1
  输出的 Target：AfterMarkupCompilePass2
  输出的 Target：MarkupCompilePass1
  输出的 Target：MarkupCompilePass2
  输出的 Target：_CompileTemporaryAssembly
  输出的 Target：MarkupCompilePass2ForMainAssembly
  输出的 Target：GenerateTemporaryTargetAssembly
  输出的 Target：CleanupTemporaryTargetAssembly
  输出的 Target：AddIntermediateAssemblyToReferenceList
  输出的 Target：SatelliteOnlyMarkupCompilePass2
  输出的 Target：HostInBrowserValidation
  输出的 Target：SplashScreenValidation
  输出的 Target：ResignApplicationManifest
  输出的 Target：SignDeploymentManifest
  输出的 Target：FileClassification
  输出的 Target：MainResourcesGeneration
  输出的 Target：SatelliteResourceGeneration
  输出的 Target：GenerateResourceWithCultureItem
  输出的 Target：CheckUid
  输出的 Target：UpdateUid
  输出的 Target：RemoveUid
  输出的 Target：MergeLocalizationDirectives
  输出的 Target：AssignWinFXEmbeddedResource
  输出的 Target：EntityDeploy
  输出的 Target：EntityDeploySplit
  输出的 Target：EntityDeployNonEmbeddedResources
  输出的 Target：EntityDeployEmbeddedResources
  输出的 Target：EntityClean
  输出的 Target：EntityDeploySetLogicalNames
  输出的 Target：DesignTimeXamlMarkupCompilation
  输出的 Target：InProcessXamlMarkupCompilePass1
  输出的 Target：CleanInProcessXamlGeneratedFiles
  输出的 Target：XamlMarkupCompileReadGeneratedFileList
  输出的 Target：XamlMarkupCompilePass1
  输出的 Target：XamlMarkupCompileAddFilesGenerated
  输出的 Target：XamlMarkupCompileReadPass2Flag
  输出的 Target：XamlTemporaryAssemblyGeneration
  输出的 Target：CompileTemporaryAssembly
  输出的 Target：XamlMarkupCompilePass2
  输出的 Target：XamlMarkupCompileAddExtensionFilesGenerated
  输出的 Target：GetCopyToOutputDirectoryXamlAppDefs
  输出的 Target：ExpressionBuildExtension
  输出的 Target：ValidationExtension
  输出的 Target：GenerateCompiledExpressionsTempFile
  输出的 Target：AddDeferredValidationErrorsFileToFileWrites
  输出的 Target：ReportValidationBuildExtensionErrors
  输出的 Target：DeferredValidation
  输出的 Target：ResolveTestReferences
  输出的 Target：CleanAppxPackage
  输出的 Target：GetPackagingOutputs
  输出的 Target：Restore
  输出的 Target：GenerateRestoreGraphFile
  输出的 Target：_LoadRestoreGraphEntryPoints
  输出的 Target：_FilterRestoreGraphProjectInputItems
  输出的 Target：_GenerateRestoreGraph
  输出的 Target：_GenerateRestoreGraphProjectEntry
  输出的 Target：_GenerateRestoreSpecs
  输出的 Target：_GenerateDotnetCliToolReferenceSpecs
  输出的 Target：_GetProjectJsonPath
  输出的 Target：_GetRestoreProjectStyle
  输出的 Target：EnableIntermediateOutputPathMismatchWarning
  输出的 Target：_GetRestoreTargetFrameworksOutput
  输出的 Target：_GetRestoreTargetFrameworksAsItems
  输出的 Target：_GetRestoreSettings
  输出的 Target：_GetRestoreSettingsCurrentProject
  输出的 Target：_GetRestoreSettingsAllFrameworks
  输出的 Target：_GetRestoreSettingsPerFramework
  输出的 Target：_GenerateRestoreProjectSpec
  输出的 Target：_GenerateProjectRestoreGraph
  输出的 Target：_GenerateRestoreDependencies
  输出的 Target：_GenerateProjectRestoreGraphAllFrameworks
  输出的 Target：_GenerateProjectRestoreGraphCurrentProject
  输出的 Target：_GenerateProjectRestoreGraphPerFramework
  输出的 Target：_GenerateRestoreProjectPathItemsCurrentProject
  输出的 Target：_GenerateRestoreProjectPathItemsPerFramework
  输出的 Target：_GenerateRestoreProjectPathItems
  输出的 Target：_GenerateRestoreProjectPathItemsAllFrameworks
  输出的 Target：_GenerateRestoreProjectPathWalk
  输出的 Target：_GetAllRestoreProjectPathItems
  输出的 Target：_GetRestoreSettingsOverrides
  输出的 Target：_GetRestorePackagesPathOverride
  输出的 Target：_GetRestoreSourcesOverride
  输出的 Target：_GetRestoreFallbackFoldersOverride
  输出的 Target：_IsProjectRestoreSupported
  输出的 Target：DesktopBridgeCopyLocalOutputGroup
  输出的 Target：DesktopBridgeComFilesOutputGroup
  输出的 Target：GetDeployableContentReferenceOutputs
  输出的 Target：DockerResolveAppType
  输出的 Target：DockerUpdateComposeVsGeneratedFiles
  输出的 Target：DockerResolveTargetFramework
  输出的 Target：DockerComposeBuild
  输出的 Target：DockerPackageService
  输出的 Target：ImplicitlyExpandNETStandardFacades
  输出的 Target：_RemoveZipFileSuggestedRedirect
  输出的 Target：SetARM64AppxPackageInputsForInboxNetNative
  输出的 Target：_CleanMdbFiles
  输出的 Target：PreXsdCodeGen
  输出的 Target：XsdCodeGen
  输出的 Target：XsdResolveReferencePath
  输出的 Target：CleanXsdCodeGen
  输出的 Target：_SetTargetFrameworkMonikerAttribute
  输出的 Target：ResolvePackageDependenciesForBuild
  输出的 Target：RunResolvePackageDependencies
  输出的 Target：ResolvePackageAssets
  输出的 Target：FilterSatelliteResources
  输出的 Target：RunProduceContentAssets
  输出的 Target：ReportAssetsLogMessages
  输出的 Target：ResolveLockFileReferences
  输出的 Target：IncludeTransitiveProjectReferences
  输出的 Target：ResolveLockFileAnalyzers
  输出的 Target：_ComputeLockFileCopyLocal
  输出的 Target：ResolveLockFileCopyLocalProjectDeps
  输出的 Target：CheckForImplicitPackageReferenceOverrides
  输出的 Target：CheckForDuplicateItems
  输出的 Target：GenerateBuildDependencyFile
  输出的 Target：GenerateBuildRuntimeConfigurationFiles
  输出的 Target：AddRuntimeConfigFileToBuiltProjectOutputGroupOutput
  输出的 Target：_SdkBeforeClean
  输出的 Target：_SdkBeforeRebuild
  输出的 Target：_ComputeNETCoreBuildOutputFiles
  输出的 Target：_ComputeReferenceAssemblies
  输出的 Target：CoreGenerateSatelliteAssemblies
  输出的 Target：_GetAssemblyInfoFromTemplateFile
  输出的 Target：_DefaultMicrosoftNETPlatformLibrary
  输出的 Target：GetAllRuntimeIdentifiers
  输出的 Target：GenerateAssemblyInfo
  输出的 Target：AddSourceRevisionToInformationalVersion
  输出的 Target：GetAssemblyAttributes
  输出的 Target：CreateGeneratedAssemblyInfoInputsCacheFile
  输出的 Target：CoreGenerateAssemblyInfo
  输出的 Target：GetAssemblyVersion
  输出的 Target：ComposeStore
  输出的 Target：StoreWorkerMain
  输出的 Target：StoreWorkerMapper
  输出的 Target：StoreResolver
  输出的 Target：StoreWorkerPerformWork
  输出的 Target：StoreFinalizer
  输出的 Target：_CopyResolvedOptimizedFiles
  输出的 Target：PrepareForComposeStore
  输出的 Target：PrepforRestoreForComposeStore
  输出的 Target：RestoreForComposeStore
  输出的 Target：ComputeAndCopyFilesToStoreDirectory
  输出的 Target：CopyFilesToStoreDirectory
  输出的 Target：_CopyResolvedUnOptimizedFiles
  输出的 Target：_ComputeResolvedFilesToStoreTypes
  输出的 Target：_SplitResolvedFiles
  输出的 Target：_GetResolvedFilesToStore
  输出的 Target：ComputeFilesToStore
  输出的 Target：PrepRestoreForStoreProjects
  输出的 Target：PrepOptimizer
  输出的 Target：_RunOptimizer
  输出的 Target：RunCrossGen
  输出的 Target：_InitializeBasicProps
  输出的 Target：_GetCrossgenProps
  输出的 Target：_SetupStageForCrossgen
  输出的 Target：_RestoreCrossgen
  输出的 Target：_CheckForObsoleteDotNetCliToolReferences
  输出的 Target：_PublishBuildAlternative
  输出的 Target：_PublishNoBuildAlternative
  输出的 Target：_PreventProjectReferencesFromBuilding
  输出的 Target：PrepareForPublish
  输出的 Target：ComputeAndCopyFilesToPublishDirectory
  输出的 Target：CopyFilesToPublishDirectory
  输出的 Target：_CopyResolvedFilesToPublishPreserveNewest
  输出的 Target：_CopyResolvedFilesToPublishAlways
  输出的 Target：_ComputeResolvedFilesToPublishTypes
  输出的 Target：ComputeFilesToPublish
  输出的 Target：_ComputeNetPublishAssets
  输出的 Target：RunResolvePublishAssemblies
  输出的 Target：FilterPublishSatelliteResources
  输出的 Target：_ComputeCopyToPublishDirectoryItems
  输出的 Target：DefaultCopyToPublishDirectoryMetadata
  输出的 Target：GeneratePublishDependencyFile
  输出的 Target：_ComputeExcludeFromPublishPackageReferences
  输出的 Target：_ParseTargetManifestFiles
  输出的 Target：GeneratePublishRuntimeConfigurationFile
  输出的 Target：DeployAppHost
  输出的 Target：PackTool
  输出的 Target：GenerateToolsSettingsFileFromBuildProperty
  输出的 Target：ResolveApphostAsset
  输出的 Target：ComputeDependencyFileCompilerOptions
  输出的 Target：ComputeRefAssembliesToPublish
  输出的 Target：_CopyReferenceOnlyAssembliesForBuild
  输出的 Target：_HandlePackageFileConflicts
  输出的 Target：_HandlePublishFileConflicts
  输出的 Target：_GetOutputItemsFromPack
  输出的 Target：_GetTargetFrameworksOutput
  输出的 Target：_PackAsBuildAfterTarget
  输出的 Target：_CleanPackageFiles
  输出的 Target：_CalculateInputsOutputsForPack
  输出的 Target：Pack
  输出的 Target：_IntermediatePack
  输出的 Target：GenerateNuspec
  输出的 Target：_InitializeNuspecRepositoryInformationProperties
  输出的 Target：_LoadPackInputItems
  输出的 Target：_GetProjectReferenceVersions
  输出的 Target：_GetProjectVersion
  输出的 Target：_WalkEachTargetPerFramework
  输出的 Target：_GetFrameworksWithSuppressedDependencies
  输出的 Target：_GetFrameworkAssemblyReferences
  输出的 Target：_GetBuildOutputFilesWithTfm
  输出的 Target：_GetTfmSpecificContentForPackage
  输出的 Target：_GetDebugSymbolsWithTfm
  输出的 Target：_AddPriFileToPackBuildOutput
  输出的 Target：_GetPackageFiles
```

---

**参考资料**

- [msbuild - Is there a way to list all the build targets available in a build file? - Stack Overflow](https://stackoverflow.com/a/2781693/6233938)


