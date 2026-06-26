export type UserStatus = 'needs_proof' | 'pending' | 'approved' | 'rejected' | 'deactivated';
export type UserRole = 'user' | 'admin';
export type Seat = { tier: string; zone: string; row: number; no: number };
export type AppUser = { id: string; account: string; password: string; role: UserRole; status: UserStatus; weiboName: string; wechatName: string; offlineGroup: '是' | '否' | ''; rejectReason?: string; fanNote?: string; seat?: Seat | null };
export type ProofFieldType = 'image' | 'text' | 'radio' | 'checkbox';
export type ProofField = { id: string; label: string; type: ProofFieldType; options?: string[]; required: boolean };
export type ZoneConfig = { tier: string; zone: string; rowCounts: number[] };