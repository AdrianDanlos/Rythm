// Declare Deno for TypeScript tooling; Supabase Edge runtime provides it at runtime.
declare global {
  const Deno: {
    env: {
      get(name: string): string | undefined
    }
    serve: (handler: (request: Request) => Response | Promise<Response>) => void
  }
}

export {}
