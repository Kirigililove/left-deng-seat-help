# 部署到 Vercel

## 1. 先放到 GitHub

在 GitHub 新建一个仓库，建议名字：

`left-deng-seat-help`

仓库可以先设为 Private。

然后把 `left-deng-seat-app` 这个项目上传到仓库。注意不要上传 `.env.local`。

## 2. 在 Vercel 导入仓库

1. 打开 Vercel Dashboard
2. 点 Add New Project
3. 选择刚刚的 GitHub 仓库
4. Framework Preset 选 Next.js
5. Root Directory 如果看到可选项，选项目根目录
6. 暂时不要 Deploy，先填环境变量

## 3. Vercel 环境变量

在 Project Settings -> Environment Variables 里添加：

`NEXT_PUBLIC_SUPABASE_URL`

`NEXT_PUBLIC_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY`

`SESSION_SECRET`

`SESSION_SECRET` 用一串很长的随机字符即可，建议 40 位以上。

## 4. 部署

填完环境变量后点 Deploy。

如果构建失败，把 Vercel 的报错复制给 Codex 修。

## 5. 上线前安全事项

- 正式上线前建议在 Supabase rotate 一次 service_role key。
- 管理员初始密码 `admin123456` 必须改掉。
- Supabase 项目不要公开 service_role key。
- GitHub 仓库里不能出现 `.env.local`。
