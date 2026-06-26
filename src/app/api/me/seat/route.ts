import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId, getZoneByName, validateSeat } from '@/lib/supabase/events';

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    if (user.status !== 'approved') return NextResponse.json({ error: '审核通过后才能登记座位' }, { status: 403 });

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
    if (occupied.data && occupied.data.user_id !== user.id) return NextResponse.json({ error: '这个座位已经有人登记，请重新选择' }, { status: 409 });

    const saved = await supabase.from('seats').upsert({
      event_id: eventId,
      user_id: user.id,
      zone_id: zone.id,
      row_no: row,
      seat_no: no,
      message: body?.message?.trim() ?? ''
    }, { onConflict: 'event_id,user_id' }).select('id').single();

    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ error: '请先登录' }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
