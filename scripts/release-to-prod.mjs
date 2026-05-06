import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const bumpTouchedFiles = [
  'android/app/build.gradle',
  'android/app/src/main/assets/public/app-version.json',
  'package.json',
  'package-lock.json',
]

function run(command) {
  console.log(`\n> ${command}`)
  execSync(command, { cwd: root, stdio: 'inherit' })
}

function runCapture(command) {
  return execSync(command, { cwd: root, stdio: 'pipe', encoding: 'utf8' }).trim()
}

function main() {
  run('npm run release:bump-version')

  const changedInWorkingTree = runCapture('git diff --name-only')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const changedInIndex = runCapture('git diff --cached --name-only')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const changedFiles = [...new Set([...changedInWorkingTree, ...changedInIndex])].filter((file) =>
    bumpTouchedFiles.includes(file),
  )

  if (changedFiles.length > 0) {
    run(`git add ${changedFiles.map((file) => `"${file}"`).join(' ')}`)
    const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
    run(`git commit -m "chore: bump release version to ${version}" -- ${changedFiles.map((file) => `"${file}"`).join(' ')}`)
  } else {
    console.log('\nNo release-version changes detected to commit.')
  }

  run('npm run build')
  run('npx cap sync android')
  run('npx cap open android')
}

main()
