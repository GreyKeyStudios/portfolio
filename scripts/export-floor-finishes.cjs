const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file)
const l = require('../lib/interior-layout.ts')
const data = {X0:l.X0, shaft:{minX:l.CORE_MIN_X,maxX:l.CORE_MAX_X,minZ:l.CORE_Z0,maxZ:l.CORE_Z1},rooms:l.ROOMS.filter(r=>['ground','second'].includes(r.floor))}
fs.writeFileSync('portfolio-assets/stack-house/blender/floor-finishes-layout-v002.json',JSON.stringify(data,null,2))
