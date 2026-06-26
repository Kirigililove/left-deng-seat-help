import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { routeError } from '@/lib/api/errors';

const BUCKET = 'proof-files';
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.status === 'approved') return NextResponse.json({ error: '已经审核通过，无需重复上传自证' }, { status: 400 });

    const form = await request.formData();
    const file = form.get('file');
    const fieldId = String(form.get('fieldId') ?? '').trim();
    if (!fieldId) return NextResponse.json({ error: '缺少自证项' }, { status: 400 });
    if (typeof file !== 'object' || file === null || !('name' in file) || !('type' in file) || !('size' in file)) return NextResponse.json({ error: '请选择截图文件' }, { status: 400 });
    const uploadFile = file as File;
    if (!uploadFile.name) return NextResponse.json({ error: '请选择截图文件' }, { status: 400 });
    if (!ALLOWED.has(uploadFile.type)) return NextResponse.json({ error: '只支持 png、jpg、webp、gif 图片' }, { status: 400 });
    if (uploadFile.size > MAX_SIZE) return NextResponse.json({ error: '图片不能超过 10MB' }, { status: 400 });

    const ext = uploadFile.name.split('.').pop()?.toLowerCase() || 'png';
    const objectPath = user.id + '/' + fieldId + '-' + Date.now() + '.' + ext;
    const supabase = createAdminSupabaseClient();
    const uploaded = await supabase.storage.from(BUCKET).upload(objectPath, uploadFile, {
      contentType: uploadFile.type,
      upsert: false
    });
    if (uploaded.error) return NextResponse.json({ error: uploaded.error.message }, { status: 500 });
    return NextResponse.json({ path: uploaded.data.path, name: uploadFile.name });
  } catch (error) {
    return routeError(error);
  }
}
