import type { SupabaseAdapter, QueryBuilder, StorageClient, Result } from '@shared/lib/adapter'
import { MiniStorageClient } from './storage'

const SUPABASE_URL = process.env.TARO_APP_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.TARO_APP_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Config] Missing TARO_APP_SUPABASE_URL or TARO_APP_SUPABASE_ANON_KEY -- check your build environment')
}

/**
 * Wraps wx.request in a Promise with proper success/fail handling.
 */
function wxRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown
): Promise<{ data: unknown; status: number }> {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: method as 'GET' | 'POST' | 'PATCH' | 'DELETE',
      header: headers,
      data: body,
      success: (res) => resolve({ data: res.data, status: res.statusCode }),
      fail: reject,
    })
  })
}

/**
 * PostgREST query builder that constructs proper PostgREST URLs
 * from chained method calls, then executes via wx.request.
 *
 * Supports all query patterns used in trips.ts:
 * - select with !inner joins
 * - eq with cross-table filters (trips.couple_id)
 * - not(col, op, val) three-parameter form
 * - in(column, values) for batch queries
 * - rpc<T> for database functions
 */
class PostgrestQueryBuilder implements QueryBuilder {
  private params: Record<string, string> = {}
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET'
  private body: unknown = undefined
  private prefer: string = ''

  constructor(
    private baseUrl: string,
    private table: string,
    private getToken: () => string
  ) {}

  private headers(): Record<string, string> {
    const token = this.getToken()
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  private url(): string {
    const qs = Object.entries(this.params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    return `${this.baseUrl}/rest/v1/${this.table}${qs ? '?' + qs : ''}`
  }

  select(columns: string): QueryBuilder {
    this.params['select'] = columns
    return this
  }

  eq(column: string, value: unknown): QueryBuilder {
    this.params[column] = `eq.${value}`
    return this
  }

  is(column: string, value: null): QueryBuilder {
    this.params[column] = 'is.null'
    return this
  }

  or(filter: string): QueryBuilder {
    this.params['or'] = filter
    return this
  }

  not(column: string, op: string, value: unknown): QueryBuilder {
    // PostgREST: ?column=not.op.value
    // e.g. .not('user_b_id', 'is', null) -> ?user_b_id=not.is.null
    this.params[column] = `not.${op}.${value}`
    return this
  }

  in(column: string, values: unknown[]): QueryBuilder {
    // PostgREST: ?column=in.("val1","val2","val3")
    // Quote string values, leave numbers unquoted
    const formatted = values.map(v =>
      typeof v === 'string' ? `"${v}"` : String(v)
    ).join(',')
    this.params[column] = `in.(${formatted})`
    return this
  }

  order(column: string, opts: { ascending: boolean }): QueryBuilder {
    this.params['order'] = `${column}.${opts.ascending ? 'asc' : 'desc'}`
    return this
  }

  async insert(data: unknown): Promise<Result> {
    this.method = 'POST'
    this.body = data
    this.prefer = 'return=representation'
    return this.execute()
  }

  update(data: unknown): QueryBuilder {
    this.method = 'PATCH'
    this.body = data
    this.prefer = 'return=representation'
    return this
  }

  delete(): QueryBuilder {
    this.method = 'DELETE'
    this.prefer = 'return=representation'
    return this
  }

  async maybeSingle(): Promise<Result> {
    const result = await this.execute()
    if (result.error) return result
    const arr = result.data as unknown[] | null
    return { data: arr && arr.length > 0 ? arr[0] : null, error: null }
  }

  then(resolve: (result: Result) => void): void {
    this.execute().then(resolve)
  }

  private async execute(): Promise<Result> {
    const headers = this.headers()
    if (this.prefer) {
      headers['Prefer'] = this.prefer
    }

    const result = await wxRequest(this.method, this.url(), headers, this.body)
    if (result.status >= 200 && result.status < 300) {
      return { data: result.data, error: null }
    }
    return {
      data: null,
      error: {
        message: `PostgREST error ${result.status}: ${JSON.stringify(result.data)}`,
      },
    }
  }
}

export class MiniSupabaseAdapter implements SupabaseAdapter {
  private token: string = ''

  setToken(token: string): void {
    this.token = token
  }

  getToken(): string {
    return this.token
  }

  from(table: string): QueryBuilder {
    return new PostgrestQueryBuilder(SUPABASE_URL, table, () => this.token)
  }

  get storage(): StorageClient {
    return new MiniStorageClient(() => this.token)
  }

  async rpc<T = unknown>(fn: string, params?: Record<string, unknown>): Promise<Result<T>> {
    const url = `${SUPABASE_URL}/rest/v1/rpc/${fn}`
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
    const result = await wxRequest('POST', url, headers, params ?? {})
    if (result.status >= 200 && result.status < 300) {
      return { data: result.data as T, error: null }
    }
    return { data: null, error: { message: `RPC error ${result.status}` } }
  }
}

export { SUPABASE_URL, SUPABASE_ANON_KEY }
