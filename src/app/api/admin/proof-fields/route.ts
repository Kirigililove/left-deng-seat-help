import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null) as { label?: string; type?: string; options?: string[]; required?: boolean } | null;
    const label = body?.label?.trim();
    const type = body?.type;
    if (!label) return NextResponse.json({ error: '请填写自证项名称' }, { status: 400 });
    if (!['image', 'text', 'radio', 'checkbox'].includes(type ?? '')) return NextResponse.json({ error: '自证类型不正确' }, { status: 400 });

    const eventId = await getActiveEventId();
    const supabase = createAdminSupabaseClient();
    const maxOrder = await supabase.from('proof_fields').select('sort_order').eq('event_id', eventId).order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const sortOrder = ((maxOrder.data?.sort_order as number | undefined) ?? 0) + 1;
    const result = await supabase.from('proof_fields').insert({
      event_id: eventId,
      label,
      type,
      options: body?.options ?? null,
      required: body?.required ?? true,
      sort_order: sortOrder
    }).select('id').single();
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: result.data.id });
  } catch (error) {
    return routeError(error);
  }
}
