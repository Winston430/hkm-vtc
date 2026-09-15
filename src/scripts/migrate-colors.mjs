/**
 * migrate-colors.mjs — apply the dark-mode color→token migration to all
 * source files. Safe to run once; running again does nothing (idempotent).
 *
 *   node migrate-colors.mjs
 *
 * Run it from your project root (the folder that contains /src).
 * Make sure you've also replaced src/index.css with the clean consolidated one.
 */

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'

const REPL = [
  ['peer-checked:bg-ink peer-checked:text-white', 'peer-checked:bg-primary peer-checked:text-on-primary'],
  ['bg-ink text-white', 'bg-primary text-on-primary'],
  ['text-white bg-ink', 'text-on-primary bg-primary'],
  ['hover:bg-black', 'hover:opacity-90'],
  ['from-ink to-[#3a3a3a]', 'from-[#2b2b30] to-[#45454b]'],
  ['border-[#F1F1F1]', 'border-hair'],
  ['bg-[#F0F0F0]', 'bg-active'],
  ['bg-[#EEE]', 'bg-hover'],
  ['bg-[#FAFAFA]', 'bg-hover'],
  ['bg-[#EFEFEF]', 'bg-hair'],
  ['bg-black/[0.06]', 'bg-hair'],
  ['focus:bg-white', 'focus:bg-surface'],
  ['bg-white text-ink', 'bg-surface text-ink'],
  ["'bg-white shadow-", "'bg-surface shadow-"],
  ['bg-white/55', 'bg-canvas/70'],
  ["form.active ? 'bg-ink' : 'bg-surface-soft'", "form.active ? 'bg-success' : 'bg-surface-soft'"],
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (['.tsx', '.ts'].includes(extname(p))) out.push(p)
  }
  return out
}

const files = walk('src')
let changed = 0
const counts = {}
for (const f of files) {
  let s = readFileSync(f, 'utf8')
  const orig = s
  for (const [a, b] of REPL) {
    if (s.includes(a)) {
      counts[a] = (counts[a] || 0) + s.split(a).length - 1
      s = s.split(a).join(b)
    }
  }
  if (s !== orig) {
    writeFileSync(f, s)
    changed++
  }
}

console.log(`\nMigrated ${changed} file(s).`)
for (const [a] of REPL) if (counts[a]) console.log(`  ${counts[a]}×  ${a}`)
console.log('\nDone. Restart your dev server.\n')
