import { createContext } from 'react'
import type { SupabaseAdapter } from '@shared/lib/adapter'
import { MiniSupabaseAdapter } from './services/supabase'

interface AppContextValue {
  adapter: SupabaseAdapter
  userId: string | null
  loading: boolean
}

export const AppContext = createContext<AppContextValue>({
  adapter: new MiniSupabaseAdapter(),
  userId: null,
  loading: true,
})
