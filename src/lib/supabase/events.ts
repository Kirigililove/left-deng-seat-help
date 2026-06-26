import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function getActiveEventId() {
  const supabase = createAdminSupabaseClient();
  const result = await supabase.from('events').select('id').eq('status', 'active').order('created_at', { ascending: false }).limit(1).single();
  if (result.error) throw new Error(result.error.message);
  return result.data.id as string;
}

export async function getZoneByName(eventId: string, zoneName: string) {
  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from('venue_zones')
    .select('id, zone_name, tier_name, row_counts')
    .eq('event_id', eventId)
    .eq('zone_name', zoneName)
    .single();
  if (result.error) throw new Error(result.error.message);
  return result.data as { id: string; zone_name: string; tier_name: string; row_counts: number[] };
}

export function validateSeat(rowCounts: number[], row: number, no: number) {
  const max = rowCounts[row - 1];
  return Number.isInteger(row) && Number.isInteger(no) && row > 0 && no > 0 && typeof max === 'number' && no <= max;
}
