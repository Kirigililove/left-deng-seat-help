import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId, getZoneByName } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

export async function GET(_request: Request, context: { params: { zoneName: string } }) {
  try {
    await requireAdmin();
    const eventId = await getActiveEventId();
    const zoneName = decodeURIComponent(context.params.zoneName);
    const zone = await getZoneByName(eventId, zoneName);
    const supabase = createAdminSupabaseClient();
    const seats = await supabase
      .from('seats')
      .select('row_no, seat_no, message, app_users(id, account, weibo_name, wechat_name, offline_group, fan_note)')
      .eq('event_id', eventId)
      .eq('zone_id', zone.id)
      .order('row_no', { ascending: true })
      .order('seat_no', { ascending: true });
    if (seats.error) return NextResponse.json({ error: seats.error.message }, { status: 500 });
    return NextResponse.json({ zone, seats: seats.data });
  } catch (error) {
    return routeError(error);
  }
}
