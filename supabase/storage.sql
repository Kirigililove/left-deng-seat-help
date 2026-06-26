-- 自证截图存储桶
-- 使用方式：复制到 Supabase SQL Editor 执行。
-- 文件真实上传由服务端 service_role 完成，普通用户不会直接拿到写权限。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proof-files', 'proof-files', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
