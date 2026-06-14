'use client'

import {
  QueryClient,
  QueryClientProvider,
  environmentManager
} from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/react-query'

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  const isServer = environmentManager.isServer()
  if (isServer) {
    return makeQueryClient()
  }

  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
