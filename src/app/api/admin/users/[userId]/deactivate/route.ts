import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { routeError } from '@/lib/api/errors';

type RouteContext = { params: { userId: string } };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const supabase = createAdminSupabaseClient();
    const result = await supabase.from('app_users').update({ status: 'deactivated' }).eq('id', context.params.userId).eq('role', 'user');
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    await supabase.from('audit_logs').insert({ admin_id: admin.id, user_id: context.params.userId, action: 'deactivate' });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
