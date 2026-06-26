import type { AppUser, Seat } from './types';
import { nearbyUsers } from './visibility';

export function canAccessApp(user: AppUser | null) {
  return Boolean(user && user.status === 'approved');
}

export function canAccessAdmin(user: AppUser | null) {
  return Boolean(user && user.role === 'admin' && user.status === 'approved');
}

export function canViewProof(viewer: AppUser | null) {
  return canAccessAdmin(viewer);
}

export function visibleNearbyUsers(allUsers: AppUser[], viewer: AppUser) {
  if (!canAccessApp(viewer) || viewer.role !== 'user') return [];
  return nearbyUsers(allUsers, viewer);
}

export function canSeeSeatOwner(viewer: AppUser, targetSeat: Seat, owner: AppUser) {
  if (viewer.role === 'admin') return true;
  if (!viewer.seat || !owner.seat) return false;
  if (viewer.seat.zone !== targetSeat.zone) return false;
  return Math.abs(viewer.seat.row - targetSeat.row) <= 5 && Math.abs(viewer.seat.no - targetSeat.no) <= 10;
}