import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';

export async function GET() {
  const eventId = await getActiveEventId();
  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from('proof_fields')
    .select('id, label, type, options, required, sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ fields: result.data });
}
