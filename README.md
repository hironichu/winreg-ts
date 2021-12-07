<p align="center">
<img width="720" height="304" src="https://user-images.githubusercontent.com/75753187/123358567-aac7b900-d539-11eb-8275-0b380264bb4c.png" alt="">
</p>
# winreg-Deno

> **NOTE**: This is not production ready, and is only meant to be used for testing purposes.

This is a Deno port of Winreg-ts from NPMJS, that allows the user to read and write registry values.

Compared to the original Repo/Fork I have made some breaking changes to how it works.
I have removed the Callback returns from the methods and instead return a Promise with the result or the error.
this allows a clean and consistent Lib to use.


~~Basically, it is a raw migration of the original project https://github.com/fresc81/node-winreg to typescript.
We even keep the code formatting and design to ease the comparaison and do not introduce regressions.
We just add utf8 support from https://github.com/eskibear/node-winreg-utf8~~

# Installation
The following command installs winreg-deno.

> For now only the use in Deno is supported

```bash
TBA
```

# Use in Deno
```
import { Registry } from 'https://deno.land/x/winreg-deno';

const regKey = new Registry({
    hive: Registry.HKCU,
    key: '\\Software\\Microsoft\\Windows\\CurrentVersion',
    utf8: true
});
//This will return the value of the key "CurrentVersion"
//Note that to get the value of a key, you need to call the registry.get() / registry.values() / registry.keys() methods

```



# MIT License

Copyright (c) 2020 Emmanuel Kimmerlin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.