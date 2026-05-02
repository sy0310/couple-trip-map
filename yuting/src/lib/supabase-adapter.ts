import type { SupabaseAdapter, QueryBuilder, StorageClient, Result } from '../../../shared/lib/adapter'
import { createClient } from './supabase-browser'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * WebSupabaseAdapter wraps the @supabase/supabase-js client
 * to implement the shared SupabaseAdapter interface.
 *
 * This enables shared business logic (trips.ts, couples.ts) to work
 * on the web side without any wx.* or browser-specific API calls.
 */
export class WebSupabaseAdapter implements SupabaseAdapter {
  private client: SupabaseClient<Database>

  constructor() {
    this.client = createClient()
  }

  from(table: string): QueryBuilder {
    // The supabase-js client's .from() returns a compatible builder.
    // We cast to our QueryBuilder interface since the shapes match.
    return this.client.from(table as keyof Database['public']['Tables'] & string) as unknown as QueryBuilder
  }

  get storage(): StorageClient {
    return this.client.storage as unknown as StorageClient
  }

  async rpc<T = unknown>(fn: string, params?: Record<string, unknown>): Promise<Result<T>> {
    const { data, error } = await this.client.rpc(fn as never, params as never)
    return {
      data: data as T,
      error: error ? { message: error.message } : null,
    }
  }
}
