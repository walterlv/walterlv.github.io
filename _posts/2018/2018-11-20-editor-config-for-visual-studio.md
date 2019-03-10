---
title: "在 Visual Studio 中使用 EditorConfig 统一代码风格（含原生与插件）"
publishDate: 2018-11-20 12:17:50 +0800
date: 2018-12-14 09:54:00 +0800
categories: visualstudio csharp dotnet
---

EditorConfig 是一种被各种编辑器广泛支持的配置，使用此配置有助于项目在整个团队中保持一致的代码风格。Visual Studio 2017 开始原生支持 EditorConfig。

本文将介绍 Visual Studio 对 EditorConfig 的支持情况（含原生与插件），并给出符合 .NET 和 C# 约定的 EditorConfig 详细设置。

---

<div id="toc"></div>

## EditorConfig 的广泛支持

在 EditorConfig 官网中，贴出了一些可以纯原生无需任何插件支持 EditorConfig 代码风格配置的编辑器：

![原生支持 EditorConfig 的编辑器](/static/posts/2018-11-20-10-34-36.png)  
▲ 原生支持 EditorConfig 的编辑器

然后还贴出了可以通过插件支持的编辑器：

![可以通过插件支持 EditorConfig 的编辑器](/static/posts/2018-11-20-10-35-36.png)  
▲ 可以通过插件支持 EditorConfig 的编辑器

EditorConfig 本身只定义了一个核心集，表示所有语言都共同遵循的代码格式规范：[EditorConfig 属性的核心集](https://editorconfig.org/#supported-properties)。同时，还有一些其他定义的规范：[EditorConfig 的完整属性](https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties)，不过这里不包括语言特定的规范。

## Visual Studio 对 EditorConfig 的支持程度

Visual Studio 2017 开始添加了对 EditorConfig 的原生支持（你当然能在上面看到 Visual Studio 的图标啦）。

原生的 Visual Studio 2017 支持 EditorConfig 属性的核心集和一些语言的特定属性。具体来说，是这一些：

- 核心属性
    - `indent_style`
    - `indent_size`
    - `tab_width`
    - `end_of_line`
    - `charset`
    - `trim_trailing_whitespace`
    - `insert_final_newline`
    - root
- 语言特定属性
    - 所有 Visual Studio 支持的语言（XML 除外）均支持 EditorConfig 编辑器设置。
    - 此外，EditorConfig 还支持适用于 C# 和 Visual Basic 的代码样式约定和命名约定。

也就是说，当你的项目中存在 EditorConfig 的配置文件 .editorconfig 的时候，Visual Studio 就会应用 EditorConfig 的设置，而且可以适用于多数情况下的编程约定。

Visual Studio 中 .NET 相关语言（C# VB）的 EditorConfig 属性，可以参考 [.NET coding convention settings For EditorConfig](https://docs.microsoft.com/en-us/visualstudio/ide/editorconfig-code-style-settings-reference?view=vs-2017?wt.mc_id=MVP)。

## 在 Visual Studio 中添加 EditorConfig 配置

Visual Studio 支持 EditorConfig 对编程规范的约束。对于多数开发者来说，不需要安装任何插件的情况下这个编程规范的约束就会生效。

不过，还是需要有一些小伙伴进行编程规范的设置。设置规范可以使用很多个插件，比如 [EditorConfig Language Service](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.EditorConfig) 和 [Visual Studio IntelliCode](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.VSIntelliCode)。当然，前者会更加专业，后者只是因为需要使用到 EditorConfig 的配置，顺便带上了 EditorConfig 的编辑体验。

安装了 [EditorConfig Language Service](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.EditorConfig) 插件之后，在解决方案上右键，添加 .editorconfig 文件。

![添加 .editorconfig 文件](/static/posts/2018-11-20-10-58-33.png)  
▲ 添加 .editorconfig 文件

当然，也许你会发现在我的图中，两个插件都能生成 .editorconfig 文件。EditorConfig Language Service 生成的 .editorconfig 文件是空的，而 IntelliCode 一经添加便提供了丰富的 C# 语言约定的属性设置。不过，IntelliCode 提供的设置多少取决于你目前解决方案中的项目类型，这些属性是从 [这里](https://docs.microsoft.com/en-us/visualstudio/ide/editorconfig-code-style-settings-reference?view=vs-2017?wt.mc_id=MVP) 推断的。

如果你使用 EditorConfig Language Service 生成了 .editorconfig 文件，则可以继续点击小灯泡生成按照微软约定的编程规范：

![生成规范](/static/posts/2018-11-20-11-10-20.png)  
▲ 生成规范

## 在 Visual Studio 中开启 EditorConfig 支持

实际上，Visual Studio 一旦检测到 .editorconfig 文件的存在，格式约定就会自动生效。

## 在 ReSharper 中开启 EditorConfig 支持

一样的，ReSharper 默认是开启了 EditorConfig 配置的检测的，也就是说只要存在 .editorconfig 文件，那么 EditorConfig 也会在 ReSharper 的格式化中生效。

![ReSharper 中的 EditorConfig 配置支持](/static/posts/2018-11-20-11-46-25.png)

ReSharper 对于 EditorConfig 的支持情况可以参考：[Using EditorConfig - Help - ReSharper](https://www.jetbrains.com/help/resharper/Using_EditorConfig.html)。

## 效果体验

我们来看一段风格十分混乱不忍直视的代码：

```csharp
using System;
using System.Threading.Tasks;

namespace Walterlv.Demo
{
    public static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            var logger = (ILogger)   new Logger();
            var   logger2 = (ILogger)new Logger();
            var managerTask = Task.Run(  () => 
                {
                    var manager = new Manager(logger);
                    manager.Run();
                    return manager;
                });
            var app = new App(managerTask) {

            };
                app.InitializeComponent();
                app.Run();
                return 0;
        }
    }
}
```

无论你是使用什么方式，最终都能格式化成下面这样：

- 你可以直接输入，在遇到 `}` 和 `;` 的时候就会格式化
- 你可以 Ctrl+V 粘贴，粘贴后直接就是格式化后的代码
- 你可以按下 Ctrl+Alt+Enter（ReSharper），这样整份文档就会格式化
- 你可以按下 Ctrl+K, D（Visual Studio 的 Cleanup），这样也能格式化

```csharp
using System;
using System.Threading.Tasks;

namespace Walterlv.Demo
{
    public static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            var logger = (ILogger)new Logger();
            var logger2 = (ILogger)new Logger();
            var managerTask = Task.Run(() =>
            {
                var manager = new Manager(logger);
                manager.Run();
                return manager;
            });
            var app = new App(managerTask)
            {

            };
            app.InitializeComponent();
            app.Run();
            return 0;
        }
    }
}
```

### 附 EditorConfig Language Service 生成的属性集

```ini
[*]
end_of_line = crlf
charset = utf-8-bom
indent_size = 4
insert_final_newline = true
tab_width = 4
trim_trailing_whitespace = true

[*.xml]
indent_style = space

[*.{cs,vb}]
dotnet_sort_system_directives_first = true
dotnet_style_coalesce_expression = true:suggestion
dotnet_style_collection_initializer = true:suggestion
dotnet_style_explicit_tuple_names = true:suggestion
dotnet_style_null_propagation = true:suggestion
dotnet_style_object_initializer = true:suggestion
dotnet_style_parentheses_in_arithmetic_binary_operators = always_for_clarity:silent
dotnet_style_parentheses_in_other_binary_operators = always_for_clarity:silent
dotnet_style_parentheses_in_other_operators = never_if_unnecessary:silent
dotnet_style_parentheses_in_relational_binary_operators = always_for_clarity:silent
dotnet_style_predefined_type_for_locals_parameters_members = true:silent
dotnet_style_predefined_type_for_member_access = true:silent
dotnet_style_prefer_auto_properties = true:silent
dotnet_style_prefer_conditional_expression_over_assignment = true
dotnet_style_prefer_conditional_expression_over_return = true
dotnet_style_prefer_inferred_anonymous_type_member_names = true:suggestion
dotnet_style_prefer_inferred_tuple_names = true:suggestion
dotnet_style_prefer_is_null_check_over_reference_equality_method = true:silent
dotnet_style_qualification_for_event = false:silent
dotnet_style_qualification_for_field = false:silent
dotnet_style_qualification_for_method = false:silent
dotnet_style_qualification_for_property = false:silent
dotnet_style_readonly_field = true:suggestion
dotnet_style_require_accessibility_modifiers = for_non_interface_members:silent

[*.cs]
csharp_indent_case_contents = true
csharp_indent_labels = flush_left
csharp_indent_switch_labels = true
csharp_new_line_before_catch = true
csharp_new_line_before_else = true
csharp_new_line_before_finally = true
csharp_new_line_before_members_in_anonymous_types = true
csharp_new_line_before_members_in_object_initializers = true
csharp_new_line_before_open_brace = all
csharp_new_line_between_query_expression_clauses = true
csharp_preferred_modifier_order = public,private,protected,internal,static,extern,new,virtual,abstract,sealed,override,readonly,unsafe,volatile,async:suggestion
csharp_prefer_braces = true:silent
csharp_prefer_simple_default_expression = true:suggestion
csharp_preserve_single_line_blocks = true
csharp_preserve_single_line_statements = true
csharp_space_after_cast = false
csharp_space_after_colon_in_inheritance_clause = true
csharp_space_after_keywords_in_control_flow_statements = true
csharp_space_around_binary_operators = before_and_after
csharp_space_before_colon_in_inheritance_clause = true
csharp_space_between_method_call_empty_parameter_list_parentheses = false
csharp_space_between_method_call_name_and_opening_parenthesis = false
csharp_space_between_method_call_parameter_list_parentheses = false
csharp_space_between_method_declaration_empty_parameter_list_parentheses = false
csharp_space_between_method_declaration_parameter_list_parentheses = false
csharp_space_between_parentheses = false
csharp_style_conditional_delegate_call = true:suggestion
csharp_style_deconstructed_variable_declaration = true:suggestion
csharp_style_expression_bodied_accessors = true:silent
csharp_style_expression_bodied_constructors = false:silent
csharp_style_expression_bodied_indexers = true:silent
csharp_style_expression_bodied_methods = false:silent
csharp_style_expression_bodied_operators = false:silent
csharp_style_expression_bodied_properties = true:silent
csharp_style_inlined_variable_declaration = true:suggestion
csharp_style_pattern_local_over_anonymous_function = true:suggestion
csharp_style_pattern_matching_over_as_with_null_check = true:suggestion
csharp_style_pattern_matching_over_is_with_cast_check = true:suggestion
csharp_style_throw_expression = true:suggestion
csharp_style_var_elsewhere = true:silent
csharp_style_var_for_built_in_types = true:silent
csharp_style_var_when_type_is_apparent = true:silent

[*.vb]
visual_basic_preferred_modifier_order = Partial,Default,Private,Protected,Public,Friend,NotOverridable,Overridable,MustOverride,Overloads,Overrides,MustInherit,NotInheritable,Static,Shared,Shadows,ReadOnly,WriteOnly,Dim,Const,WithEvents,Widening,Narrowing,Custom,Async:suggestion:suggestion
```

### 附 IntelliCode 生成的属性集

```ini
# Rules in this file were initially inferred by Visual Studio IntelliCode from the C:\Users\lvyi\Walterlv.Demo codebase based on best match to current usage at 2018/11/20
# You can modify the rules from these initially generated values to suit your own policies
# You can learn more about editorconfig here: https://docs.microsoft.com/en-us/visualstudio/ide/editorconfig-code-style-settings-reference
[*.cs]

#Core editorconfig formatting - indentation

#use soft tabs (spaces) for indentation
indent_style = space

#Formatting - indentation options

#indent switch case contents.
csharp_indent_case_contents = true
#csharp_indent_case_contents_when_block
csharp_indent_case_contents_when_block = false
#indent switch labels
csharp_indent_switch_labels = true

#Formatting - new line options

#place catch statements on a new line
csharp_new_line_before_catch = true
#place else statements on a new line
csharp_new_line_before_else = true
#require finally statements to be on a new line after the closing brace
csharp_new_line_before_finally = true
#require braces to be on a new line for methods, accessors, control_blocks, lambdas, properties, and types (also known as "Allman" style)
csharp_new_line_before_open_brace = methods, accessors, control_blocks, lambdas, properties, types

#Formatting - organize using options

#sort System.* using directives alphabetically, and place them before other usings
dotnet_sort_system_directives_first = true

#Formatting - spacing options

#require a space before the colon for bases or interfaces in a type declaration
csharp_space_after_colon_in_inheritance_clause = true
#require a space after a keyword in a control flow statement such as a for loop
csharp_space_after_keywords_in_control_flow_statements = true
#require a space before the colon for bases or interfaces in a type declaration
csharp_space_before_colon_in_inheritance_clause = true
#remove space within empty argument list parentheses
csharp_space_between_method_call_empty_parameter_list_parentheses = false
#remove space between method call name and opening parenthesis
csharp_space_between_method_call_name_and_opening_parenthesis = false
#do not place space characters after the opening parenthesis and before the closing parenthesis of a method call
csharp_space_between_method_call_parameter_list_parentheses = false
#remove space within empty parameter list parentheses for a method declaration
csharp_space_between_method_declaration_empty_parameter_list_parentheses = false
#place a space character after the opening parenthesis and before the closing parenthesis of a method declaration parameter list.
csharp_space_between_method_declaration_parameter_list_parentheses = false

#Formatting - wrapping options

#leave code block on single line
csharp_preserve_single_line_blocks = true
#leave statements and member declarations on the same line
csharp_preserve_single_line_statements = true

#Style - expression bodied member options

#prefer block bodies for accessors
csharp_style_expression_bodied_accessors = false:suggestion
#prefer block bodies for constructors
csharp_style_expression_bodied_constructors = false:suggestion
#prefer block bodies for indexers
csharp_style_expression_bodied_indexers = false:suggestion
#prefer block bodies for methods
csharp_style_expression_bodied_methods = false:suggestion
#prefer block bodies for properties
csharp_style_expression_bodied_properties = false:suggestion

#Style - expression level options

#prefer out variables to be declared before the method call
csharp_style_inlined_variable_declaration = false:suggestion
#prefer the language keyword for member access expressions, instead of the type name, for types that have a keyword to represent them
dotnet_style_predefined_type_for_member_access = true:suggestion

#Style - implicit and explicit types

#prefer var is used to declare variables with built-in system types such as int
csharp_style_var_for_built_in_types = true:suggestion
#prefer var when the type is already mentioned on the right-hand side of a declaration expression
csharp_style_var_when_type_is_apparent = true:suggestion

#Style - language keyword and framework type options

#prefer the language keyword for local variables, method parameters, and class members, instead of the type name, for types that have a keyword to represent them
dotnet_style_predefined_type_for_locals_parameters_members = true:suggestion

#Style - qualification options

#prefer events not to be prefaced with this. or Me. in Visual Basic
dotnet_style_qualification_for_event = false:suggestion
#prefer fields not to be prefaced with this. or Me. in Visual Basic
dotnet_style_qualification_for_field = false:suggestion
#prefer methods not to be prefaced with this. or Me. in Visual Basic
dotnet_style_qualification_for_method = false:suggestion
#prefer properties not to be prefaced with this. or Me. in Visual Basic
dotnet_style_qualification_for_property = false:suggestion
```

---

**参考资料**

- [Using EditorConfig settings in Visual Studio - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/ide/create-portable-custom-editor-options?view=vs-2017?wt.mc_id=MVP)
- [.NET coding convention settings For EditorConfig - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/ide/editorconfig-code-style-settings-reference?view=vs-2017#formatting-conventions?wt.mc_id=MVP)
