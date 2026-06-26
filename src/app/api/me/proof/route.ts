import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveEventId } from '@/lib/supabase/events';
import { routeError } from '@/lib/api/errors';

type ProofAnswerInput = { fieldId: string; value?: string | string[]; fileUrl?: string };

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.status === 'approved') return NextResponse.json({ error: '已经审核通过，无需重复提交自证' }, { status: 400 });

    const body = await request.json().catch(() => null) as {
      weiboName?: string;
      wechatName?: string;
      offlineGroup?: '是' | '否';
      answers?: ProofAnswerInput[];
    } | null;

    const weiboName = body?.weiboName?.trim();
    const wechatName = body?.wechatName?.trim();
    const offlineGroup = body?.offlineGroup;
    const answers = body?.answers ?? [];
    if (!weiboName || !wechatName || !offlineGroup) return NextResponse.json({ error: '微博名、微信名、是否在线下群都要填' }, { status: 400 });

    const eventId = await getActiveEventId();
    const supabase = createAdminSupabaseClient();

    const fields = await supabase
      .from('proof_fields')
      .select('id, label, type, required')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });
    if (fields.error) return NextResponse.json({ error: fields.error.message }, { status: 500 });

    for (const field of fields.data ?? []) {
      if (!field.required) continue;
      const answer = answers.find((item) => item.fieldId === field.id);
      const hasValue = Array.isArray(answer?.value) ? answer.value.length > 0 : Boolean(String(answer?.value ?? '').trim());
      const hasFile = Boolean(answer?.fileUrl?.trim());
      if (!hasValue && !hasFile) return NextResponse.json({ error: '自证项还没填完：' + field.label }, { status: 400 });
    }

    await supabase.from('app_users').update({
      status: 'pending',
      weibo_name: weiboName,
      wechat_name: wechatName,
      offline_group: offlineGroup === '是',
      reject_reason: null
    }).eq('id', user.id);

    const submission = await supabase.from('proof_submissions').upsert({
      user_id: user.id,
      event_id: eventId,
      status: 'pending',
      reject_reason: null
    }, { onConflict: 'user_id,event_id' }).select('id').single();
    if (submission.error) return NextResponse.json({ error: submission.error.message }, { status: 500 });

    await supabase.from('proof_answers').delete().eq('submission_id', submission.data.id);
    if (answers.length) {
      const rows = answers.map((answer) => ({
        submission_id: submission.data.id,
        field_id: answer.fieldId,
        value_text: Array.isArray(answer.value) ? null : answer.value ?? null,
        value_json: Array.isArray(answer.value) ? answer.value : null,
        file_url: answer.fileUrl ?? null
      }));
      const inserted = await supabase.from('proof_answers').insert(rows);
      if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
