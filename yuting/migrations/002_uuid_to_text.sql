-- 002_uuid_to_text.sql
-- 将 users.id、couples.user_a_id、couples.user_b_id 从 uuid 改为 text，
-- 以兼容微信 openid 字符串（WeChat openid 是全局唯一标识符，不需要 UUID）。

-- Step 1: 删除外键约束（先删才能改列类型）
ALTER TABLE couples DROP CONSTRAINT IF EXISTS couples_user_a_id_fkey;
ALTER TABLE couples DROP CONSTRAINT IF EXISTS couples_user_b_id_fkey;

-- Step 2: 修改列类型
ALTER TABLE users ALTER COLUMN id TYPE text;
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE couples ALTER COLUMN user_a_id TYPE text;
ALTER TABLE couples ALTER COLUMN user_b_id TYPE text;

-- Step 3: 重新添加外键约束
ALTER TABLE couples ADD CONSTRAINT couples_user_a_id_fkey FOREIGN KEY (user_a_id) REFERENCES users(id);
ALTER TABLE couples ADD CONSTRAINT couples_user_b_id_fkey FOREIGN KEY (user_b_id) REFERENCES users(id);
