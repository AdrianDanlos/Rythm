// Declare Deno for TypeScript tooling; Supabase Edge runtime provides it at runtime.
declare global {
  const Deno: {
    env: {
      get(name: string): string | undefined
    }
  }
}

export {}
