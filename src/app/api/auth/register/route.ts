import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { account?: string; password?: string } | null;
  const account = body?.account?.trim();
  const password = body?.password ?? '';
  if (!account || !password) return NextResponse.json({ error: '账号和密码都要填' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const existing = await supabase.from('app_users').select('id').eq('account', account).maybeSingle();
  if (existing.data) return NextResponse.json({ error: '这个用户名已经被占用，请重新想一个' }, { status: 409 });
  if (existing.error && existing.error.code !== 'PGRST116') return NextResponse.json({ error: existing.error.message }, { status: 500 });

  const created = await supabase.from('app_users').insert({
    account,
    password_hash: hashPassword(password),
    role: 'user',
    status: 'needs_proof'
  }).select('id, account, role, status').single();

  if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });
  const role = created.data.role === 'admin' ? 'admin' : 'user';
  const response = NextResponse.json({ user: { ...created.data, role } });
  response.cookies.set('ld_session', createSessionToken({ userId: created.data.id, role }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
