'use client';

import { useEffect, useState } from 'react';
import { AuthPanel, type AuthMode } from '@/features/auth/AuthPanel';
import { ProofPanel } from '@/features/proof/ProofPanel';
import { UserPanel } from '@/features/user/UserPanel';
import { AdminPanel } from '@/features/admin/AdminPanel';
import { EmptyState } from '@/components/ui';
import { eventName, eventSubtitle } from '@/lib/mock-data';
import type { AppUser, ProofField, Seat, ZoneConfig } from '@/lib/types';
import type { ProofAnswers } from '@/lib/proof';
import { fetchAdminUsers, fetchProofFields, fetchZones, getMe, loginAccount, logoutAccount, registerAccount, saveSeatToApi, submitProofToApi } from '@/lib/api/client';

type ProofSubmission = { userId: string; answers: ProofAnswers };

export default function HomePage() {
  const [current, setCurrent] = useState<AppUser | null>(null);
  const [proofFields, setProofFields] = useState<ProofField[]>([]);
  const [zoneConfigs, setZoneConfigs] = useState<ZoneConfig[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [submissions, setSubmissions] = useState<ProofSubmission[]>([]);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function boot() {
      try {
        const [fields, zones] = await Promise.all([fetchProofFields(), fetchZones()]);
        setProofFields(fields);
        setZoneConfigs(zones);
        const me = await getMe().catch(() => null);
        setCurrent(me);
      } catch (error) {
        alert(error instanceof Error ? error.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, []);

  useEffect(() => {
    if (current?.role !== 'admin') return;
    fetchAdminUsers().then((data) => { setUsers(data.users); setSubmissions(data.submissions); }).catch((error) => alert(error instanceof Error ? error.message : '加载用户列表失败'));
  }, [current?.role]);

  function patchCurrent(patch: Partial<AppUser>) {
    setCurrent((prev) => prev ? { ...prev, ...patch } : prev);
  }

  async function login() {
    try {
      const user = await loginAccount(account, password);
      setCurrent(user);
      if (user.role === 'admin') fetchAdminUsers().then((data) => { setUsers(data.users); setSubmissions(data.submissions); }).catch(() => null);
    } catch (error) {
      alert(error instanceof Error ? error.message : '登录失败');
    }
  }

  async function register() {
    const name = account.trim();
    if (!name || !password) {
      alert('账号和密码都要填');
      return;
    }
    if (password !== passwordAgain) {
      alert('两次密码不一致');
      return;
    }
    try {
      const user = await registerAccount(name, password);
      setCurrent(user);
      alert('注册成功\n\n你的账号是：' + name + '\n密码是：' + password + '\n\n请截图避免遗忘。');
    } catch (error) {
      alert(error instanceof Error ? error.message : '注册失败');
    }
  }

  async function logout() {
    await logoutAccount().catch(() => null);
    setCurrent(null);
  }

  async function submitProof(profile: Pick<AppUser, 'weiboName' | 'wechatName' | 'offlineGroup'>, answers: ProofAnswers) {
    if (!current) return;
    try {
      if (profile.offlineGroup !== '是' && profile.offlineGroup !== '否') {
        alert('请选择是否在线下群');
        return;
      }
      await submitProofToApi({ weiboName: profile.weiboName, wechatName: profile.wechatName, offlineGroup: profile.offlineGroup }, answers);
      patchCurrent({ ...profile, status: 'pending', rejectReason: '' });
      alert('已提交，等待管理员审核');
    } catch (error) {
      alert(error instanceof Error ? error.message : '提交失败');
    }
  }

  async function saveSeat(seat: Seat) {
    if (!current) return;
    try {
      await saveSeatToApi(seat, current.fanNote ?? '');
      patchCurrent({ seat });
      alert('座位已保存');
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存失败');
    }
  }

  if (loading) {
    return <div className="app"><main><section className="panel auth"><div className="body"><EmptyState title="正在加载" text="正在连接数据库。" /></div></section></main></div>;
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <div className="logo">CP</div>
          <div>
            <h1>同担座位互助</h1>
            <p className="muted">正式工程开发版</p>
          </div>
        </div>
        <p className="muted">未审核不看图，普通用户只看附近，管理员才看全局。</p>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <h2>{eventName}</h2>
            <p className="muted">{eventSubtitle}</p>
          </div>
          {current ? <button className="btn secondary" onClick={logout}>退出</button> : null}
        </header>

        {!current ? (
          <AuthPanel authMode={authMode} setAuthMode={setAuthMode} account={account} setAccount={setAccount} password={password} setPassword={setPassword} passwordAgain={passwordAgain} setPasswordAgain={setPasswordAgain} onLogin={login} onRegister={register} />
        ) : current.status === 'needs_proof' || current.status === 'rejected' ? (
          <ProofPanel user={current} fields={proofFields} onSubmit={submitProof} />
        ) : current.status === 'pending' ? (
          <section className="panel auth"><div className="body"><EmptyState title="等待管理员审核" text="审核通过前不会显示座位图、人数、红点或同担信息。" /></div></section>
        ) : current.status === 'deactivated' ? (
          <section className="panel auth"><div className="body"><EmptyState title="账号已注销" text="这个账号已被管理员注销，不能继续使用座位互助。" /></div></section>
        ) : current.role === 'admin' ? (
          <AdminPanel users={users} setUsers={setUsers} submissions={submissions} proofFields={proofFields} setProofFields={setProofFields} zoneConfigs={zoneConfigs} setZoneConfigs={setZoneConfigs} />
        ) : (
          <UserPanel user={current} users={users} zoneConfigs={zoneConfigs} onSaveSeat={saveSeat} onSaveNote={(note) => patchCurrent({ fanNote: note })} />
        )}
      </main>
    </div>
  );
}
