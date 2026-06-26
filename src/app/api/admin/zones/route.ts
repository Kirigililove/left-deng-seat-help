import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

function parseRows(value: unknown) {
  if (!Array.isArray(value)) return null;
  const rows = value.map(Number);
  if (!rows.length || rows.some((item) => !Number.isInteger(item) || item < 1 || item > 200)) return null;
  return rows;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null) as { tier?: string; zone?: string; rowCounts?: number[] } | null;
    const tier = body?.tier?.trim();
    const zone = body?.zone?.trim();
    const rowCounts = parseRows(body?.rowCounts);
    if (!tier || !zone || !rowCounts) return NextResponse.json({ error: '请填写完整区域配置' }, { status: 400 });
    const eventId = await getActiveEventId();
    const supabase = createAdminSupabaseClient();
    const result = await supabase.from('venue_zones').insert({ event_id: eventId, tier_name: tier, zone_name: zone, row_counts: rowCounts, sort_order: Number(zone.match(/\d+/)?.[0] ?? 9999) }).select('id').single();
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: result.data.id });
  } catch (error) {
    return routeError(error);
  }
}
