import type { AppUser, ProofField, ZoneConfig } from './types';
export const eventName = '左邓粉丝 · 银河综艺馆 · 同担座位互助';
export const eventSubtitle = '由左邓粉丝研发，仅限左邓粉丝使用。';
export const tiers = ['一层看台', '二层看台', '三层看台'];
function range(start: number, end: number) { return Array.from({ length: end - start + 1 }, (_, i) => String(start + i) + '区'); }
function rows(zone: string) { const n = Number.parseInt(zone, 10); const r = n >= 300 ? 18 : n >= 200 ? 14 : 10; const s = n >= 300 ? 28 : n >= 200 ? 22 : 16; return Array.from({ length: r }, () => s); }
export const initialZoneConfigs: ZoneConfig[] = [
  ...range(101,115).map((zone) => ({ tier: '一层看台', zone, rowCounts: zone === '101区' ? [14,14,16,16,16,16,16,16,16,16] : rows(zone) })),
  ...range(201,219).map((zone) => ({ tier: '二层看台', zone, rowCounts: rows(zone) })),
  ...range(301,317).map((zone) => ({ tier: '三层看台', zone, rowCounts: zone === '310区' ? Array.from({ length: 18 }, (_, i) => i === 0 ? 28 : 26) : rows(zone) }))
];
export const initialProofFields: ProofField[] = [
  { id: 'weibo_home', label: '微博主页自证截图', type: 'image', required: true },
  { id: 'official_merch', label: '官周自证截图', type: 'image', required: true },
  { id: 'data_group', label: '数据组周自证截图', type: 'image', required: true }
];
export const initialUsers: AppUser[] = [
  { id: 'u1', account: 'mint', password: '123456', role: 'user', status: 'approved', weiboName: '海盐薄荷', wechatName: 'mint-safe', offlineGroup: '是', fanNote: '想加附近同担好友，散场可以一起走。', seat: { tier: '一层看台', zone: '101区', row: 3, no: 6 } },
  { id: 'u2', account: 'soda', password: '123456', role: 'user', status: 'approved', weiboName: '银河汽水', wechatName: 'soda-0721', offlineGroup: '否', fanNote: '可以加微信，主要想互相照应一下。', seat: { tier: '一层看台', zone: '101区', row: 4, no: 12 } },
  { id: 'wait', account: 'wait', password: '123456', role: 'user', status: 'pending', weiboName: '待审核用户', wechatName: 'wait-26', offlineGroup: '是', seat: null },
  { id: 'admin', account: 'admin', password: 'admin', role: 'admin', status: 'approved', weiboName: '管理员', wechatName: 'admin', offlineGroup: '是', seat: null }
];