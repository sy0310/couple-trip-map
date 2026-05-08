-- 003_link_accounts.sql
-- Links WeChat openids to Supabase Auth user IDs for cross-platform account unification.

-- user_links table: stores WeChat openid -> Supabase Auth UUID mapping
CREATE TABLE IF NOT EXISTS user_links (
  wechat_openid TEXT PRIMARY KEY,
  auth_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RPC: link_account — insert or update the mapping
CREATE OR REPLACE FUNCTION link_account(p_openid TEXT, p_auth_user_id TEXT, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO user_links (wechat_openid, auth_user_id, email)
  VALUES (p_openid, p_auth_user_id, p_email)
  ON CONFLICT (wechat_openid)
  DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id, email = EXCLUDED.email, linked_at = now();
  RETURN TRUE;
END;
$$;

-- RPC: get_linked_auth_id — returns the Supabase Auth UUID for a WeChat openid
CREATE OR REPLACE FUNCTION get_linked_auth_id(p_openid TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT auth_user_id FROM user_links WHERE wechat_openid = p_openid;
$$;

-- RPC: unlink_account — removes the mapping
CREATE OR REPLACE FUNCTION unlink_account(p_openid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM user_links WHERE wechat_openid = p_openid;
  SELECT TRUE;
$$;

-- RLS: block direct table access, all access through SECURITY DEFINER RPCs
ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RPC-only access for user_links" ON user_links;
CREATE POLICY "RPC-only access for user_links"
  ON user_links
  FOR ALL
  USING (false)
  WITH CHECK (false);
