import { ensureProjectDotenvForRuntime } from '../../env/load-dotenv'

/** Same as billing gate: real project root from `cwd` walk (Nitro `rootDir` can be off in dev). */
export default defineNitroPlugin(() => {
  ensureProjectDotenvForRuntime()
})
