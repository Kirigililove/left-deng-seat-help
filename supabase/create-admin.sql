-- 后台预置管理员账号
-- 使用方式：复制到 Supabase SQL Editor 执行。
-- 初始账号：admin
-- 初始密码：admin123456
-- 正式上线前请换一个只有小管知道的强密码。

insert into app_users(account, password_hash, role, status, weibo_name, wechat_name, offline_group)
values ('admin', 'pbkdf2$310000$78bf355c1be94db0fc4cc163c881430f$ad1d683e7275c12306cfc85100ccb61f84d0343e4d86cca6989e92c3d7c586eb', 'admin', 'approved', '管理员', '管理员', true)
on conflict(account) do update set
  password_hash = excluded.password_hash,
  role = 'admin',
  status = 'approved';
