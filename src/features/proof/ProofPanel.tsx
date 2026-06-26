'use client';

import { useState, type FormEvent } from 'react';
import type { AppUser, ProofField } from '@/lib/types';
import type { ProofAnswers } from '@/lib/proof';
import { uploadProofFile } from '@/lib/api/client';

type Props = {
  user: AppUser;
  fields: ProofField[];
  onSubmit: (profile: Pick<AppUser, 'weiboName' | 'wechatName' | 'offlineGroup'>, answers: ProofAnswers) => Promise<void> | void;
};

export function ProofPanel({ user, fields, onSubmit }: Props) {
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const weiboName = String(formData.get('weiboName') ?? '').trim();
      const wechatName = String(formData.get('wechatName') ?? '').trim();
      const offlineGroup = String(formData.get('offlineGroup') ?? '') as AppUser['offlineGroup'];
      if (!weiboName || !wechatName || !offlineGroup) {
        alert('必填项还没填完');
        return;
      }
      const answers: ProofAnswers = {};
      for (const field of fields) {
        if (field.type === 'image') {
          const file = formData.get(field.id);
          if (!(file instanceof File) || !file.name) {
            alert('自证项还没填完：' + field.label);
            return;
          }
          const uploaded = await uploadProofFile(field.id, file);
          answers[field.id] = { name: uploaded.name, path: uploaded.path, type: 'image' };
        } else if (field.type === 'checkbox') {
          const values = formData.getAll(field.id).map(String).filter(Boolean);
          if (!values.length) {
            alert('自证项还没填完：' + field.label);
            return;
          }
          answers[field.id] = values;
        } else {
          const value = String(formData.get(field.id) ?? '').trim();
          if (!value) {
            alert('自证项还没填完：' + field.label);
            return;
          }
          answers[field.id] = value;
        }
      }
      await onSubmit({ weiboName, wechatName, offlineGroup }, answers);
    } catch (error) {
      alert(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel auth">
      <div className="head"><h3>上传自证</h3></div>
      <div className="body">
        <form className="form" onSubmit={submit}>
          {user.status === 'rejected' && user.rejectReason ? <div className="status full"><strong>打回原因</strong><p>{user.rejectReason}</p></div> : null}
          <label className="field">微博名<input name="weiboName" defaultValue={user.weiboName} required /></label>
          <label className="field">微信名<input name="wechatName" defaultValue={user.wechatName} required /></label>
          <label className="field full">是否在线下群<select name="offlineGroup" defaultValue={user.offlineGroup} required><option value="">请选择</option><option>是</option><option>否</option></select></label>
          {fields.map((field) => <ProofInput key={field.id} field={field} />)}
          <div className="full"><button className="btn" disabled={submitting}>{submitting ? '提交中...' : '提交审核'}</button></div>
        </form>
      </div>
    </section>
  );
}

function ProofInput({ field }: { field: ProofField }) {
  if (field.type === 'image') return <label className="field full">{field.label}<input name={field.id} type="file" accept="image/*" required /></label>;
  if (field.type === 'text') return <label className="field full">{field.label}<input name={field.id} required /></label>;
  if (field.type === 'radio') return <label className="field full">{field.label}<select name={field.id} required><option value="">请选择</option>{field.options?.map((item) => <option key={item}>{item}</option>)}</select></label>;
  return <div className="field full"><span>{field.label}</span><div>{field.options?.map((item) => <label key={item} className="check"><input name={field.id} type="checkbox" value={item} /> {item}</label>)}</div></div>;
}
