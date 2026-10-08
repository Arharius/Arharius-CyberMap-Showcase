import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('./', import.meta.url)
const sources = Object.fromEntries(
  readdirSync(root, { recursive: true })
    .map(String)
    .filter(
      (path) => /\.(?:tsx?|css)$/.test(path) && !/\.test\.tsx?$/.test(path),
    )
    .map((path) => [`./${path}`, readFileSync(new URL(path, root), 'utf8')]),
)
const entry = {
  'index.html': readFileSync(new URL('../index.html', import.meta.url), 'utf8'),
}

describe('offline visual shell source constraints', () => {
  it('has no external asset literals or runtime transport calls in application sources', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10)
    for (const [path, source] of Object.entries({ ...sources, ...entry })) {
      expect(source, path).not.toMatch(
        /(?:https?:)?\/\/[a-z\d][a-z\d.-]*\.[a-z]{2,}/i,
      )
      expect(source, path).not.toMatch(
        /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\s*\(/,
      )
      expect(source, path).not.toMatch(/@import\s|@font-face/i)
      for (const match of source.matchAll(/url\(([^)]+)\)/g)) {
        expect(match[1], path).toMatch(/^#[a-z-]+$/i)
      }
    }
  })

  it('keeps disclosure styling visible and outside presentation-specific rules', () => {
    const css = sources['./styles.css']
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((match) =>
      match[1].includes('.disclosure'),
    )
    expect(rules.length).toBeGreaterThan(0)
    for (const [, selector, declarations] of rules) {
      expect(selector).not.toContain('.presentation')
      expect(declarations).not.toMatch(
        /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$)/,
      )
    }
    expect(sources['./components/SimulationDisclosure.tsx']).not.toMatch(
      /button|onClick|hidden|aria-hidden/,
    )
  })
})
