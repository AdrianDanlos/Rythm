/**
 * Bumps Android release metadata in one pass: versionCode, versionName,
 * app-version manifests, package.json, and root entries in package-lock.json.
 *
 * Usage:
 *   node scripts/bump-release-version.mjs           # patch (1.0.7 -> 1.0.8)
 *   node scripts/bump-release-version.mjs minor
 *   node scripts/bump-release-version.mjs major
 *   node scripts/bump-release-version.mjs 2.0.0   # exact version (versionCode still +1)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const GRADLE = join(root, 'android', 'app', 'build.gradle')
const APP_VERSION_PUBLIC = join(root, 'public', 'app-version.json')
const APP_VERSION_ANDROID = join(
  root,
  'android',
  'app',
  'src',
  'main',
  'assets',
  'public',
  'app-version.json',
)
const PACKAGE_JSON = join(root, 'package.json')
const PACKAGE_LOCK = join(root, 'package-lock.json')

function parseSemver(v) {
  const m = String(v).trim().match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!m) throw new Error(`Invalid semver (expected x.y.z): ${v}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function formatSemver(parts) {
  return `${parts[0]}.${parts[1]}.${parts[2]}`
}

function bumpSemver(version, kind) {
  const [maj, min, pat] = parseSemver(version)
  if (kind === 'major') return [maj + 1, 0, 0]
  if (kind === 'minor') return [maj, min + 1, 0]
  return [maj, min, pat + 1]
}

function readGradleVersions() {
  const text = readFileSync(GRADLE, 'utf8')
  const codeMatch = text.match(/versionCode\s+(\d+)/)
  const nameMatch = text.match(/versionName\s+"([^"]+)"/)
  if (!codeMatch || !nameMatch) {
    throw new Error(`Could not parse versionCode / versionName in ${GRADLE}`)
  }
  return {
    text,
    versionCode: parseInt(codeMatch[1], 10),
    versionName: nameMatch[1],
  }
}

function applyLockfileRootVersion(lockText, newVersion) {
  const rootBlock = lockText.replace(
    /^(\{\r?\n  "name": "rythm",\r?\n  "version": ")[^"]+("\s*,\r?\n)/m,
    `$1${newVersion}$2`,
  )
  if (rootBlock === lockText) {
    throw new Error('Could not update root version in package-lock.json')
  }
  const withPackages = rootBlock.replace(
    /^(\s{4}"": \{\r?\n\s{6}"name": "rythm",\r?\n\s{6}"version": ")[^"]+("\s*,\r?\n)/m,
    `$1${newVersion}$2`,
  )
  if (withPackages === rootBlock) {
    throw new Error('Could not update workspace package version in package-lock.json')
  }
  return withPackages
}

const args = process.argv.slice(2).filter((a) => a !== '--dry-run')
const dryRun = process.argv.includes('--dry-run')
const arg = args[0]

const { text: gradleText, versionCode, versionName: currentName } = readGradleVersions()
let nextName
if (arg === undefined || arg === 'patch' || arg === 'minor' || arg === 'major') {
  const kind = arg === 'minor' || arg === 'major' ? arg : 'patch'
  nextName = formatSemver(bumpSemver(currentName, kind))
} else if (/^\d+\.\d+\.\d+$/.test(arg)) {
  nextName = arg
} else {
  console.error(`Unknown argument: ${arg}`)
  console.error(
    'Use: patch | minor | major (default: patch), or an exact version e.g. 1.2.3',
  )
  process.exit(1)
}

const nextCode = versionCode + 1

const nextGradle = gradleText
  .replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${nextName}"`)

const manifest = `${JSON.stringify({ androidLatestVersion: nextName }, null, 2)}\n`

if (dryRun) {
  console.log('[dry-run] Would set:')
  console.log(`  versionName: ${currentName} -> ${nextName}`)
  console.log(`  versionCode: ${versionCode} -> ${nextCode}`)
  console.log('  (no files written)')
  process.exit(0)
}

const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'))
pkg.version = nextName
const nextPkg = `${JSON.stringify(pkg, null, 2)}\n`

const lockRaw = readFileSync(PACKAGE_LOCK, 'utf8')
const nextLock = applyLockfileRootVersion(lockRaw, nextName)

writeFileSync(GRADLE, nextGradle)
writeFileSync(APP_VERSION_PUBLIC, manifest)
writeFileSync(APP_VERSION_ANDROID, manifest)
writeFileSync(PACKAGE_JSON, nextPkg)
writeFileSync(PACKAGE_LOCK, nextLock)

console.log(`Release bump: ${currentName} (code ${versionCode}) -> ${nextName} (code ${nextCode})`)
console.log('Updated:')
console.log(`  ${GRADLE}`)
console.log(`  ${APP_VERSION_PUBLIC}`)
console.log(`  ${APP_VERSION_ANDROID}`)
console.log(`  ${PACKAGE_JSON}`)
console.log(`  ${PACKAGE_LOCK}`)
