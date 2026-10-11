# simple-null-delimited-line-splitter

Splits file content on NUL (`\u0000`) bytes instead of newlines, for parsing null-separated record formats such as those produced by `find -print0` or `xargs -0`.

```js
import { split, splitString, splitBuffer } from 'simple-null-delimited-line-splitter';

splitString('file1.txt\u0000file2.txt\u0000');
// => ['file1.txt', 'file2.txt', '']

splitBuffer(Buffer.from('data\u0000more data'));
// => [Buffer<'data'>, Buffer<'more data'>]
```

## Why this exists

Some Unix tools emit records separated by NUL bytes specifically because newlines can appear inside filenames. Standard line-splitting utilities cannot handle that. This library provides a single, predictable function for that job with no dependencies.

## Edge cases to be aware of

Every NUL byte is treated as a separator, so consecutive NULs produce empty records (`"a\u0000\u0000b"` becomes `["a", "", "b"]`). A trailing NUL produces a trailing empty record (`"a\u0000"` becomes `["a", ""]`). Empty input returns `[]`, not `[""]`. This matches the semantics where each separator delimits a field and its presence implies content on both sides.

For `Buffer` input, `splitBuffer` returns subarray slices that share memory with the input buffer—no copy is made. If you need stable, independent buffers, call `Buffer.from()` on each result.

The `split` function dispatches on input type: strings yield strings, Buffers yield Buffers. Anything else throws `TypeError`.
