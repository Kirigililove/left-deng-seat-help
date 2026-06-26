# Supabase 设置说明

1. 注册并登录 Supabase。
2. 新建 project。
3. 在 SQL Editor 中执行 `supabase/schema.sql`。
4. 创建 Storage bucket：`proofs`。
5. 复制 Project URL 和 anon key，填入 `.env.local`。
6. service role key 只给服务端使用，不要暴露到浏览器。

`.env.local` 示例：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
SUPABASE_SERVICE_ROLE_KEY=你的 service role key
```