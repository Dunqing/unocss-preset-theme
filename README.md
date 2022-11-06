# unocss-preset-theme

This preset will help you easily make dynamic theme switching. Inspired by [here](https://github.com/unocss/unocss/issues/1390)

> Next, I will build [unocss-preset-antd](https://github.com/Dunqing/unocss-preset-antd) based on this preset

## Installation

```bash
npm i -D unocss-preset-theme
```

```ts
import presetTheme from 'unocss-preset-theme'

Unocss({
  theme: {},
  presets: [
    presetTheme({
      theme: {
        dark: {
        },
        compact: {
        }
      }
    }),
  ],
})
```

## Usages

Usually you just need to set your `light theme` to `unocss` and your `dark theme` to `presetTheme`. This preset will transform your provide theme into css variables, then you just need to set the `dark` class or `compact` class (Depends on your theme name) in your html and you're done.

### Just like this

```typescript
import unocss from 'unocss/vite'
import type { Theme } from 'unocss/preset-uno'
import { presetUno } from 'unocss'
import presetTheme from 'unocss-preset-theme'

unocss<Theme>({
  // Configure light themes
  theme: {
  },
  presets: [
    presetUno<Theme>(),
    presetTheme<Theme>({
      theme: {
        // Configure dark themes
        dark: {
        },
        // Configure compact themes
        compact: {
        }
      }
    })
  ]
})
```

### This will be the final generated css

```css
.dark{}
:root{}
.compact{}
```

## Options

### theme

Your different theme. like `{ dark: {}, other: {} }`

### prefix

The prefix of the generated css variables, default is `--un-preset-theme`

## Examples

Please refer to the [playground](/playground/vite.config.ts) 


## License

MIT License
