---
name: i18n-completeness
description: Check translation completeness for locale files against English keys in this repo. Use when `src/locales/en.ts` changes, when editing localized strings, or when the user asks to verify missing or stale i18n keys.
---

# i18n Completeness

## Goal

Keep locale files aligned with `src/locales/en.ts` so UI text never partially breaks.

## When to run

Run this skill when:
- `src/locales/en.ts` is edited
- Any locale file under `src/locales/` is edited
- The user asks for translation completeness checks

## Source of truth

- Base locale: `src/locales/en.ts`
- Target locales: `src/locales/de.ts`, `src/locales/es.ts`, `src/locales/fr.ts`, `src/locales/pt.ts`

## Workflow

1. Confirm locale files exist:
   - `src/locales/en.ts`
   - `src/locales/de.ts`
   - `src/locales/es.ts`
   - `src/locales/fr.ts`
   - `src/locales/pt.ts`

2. Extract key names from each file with this pattern:
   - Regex: `^\s*([A-Za-z0-9_]+)\s*:\s*`
   - Ignore comments and non-key lines.

3. Compare key sets:
   - Missing keys = in `en.ts` but not in target locale.
   - Extra keys = in target locale but not in `en.ts`.

4. Report results in this format:

```markdown
Locale completeness report

- de: ✅ complete
- es: ❌ 2 missing, 0 extra
  - missing: keyOne, keyTwo
- fr: ✅ complete
- pt: ❌ 0 missing, 1 extra
  - extra: oldKey
```

5. If there are missing or extra keys, propose a fix plan:
   - Add missing keys using English text as placeholders.
   - Remove extras only if they are truly obsolete; otherwise ask for confirmation.

## Commands (preferred)

Use these commands to list candidate key lines quickly:

```bash
rg -n "^\s*[A-Za-z0-9_]+\s*:\s*" src/locales/en.ts src/locales/de.ts src/locales/es.ts src/locales/fr.ts src/locales/pt.ts
```

For precise comparisons, use a small script (Node/TS) or agent-side parsing rather than manual counting.

## Guardrails

- Do not assume key order implies completeness.
- Treat key name matching as exact and case-sensitive.
- Do not delete keys from non-English locales without confirming they are deprecated.
- Keep report concise and actionable.
