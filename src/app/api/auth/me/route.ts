import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';

export async function GET() {
  const token = cookies().get('ld_session')?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from('app_users')
    .select('id, account, role, status, weibo_name, wechat_name, offline_group, reject_reason')
    .eq('id', session.userId)
    .maybeSingle();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data || result.data.status === 'deactivated') return NextResponse.json({ user: null }, { status: 401 });
  const role = result.data.role === 'admin' ? 'admin' : 'user';
  const eventId = await getActiveEventId();
  const seatResult = await supabase
    .from('seats')
    .select('row_no, seat_no, venue_zones(tier_name, zone_name)')
    .eq('event_id', eventId)
    .eq('user_id', result.data.id)
    .maybeSingle();
  const zone = Array.isArray(seatResult.data?.venue_zones) ? seatResult.data?.venue_zones[0] : seatResult.data?.venue_zones;
  const seat = seatResult.data && zone ? { tier: zone.tier_name, zone: zone.zone_name, row: seatResult.data.row_no, no: seatResult.data.seat_no } : null;
  return NextResponse.json({ user: { ...result.data, role, seat } });
}
