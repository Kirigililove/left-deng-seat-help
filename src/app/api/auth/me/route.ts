import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';

type SeatWithZone = { row_no: number; seat_no: number; venue_zones?: { tier_name: string; zone_name: string } | { tier_name: string; zone_name: string }[] | null };


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
  const seatData = seatResult.data as SeatWithZone | null;
  const zone = Array.isArray(seatData?.venue_zones) ? seatData?.venue_zones[0] : seatData?.venue_zones;
  const seat = seatData && zone ? { tier: zone.tier_name, zone: zone.zone_name, row: seatData.row_no, no: seatData.seat_no } : null;
  return NextResponse.json({ user: { ...result.data, role, seat } });
}
