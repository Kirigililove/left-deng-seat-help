import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { routeError } from '@/lib/api/errors';

export async function POST(_request: Request, context: { params: { userId: string } }) {
  try {
    const admin = await requireAdmin();
    const supabase = createAdminSupabaseClient();
    const result = await supabase.from('app_users').update({ status: 'approved', reject_reason: null }).eq('id', context.params.userId).eq('role', 'user');
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    await supabase.from('audit_logs').insert({ admin_id: admin.id, user_id: context.params.userId, action: 'approve' });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
