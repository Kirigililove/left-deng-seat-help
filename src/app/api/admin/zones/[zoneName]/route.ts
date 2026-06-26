import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId, getZoneByName } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

function parseRows(value: unknown) {
  if (!Array.isArray(value)) return null;
  const rows = value.map(Number);
  if (!rows.length || rows.some((item) => !Number.isInteger(item) || item < 1 || item > 200)) return null;
  return rows;
}

type RouteContext = { params: { zoneName: string } };

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null) as { tier?: string; zone?: string; rowCounts?: number[] } | null;
    const tier = body?.tier?.trim();
    const zone = body?.zone?.trim();
    const rowCounts = parseRows(body?.rowCounts);
    if (!tier || !zone || !rowCounts) return NextResponse.json({ error: '请填写完整区域配置' }, { status: 400 });
    const eventId = await getActiveEventId();
    const oldZone = await getZoneByName(eventId, decodeURIComponent(context.params.zoneName));
    const supabase = createAdminSupabaseClient();
    const result = await supabase.from('venue_zones').update({ tier_name: tier, zone_name: zone, row_counts: rowCounts, sort_order: Number(zone.match(/\d+/)?.[0] ?? 9999) }).eq('id', oldZone.id);
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const eventId = await getActiveEventId();
    const zone = await getZoneByName(eventId, decodeURIComponent(context.params.zoneName));
    const supabase = createAdminSupabaseClient();
    const existing = await supabase.from('seats').select('id').eq('zone_id', zone.id).limit(1).maybeSingle();
    if (existing.data) return NextResponse.json({ error: '这个区域已经有人登记，不能直接删除' }, { status: 409 });
    const result = await supabase.from('venue_zones').delete().eq('id', zone.id);
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
