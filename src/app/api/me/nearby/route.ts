import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

export async function GET() {
  try {
    const user = await requireUser();
    if (user.status !== 'approved') return NextResponse.json({ error: '审核通过后才能查看附近同担' }, { status: 403 });

    const eventId = await getActiveEventId();
    const supabase = createAdminSupabaseClient();
    const ownSeat = await supabase
      .from('seats')
      .select('zone_id, row_no, seat_no, venue_zones(zone_name, tier_name, row_counts)')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (ownSeat.error) return NextResponse.json({ error: ownSeat.error.message }, { status: 500 });
    if (!ownSeat.data) return NextResponse.json({ seat: null, nearby: [], message: '请先登记自己的座位' });

    const minRow = Math.max(1, ownSeat.data.row_no - 5);
    const maxRow = ownSeat.data.row_no + 5;
    const minNo = Math.max(1, ownSeat.data.seat_no - 10);
    const maxNo = ownSeat.data.seat_no + 10;

    const nearby = await supabase
      .from('seats')
      .select('row_no, seat_no, message, app_users(id, weibo_name, wechat_name, offline_group, fan_note)')
      .eq('event_id', eventId)
      .eq('zone_id', ownSeat.data.zone_id)
      .gte('row_no', minRow)
      .lte('row_no', maxRow)
      .gte('seat_no', minNo)
      .lte('seat_no', maxNo)
      .neq('user_id', user.id)
      .order('row_no', { ascending: true })
      .order('seat_no', { ascending: true });

    if (nearby.error) return NextResponse.json({ error: nearby.error.message }, { status: 500 });
    return NextResponse.json({ seat: ownSeat.data, nearby: nearby.data ?? [] });
  } catch (error) {
    return routeError(error);
  }
}
