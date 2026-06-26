import { initialProofFields, initialUsers, initialZoneConfigs } from './mock-data';
import type { AppUser, ProofField, Seat, ZoneConfig } from './types';
import { isSeatTaken, isSeatValid } from './visibility';

export type MockStore = {
  users: AppUser[];
  proofFields: ProofField[];
  zoneConfigs: ZoneConfig[];
};

export function createMockStore(): MockStore {
  return {
    users: structuredClone(initialUsers),
    proofFields: structuredClone(initialProofFields),
    zoneConfigs: structuredClone(initialZoneConfigs)
  };
}

export function registerUser(store: MockStore, account: string, password: string) {
  if (store.users.some((user) => user.account === account)) {
    throw new Error('这个用户名已经被占用，请重新想一个');
  }
  const user: AppUser = {
    id: 'u_' + Date.now(),
    account,
    password,
    role: 'user',
    status: 'needs_proof',
    weiboName: '',
    wechatName: '',
    offlineGroup: '',
    fanNote: '',
    seat: null
  };
  store.users.push(user);
  return user;
}

export function updateSeat(store: MockStore, userId: string, seat: Seat) {
  if (!isSeatValid(store.zoneConfigs, seat)) throw new Error('这个座位不在当前区域配置内');
  if (isSeatTaken(store.users, seat, userId)) throw new Error('这个座位已经有人登记，请重新选择');
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error('用户不存在');
  user.seat = seat;
  return user;
}