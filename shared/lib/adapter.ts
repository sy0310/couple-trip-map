export interface Result<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

export interface QueryBuilder {
  select(columns: string): QueryBuilder;
  eq(column: string, value: unknown): QueryBuilder;
  is(column: string, value: null): QueryBuilder;
  or(filter: string): QueryBuilder;
  not(column: string, op: string, value: unknown): QueryBuilder;
  in(column: string, values: unknown[]): QueryBuilder;
  order(column: string, opts: { ascending: boolean }): QueryBuilder;
  insert(data: unknown): Promise<Result>;
  update(data: unknown): QueryBuilder;
  delete(): QueryBuilder;
  maybeSingle(): Promise<Result>;
  then(resolve: (result: Result) => void): void;
}

export interface BucketClient {
  upload(path: string, file: unknown, opts?: { contentType?: string }): Promise<Result>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
  remove(paths: string[]): Promise<Result>;
}

export interface StorageClient {
  from(bucket: string): BucketClient;
}

export interface SupabaseAdapter {
  setToken(token: string): void;
  from(table: string): QueryBuilder;
  storage: StorageClient;
  rpc<T = unknown>(fn: string, params?: Record<string, unknown>): Promise<Result<T>>;
}
