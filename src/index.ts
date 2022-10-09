import type { Preset } from 'unocss'
import { mergeDeep } from 'unocss'
import { toVar } from './helpers'

const PRESET_THEME_RULE = 'PRESET_THEME_RULE'

export interface PresetTheme<Theme> {
  theme: Record<string, Theme>
  /**
   * @default --un-preset-theme
   */
  prefix?: string
}

const getThemeVal = (theme: any, keys: string[], index = 0) => {
  for (const key of keys) {
    theme = theme[key]
    if (theme === undefined)
      return
  }
  return Array.isArray(theme) ? theme[index] : theme
}

interface ThemeValue {
  theme: Record<string, string | undefined>
  name: string
}

export const presetTheme = <T extends {}>(options: PresetTheme<T>): Preset<T> => {
  const { prefix = '--un-preset-theme' } = options
  const theme = options.theme
  const keys = Object.keys(theme)
  const varsRE = new RegExp(`var\\((${prefix}.*)\\)`)
  const themeValues = new Map<string, ThemeValue>()
  const usedTheme: Array<ThemeValue> = []

  return {
    name: 'unocss-preset-theme',
    extendTheme(originalTheme) {
      const recursiveTheme = (curTheme: Record<string, any>, preKeys: string[] = []) => {
        Object.keys(curTheme).forEach((key) => {
          const val = Reflect.get(curTheme, key)
          const themeKeys = preKeys.concat(key)

          const setThemeValue = (name: string, index = 0) => {
            const defaultValue = getThemeVal(originalTheme, themeKeys) ?? ''
            themeValues.set(name, {
              theme: keys.reduce((obj, key) => {
                obj[key] = getThemeVal(theme[key], themeKeys, index) ?? defaultValue
                return obj
              }, {} as ThemeValue['theme']),
              name,
            })
          }

          if (Array.isArray(val)) {
            val.forEach((_, index) => {
              const name = [prefix, ...themeKeys, index].join('-')
              val[index] = toVar(name)
              setThemeValue(name, index)
            })
          }
          else if (typeof val === 'string') {
            const name = [prefix, ...themeKeys].join('-')
            curTheme[key] = toVar(name)
            setThemeValue(name)
          }
          else {
            recursiveTheme(val, themeKeys)
          }
        })
        return curTheme
      }

      Object.assign(originalTheme, mergeDeep(originalTheme, recursiveTheme(
        keys.reduce((obj, key) => {
          return mergeDeep(obj, theme[key])
        }, {} as T),
      )))
    },
    rules: [
      [
        new RegExp(`^${PRESET_THEME_RULE}\:(\\w+)$`),
        (re) => {
          return usedTheme.reduce((obj, e) => {
            const key = re?.[1]
            if (!key)
              return obj
            return {
              ...obj,
              [e.name]: e.theme[key],
            }
          }, {})
        },
      ],
    ],
    layers: {
      theme: 0,
      default: 1,
    },
    preflights: [
      {
        layer: 'theme',
        async getCSS(context) {
          await context.generator.generate('', { preflights: false })
          const { css } = (await context.generator.generate(keys.map(key => `${['dark', 'light'].includes(key) ? `${key}:` : ''}${PRESET_THEME_RULE}:${key}`), {
            preflights: false,
          }))
          const isMedia = css.includes('@media (prefers-color-scheme')
          return css
            .replace(/\/\* layer: .* \*\/\n/, '')
            .replace(new RegExp(`(?:\\.(?:dark|light))?.*${PRESET_THEME_RULE}\\\\\\:(${keys.join('|')})(\{(.*)\})?`, 'gm'), (full, kind, targetCSS, cleanCode) => {
              if (isMedia)
                return cleanCode
              return `${kind === 'light' ? 'root' : `.${kind}`}${targetCSS || ''}`
            })
        },
      },
    ],
    postprocess(util) {
      util.entries.forEach(([, val]) => {
        if (typeof val === 'string') {
          const varName = val.match(varsRE)?.[1]
          if (varName) {
            const values = themeValues.get(varName)
            if (values)
              usedTheme.push(values)
          }
        }
      })
    },
  }
}

export default presetTheme
