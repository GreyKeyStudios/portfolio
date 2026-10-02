// Loads a TypeScript module from Node without a build step, so validators read
// the same source of truth the app does instead of a hand-copied snapshot.
// Resolves the `@/` path alias and stubs `.json` via Node's own loader.
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

const ROOT = path.resolve(__dirname, '..', '..')

if (!require.extensions['.ts']) {
  require.extensions['.ts'] = (module, file) => {
    const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, resolveJsonModule: true },
      fileName: file,
    }).outputText
    module._compile(out, file)
  }
  const resolve = Module._resolveFilename
  Module._resolveFilename = function (request, ...rest) {
    if (request.startsWith('@/')) request = path.join(ROOT, request.slice(2))
    return resolve.call(this, request, ...rest)
  }
}

module.exports = { ROOT, load: (rel) => require(path.join(ROOT, rel)) }
