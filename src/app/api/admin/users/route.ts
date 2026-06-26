import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

type SeatWithZone = { user_id: string; row_no: number; seat_no: number; venue_zones?: { tier_name: string; zone_name: string } | { tier_name: string; zone_name: string }[] | null };
type ProofAnswerRow = { field_id: string; value_text?: string | null; value_json?: unknown; file_url?: string | null };
type ProofSubmissionRow = { user_id: string; proof_answers?: ProofAnswerRow[] | null };


const BUCKET = 'proof-files';

export async function GET() {
  try {
    await requireAdmin();
    const eventId = await getActiveEventId();
    const supabase = createAdminSupabaseClient();
    const users = await supabase
      .from('app_users')
      .select('id, account, role, status, weibo_name, wechat_name, offline_group, reject_reason, fan_note')
      .eq('role', 'user')
      .neq('status', 'deactivated')
      .order('created_at', { ascending: false });
    if (users.error) return NextResponse.json({ error: users.error.message }, { status: 500 });

    const seats = await supabase
      .from('seats')
      .select('user_id, row_no, seat_no, venue_zones(tier_name, zone_name)')
      .eq('event_id', eventId);
    if (seats.error) return NextResponse.json({ error: seats.error.message }, { status: 500 });

    const submissions = await supabase
      .from('proof_submissions')
      .select('id, user_id, proof_answers(field_id, value_text, value_json, file_url)')
      .eq('event_id', eventId);
    if (submissions.error) return NextResponse.json({ error: submissions.error.message }, { status: 500 });

    const seatByUser = new Map<string, { tier: string; zone: string; row: number; no: number }>();
    for (const rawSeat of seats.data ?? []) {
      const seat = rawSeat as SeatWithZone;
      const zone = Array.isArray(seat.venue_zones) ? seat.venue_zones[0] : seat.venue_zones;
      if (zone) seatByUser.set(seat.user_id, { tier: zone.tier_name, zone: zone.zone_name, row: seat.row_no, no: seat.seat_no });
    }

    const mappedSubmissions = [];
    for (const rawSubmission of submissions.data ?? []) {
      const submission = rawSubmission as ProofSubmissionRow;
      const answers: Record<string, string | string[] | { name: string; url: string; type: 'image' }> = {};
      for (const answer of submission.proof_answers ?? []) {
        if (answer.file_url) {
          const signed = await supabase.storage.from(BUCKET).createSignedUrl(answer.file_url, 60 * 10);
          answers[answer.field_id] = { name: '自证截图', url: signed.data?.signedUrl ?? '', type: 'image' };
        } else if (answer.value_json) {
          answers[answer.field_id] = Array.isArray(answer.value_json) ? answer.value_json.map(String) : [];
        } else {
          answers[answer.field_id] = answer.value_text ?? '';
        }
      }
      mappedSubmissions.push({ userId: submission.user_id, answers });
    }

    return NextResponse.json({
      users: (users.data ?? []).map((user) => ({ ...user, seat: seatByUser.get(user.id) ?? null })),
      submissions: mappedSubmissions
    });
  } catch (error) {
    return routeError(error);
  }
}
