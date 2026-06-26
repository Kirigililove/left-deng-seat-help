import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId, getZoneByName, validateSeat } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

export async function PUT(request: Request, context: { params: { userId: string } }) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => null) as { zone?: string; row?: number; no?: number; message?: string } | null;
    const zoneName = body?.zone?.trim();
    const row = Number(body?.row);
    const no = Number(body?.no);
    if (!zoneName) return NextResponse.json({ error: '请选择区域' }, { status: 400 });

    const eventId = await getActiveEventId();
    const zone = await getZoneByName(eventId, zoneName);
    if (!validateSeat(zone.row_counts, row, no)) return NextResponse.json({ error: '这个座位不在当前区域配置内' }, { status: 400 });

    const supabase = createAdminSupabaseClient();
    const occupied = await supabase
      .from('seats')
      .select('id, user_id')
      .eq('event_id', eventId)
      .eq('zone_id', zone.id)
      .eq('row_no', row)
      .eq('seat_no', no)
      .maybeSingle();

    if (occupied.error) return NextResponse.json({ error: occupied.error.message }, { status: 500 });
    if (occupied.data && occupied.data.user_id !== context.params.userId) return NextResponse.json({ error: '这个座位已经有人登记' }, { status: 409 });

    const saved = await supabase.from('seats').upsert({
      event_id: eventId,
      user_id: context.params.userId,
      zone_id: zone.id,
      row_no: row,
      seat_no: no,
      message: body?.message?.trim() ?? ''
    }, { onConflict: 'event_id,user_id' }).select('id').single();

    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 500 });
    await supabase.from('audit_logs').insert({ admin_id: admin.id, user_id: context.params.userId, action: 'update_seat', reason: zoneName + '-' + row + '-' + no });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
