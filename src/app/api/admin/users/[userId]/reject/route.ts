import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { routeError } from '@/lib/api/errors';

type RouteContext = { params: { userId: string } };

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => null) as { reason?: string } | null;
    const reason = body?.reason?.trim();
    if (!reason) return NextResponse.json({ error: '请输入打回原因' }, { status: 400 });

    const supabase = createAdminSupabaseClient();
    const result = await supabase.from('app_users').update({ status: 'rejected', reject_reason: reason }).eq('id', context.params.userId).eq('role', 'user');
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    await supabase.from('audit_logs').insert({ admin_id: admin.id, user_id: context.params.userId, action: 'reject', reason });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
