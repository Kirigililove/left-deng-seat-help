import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    if (user.status !== 'approved') return NextResponse.json({ error: '审核通过后才能保存留言' }, { status: 403 });
    const body = await request.json().catch(() => null) as { note?: string } | null;
    const note = (body?.note ?? '').trim().slice(0, 200);
    const supabase = createAdminSupabaseClient();
    const userResult = await supabase.from('app_users').update({ fan_note: note }).eq('id', user.id);
    if (userResult.error) return NextResponse.json({ error: userResult.error.message }, { status: 500 });

    const eventId = await getActiveEventId();
    await supabase.from('seats').update({ message: note }).eq('event_id', eventId).eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
