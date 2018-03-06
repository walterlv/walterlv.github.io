{%- if page.versions -%}
<p>
  {%- comment -%} 从 page.versions 中查找 current 的值，并存到 current_version 中。 {%- endcomment -%}
  {%- for version_hash in page.versions -%}
    {%- for version in version_hash -%}
      {%- assign key = version[0] -%}
      {%- assign value = version[1] -%}
      {%- if key == "current" -%}
        {%- assign current_version = value -%}
        {%- break -%}
      {%- endif -%}
    {%- endfor -%}
  {%- endfor -%}

  {%- comment -%} 从 page.versions 中遍历所有版本的值，并作为选项显示到 select 中。 {%- endcomment -%}
  <select name="filter" id="filter" onchange="self.location.href=options[selectedIndex].value">
    {%- for version_hash in page.versions -%}
      {%- for version in version_hash -%}
        {%- assign key = version[0] -%}
        {%- assign value = version[1] -%}
        {%- if key != 'current' -%}
          {% comment %} 如果当前值等于 current_version，则选中此值。 {% endcomment %}
          {%- if current_version == key -%}
            <option value="{{ site.baseurl }}{{ page.url }}" selected="selected">{{ key }}</option>
          {%- else -%}
            <option value="{{ value }}">{{ key }}</option>
          {%- endif -%}
        {%- endif -%}
      {%- endfor -%}
    {%- endfor -%}
  </select>
</p>
{%- endif -%}
