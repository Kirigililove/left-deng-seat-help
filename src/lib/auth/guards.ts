import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function getSessionUser() {
  const token = cookies().get('ld_session')?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) return null;

  const supabase = createAdminSupabaseClient();
  const result = await supabase
    .from('app_users')
    .select('id, account, role, status')
    .eq('id', session.userId)
    .maybeSingle();

  if (result.error || !result.data || result.data.status === 'deactivated') return null;
  return { ...result.data, role: result.data.role === 'admin' ? 'admin' as const : 'user' as const };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw new Error('FORBIDDEN');
  return user;
}
