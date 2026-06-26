import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { routeError } from '@/lib/api/errors';

export async function DELETE(_request: Request, context: { params: { fieldId: string } }) {
  try {
    await requireAdmin();
    const supabase = createAdminSupabaseClient();
    const result = await supabase.from('proof_fields').delete().eq('id', context.params.fieldId);
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
