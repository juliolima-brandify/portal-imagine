import 'server-only'
import { getRequestExecutionContext } from 'vinext/shims/request-context'

/**
 * Agenda uma tarefa pós-resposta sem derrubar a resposta HTTP principal.
 *
 * Ordem de resolução:
 * 1. ExecutionContext do vinext/Cloudflare Workers (`ctx.waitUntil`).
 * 2. `globalThis.waitUntil` quando o runtime o expõe.
 * 3. Execução normal da Promise (Node local), com erro sempre capturado.
 *
 * Qualquer falha de resolução é tratada: o webhook nunca deve responder 500
 * depois de já ter gravado no banco.
 */
export function runInBackground(taskFactory: () => Promise<unknown>): Promise<void> {
  const promise = Promise.resolve()
    .then(() => taskFactory())
    .then(() => undefined)
    .catch((err) => {
      console.error('[BackgroundTask] Falha tratada em tarefa de fundo', err)
    })

  try {
    const ctx = getRequestExecutionContext()
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(promise)
      return promise
    }
  } catch (err) {
    console.error('[BackgroundTask] Falha ao obter ExecutionContext', err)
  }

  try {
    const globalWaitUntil = (globalThis as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil
    if (typeof globalWaitUntil === 'function') {
      globalWaitUntil(promise)
      return promise
    }
  } catch (err) {
    console.error('[BackgroundTask] Falha ao registrar waitUntil global', err)
  }

  return promise
}
