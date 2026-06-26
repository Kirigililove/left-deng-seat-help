-- RLS 草案：正式上线前需要根据实际 auth.users 关系调整。
-- 目标：普通用户永远不能直接读取全场座位和自证图片。

alter table app_users enable row level security;
alter table seats enable row level security;
alter table proof_submissions enable row level security;
alter table proof_answers enable row level security;

-- 用户可以读取自己的基础信息。
-- 管理员可以读取全部信息。
-- 具体策略需要结合 Supabase Auth 的 uid 映射。

-- 附近座位建议不要直接开放 seats 表 select；
-- 应通过 RPC / Edge Function 在服务端计算附近范围后返回。

-- 自证图片 Storage bucket 只允许管理员读取；用户只能上传自己的文件。