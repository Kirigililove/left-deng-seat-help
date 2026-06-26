import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: '左邓粉丝 · 银河综艺馆 · 同担座位互助', description: '由左邓粉丝研发，仅限左邓粉丝使用。' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="zh-CN"><body>{children}</body></html>; }