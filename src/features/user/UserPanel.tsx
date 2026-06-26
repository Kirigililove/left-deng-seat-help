'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AppUser, Seat, ZoneConfig } from '@/lib/types';
import { rowSeatCount, seatKey } from '@/lib/visibility';
import { EmptyState, Panel, Tabs } from '@/components/ui';
import { tiers } from '@/lib/mock-data';
import { fetchNearbyUsers, saveNoteToApi } from '@/lib/api/client';

type UserTab = 'near' | 'seat';

type Props = {
  user: AppUser;
  users: AppUser[];
  zoneConfigs: ZoneConfig[];
  onSaveSeat: (seat: Seat) => void;
  onSaveNote: (note: string) => void;
};

function defaultSeat(configs: ZoneConfig[]): Seat {
  const first = configs[0];
  return { tier: first.tier, zone: first.zone, row: 1, no: 1 };
}

export function UserPanel({ user, users, zoneConfigs, onSaveSeat, onSaveNote }: Props) {
  const [tab, setTab] = useState<UserTab>('near');
  const [draft, setDraft] = useState<Seat>(user.seat ?? defaultSeat(zoneConfigs));
  const [note, setNote] = useState(user.fanNote ?? '');
  const [nearby, setNearby] = useState<AppUser[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    if (!user.seat) return;
    setNearbyLoading(true);
    fetchNearbyUsers()
      .then((data) => setNearby(data.nearby))
      .catch((error) => alert(error instanceof Error ? error.message : '加载附近同担失败'))
      .finally(() => setNearbyLoading(false));
  }, [user.seat?.zone, user.seat?.row, user.seat?.no]);

  async function saveNote() {
    try {
      await saveNoteToApi(note);
      onSaveNote(note);
      alert('留言已保存');
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存留言失败');
    }
  }

  const windowUsers = useMemo(() => [user, ...nearby], [user, nearby]);

  return (
    <div className="grid">
      <Panel title="附近座位窗口" hint="只显示前后 5 排、左右 10 号以内">
        <NearbySeatWindow viewer={user} users={windowUsers} configs={zoneConfigs} />
      </Panel>
      <Panel title="我的互助信息" hint="同区附近公开联系名">
        <Tabs<UserTab> value={tab} onChange={setTab} options={[{ value: 'near', label: '附近同担' }, { value: 'seat', label: '修改座位' }]} />
        {tab === 'near' ? <div className="table"><div className="status"><strong>{user.weiboName}</strong><p>{user.seat ? '我的座位：' + seatKey(user.seat) : '还没有登记座位'}</p><label className="field">我的附近留言<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label><button className="btn secondary" onClick={saveNote}>保存留言</button></div>{nearbyLoading ? <div className="status">正在加载附近同担...</div> : nearby.length ? nearby.map((item) => <PersonRow key={item.id} user={item} />) : <div className="status">目前暂无</div>}</div> : <div className="table"><SeatEditor configs={zoneConfigs} value={draft} onChange={setDraft} /><button className="btn" onClick={() => onSaveSeat(draft)}>保存座位</button></div>}
      </Panel>
    </div>
  );
}

function NearbySeatWindow({ viewer, users, configs }: { viewer: AppUser; users: AppUser[]; configs: ZoneConfig[] }) {
  if (!viewer.seat) return <EmptyState title="还没有登记座位" text="先登记座位后，才会显示附近同担。" />;
  const startRow = Math.max(1, viewer.seat.row - 5);
  const endRow = Math.min(configs.find((item) => item.zone === viewer.seat?.zone)?.rowCounts.length ?? 0, viewer.seat.row + 5);
  const startNo = Math.max(1, viewer.seat.no - 10);
  const endNo = Math.min(rowSeatCount(configs, viewer.seat.zone, viewer.seat.row), viewer.seat.no + 10);
  return <div className="table">{Array.from({ length: endRow - startRow + 1 }, (_, rowIndex) => { const row = startRow + rowIndex; return <div key={row}><p className="muted">{row}排</p><div className="seats">{Array.from({ length: endNo - startNo + 1 }, (_, noIndex) => { const no = startNo + noIndex; const owner = users.find((item) => item.status === 'approved' && item.seat?.zone === viewer.seat?.zone && item.seat.row === row && item.seat.no === no); return <div key={no} className={'seat ' + (owner?.id === viewer.id ? 'mine' : owner ? 'taken' : '')} title={row + '排' + no + '号'} />; })}</div></div>; })}</div>;
}

function SeatEditor({ configs, value, onChange }: { configs: ZoneConfig[]; value: Seat; onChange: (seat: Seat) => void }) {
  const zones = configs.filter((item) => item.tier === value.tier);
  const rowCount = configs.find((item) => item.zone === value.zone)?.rowCounts.length ?? 0;
  const seatCount = rowSeatCount(configs, value.zone, value.row);
  return <div className="form"><label className="field">楼层<select value={value.tier} onChange={(event) => { const tier = event.target.value; const zone = configs.find((item) => item.tier === tier)?.zone ?? value.zone; onChange({ tier, zone, row: 1, no: 1 }); }}>{tiers.map((tier) => <option key={tier}>{tier}</option>)}</select></label><label className="field">区<select value={value.zone} onChange={(event) => onChange({ ...value, zone: event.target.value, row: 1, no: 1 })}>{zones.map((zone) => <option key={zone.zone}>{zone.zone}</option>)}</select></label><label className="field">排<select value={value.row} onChange={(event) => onChange({ ...value, row: Number(event.target.value), no: 1 })}>{Array.from({ length: rowCount }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}排</option>)}</select></label><label className="field">号<select value={value.no} onChange={(event) => onChange({ ...value, no: Number(event.target.value) })}>{Array.from({ length: seatCount }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, '0')}号</option>)}</select></label></div>;
}

function PersonRow({ user }: { user: AppUser }) {
  return <div className="row"><div><strong>{user.weiboName}</strong><small>{user.seat ? seatKey(user.seat) : ''}</small><p>{user.fanNote || '目前暂无留言'}</p></div><small>微信名：{user.wechatName}<br />线下群：{user.offlineGroup}</small><span className="muted">附近</span></div>;
}
