import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { routeError } from '@/lib/api/errors';

const BUCKET = 'proof-files';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null) as { path?: string } | null;
    const filePath = body?.path?.trim();
    if (!filePath) return NextResponse.json({ error: '缺少文件路径' }, { status: 400 });

    const supabase = createAdminSupabaseClient();
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 60 * 10);
    if (signed.error) return NextResponse.json({ error: signed.error.message }, { status: 500 });
    return NextResponse.json({ url: signed.data.signedUrl });
  } catch (error) {
    return routeError(error);
  }
}
