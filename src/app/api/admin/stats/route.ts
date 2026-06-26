import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

export async function GET() {
  try {
    await requireAdmin();
    const eventId = await getActiveEventId();
    const supabase = createAdminSupabaseClient();

    const users = await supabase.from('app_users').select('status, role').eq('role', 'user');
    if (users.error) return NextResponse.json({ error: users.error.message }, { status: 500 });

    const seats = await supabase
      .from('seats')
      .select('venue_zones(zone_name)')
      .eq('event_id', eventId);
    if (seats.error) return NextResponse.json({ error: seats.error.message }, { status: 500 });

    const byZone: Record<string, number> = {};
    for (const seat of seats.data ?? []) {
      const zone = Array.isArray(seat.venue_zones) ? seat.venue_zones[0]?.zone_name : seat.venue_zones?.zone_name;
      if (zone) byZone[zone] = (byZone[zone] ?? 0) + 1;
    }

    return NextResponse.json({
      totalUsers: users.data?.length ?? 0,
      approved: users.data?.filter((user) => user.status === 'approved').length ?? 0,
      pending: users.data?.filter((user) => user.status === 'pending').length ?? 0,
      rejected: users.data?.filter((user) => user.status === 'rejected').length ?? 0,
      deactivated: users.data?.filter((user) => user.status === 'deactivated').length ?? 0,
      seated: seats.data?.length ?? 0,
      byZone
    });
  } catch (error) {
    return routeError(error);
  }
}
