import 'server-only'

/**
 * Agenda tarefa assíncrona pós-resposta compatível com Cloudflare Workers (waitUntil)
 * e com ambiente local Node/Vite sem derrubar a resposta HTTP principal.
 */
export function runInBackground(taskFactory: () => Promise<unknown>): void {
  const promise = Promise.resolve()
    .then(() => taskFactory())
    .catch((err) => {
      console.error('[BackgroundTask] Falha tratada em tarefa assíncrona:', err)
    })

  // Em Cloudflare Workers com nodejs_compat/vinext, tenta registrar no ciclo de vida da isolate
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string
  ) => Promise<any>

  dynamicImport('cloudflare:workers')
    .then((mod) => {
      if (mod && typeof mod.waitUntil === 'function') {
        mod.waitUntil(promise)
      }
    })
    .catch(() => {
      // Ambiente Node local fora do workerd: a promise já está em execução com .catch()
    })
}
