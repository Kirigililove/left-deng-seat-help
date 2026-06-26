import { NextResponse } from 'next/server';

export function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : 'UNKNOWN';
  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: '请先登录' }, { status: 401 });
  if (message === 'FORBIDDEN') return NextResponse.json({ error: '没有管理员权限' }, { status: 403 });
  return NextResponse.json({ error: message }, { status: 500 });
}
