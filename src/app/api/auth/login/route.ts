import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { account?: string; password?: string } | null;
  const account = body?.account?.trim();
  const password = body?.password ?? '';
  if (!account || !password) return NextResponse.json({ error: '账号和密码都要填' }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from('app_users')
    .select('id, account, password_hash, role, status, weibo_name, wechat_name, offline_group, reject_reason')
    .eq('account', account)
    .maybeSingle();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data || !verifyPassword(password, result.data.password_hash)) {
    return NextResponse.json({ error: '账号或密码不对' }, { status: 401 });
  }
  if (result.data.status === 'deactivated') return NextResponse.json({ error: '账号已注销' }, { status: 403 });

  const { password_hash: _passwordHash, ...rawUser } = result.data;
  const role = rawUser.role === 'admin' ? 'admin' : 'user';
  const eventId = await getActiveEventId();
  const seatResult = await supabase
    .from('seats')
    .select('row_no, seat_no, venue_zones(tier_name, zone_name)')
    .eq('event_id', eventId)
    .eq('user_id', rawUser.id)
    .maybeSingle();
  const zone = Array.isArray(seatResult.data?.venue_zones) ? seatResult.data?.venue_zones[0] : seatResult.data?.venue_zones;
  const seat = seatResult.data && zone ? { tier: zone.tier_name, zone: zone.zone_name, row: seatResult.data.row_no, no: seatResult.data.seat_no } : null;
  const user = { ...rawUser, role, seat };
  const response = NextResponse.json({ user });
  response.cookies.set('ld_session', createSessionToken({ userId: user.id, role }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
