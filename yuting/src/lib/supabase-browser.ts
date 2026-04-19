import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Client = ReturnType<typeof createSupabaseClient<Database>>;
let _client: Client | null = null;

export function createClient(): Client {
  if (!_client) {
    _client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}
