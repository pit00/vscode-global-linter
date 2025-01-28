# Global Linter

Extension for [Visual Studio Code](https://code.visualstudio.com/) that lets you configure simple code diagnostics from regular expressions.

## Features

- Define multiple rules that lint your documents in real-time
- Custom Diagnostic message supports RegExp string interpolation placeholders:
  - `$$` Inserts a "$".
  - `$&` Inserts the matched substring.
  - `` $` `` Inserts the portion of the string that precedes the matched substring.
  - `$'` Inserts the portion of the string that follows the matched substring.
  - `$n` Where n is a positive integer less than 100, inserts the nth parenthesized submatch string, provided the first argument was a RegExp object. Note that this is 1-indexed. If a group n is not present (e.g., if group is 3), it will be replaced as a literal (e.g., $3).
  - `$<Name>` Where Name is a capturing group name. If the  group is not in the match, or not in the regular expression, or if a  string was passed as the first argument to replace instead of a regular expression, this resolves to a literal (e.g., $\<Name\>). Only available in browser versions supporting named capturing groups.
  
    source: [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter)
- Diagnostic ranges are highlighted in the editor according to severity level

## Example

```json
// settings.json
"global-linter.rules": [
  {
    "name": "example-rule",
    "languages": ["html"],
    "pattern": "([lL]orem ipsum.+?)$",
    "message": "Lorem ipsum line detected: $1",
    "severity": "Warning"
  }
]
```

```html
<!-- some-file.html -->
<p>Some text here. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, assumenda.</p>
```

Will produce a warning diagnotic in html files only:

> Lorem text detected: Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, assumenda.

## Requirements

This extension requires Visual Studio Code v1.0.0 or higher.

## Extension Settings

The configuration options can be found in the `contributes.configuration` section of the package.json.
