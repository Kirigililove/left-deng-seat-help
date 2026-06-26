import type { ProofField } from './types';

export type ProofValue = string | string[] | { name: string; url?: string; path?: string; type: 'image' };
export type ProofAnswers = Record<string, ProofValue>;

export function makeProofFieldId() {
  return 'pf_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function splitOptions(value?: string) {
  return (value ?? '').split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

export function proofFieldTypeLabel(type: ProofField['type']) {
  return { image: '图片上传', text: '填空', radio: '单选', checkbox: '多选' }[type];
}
