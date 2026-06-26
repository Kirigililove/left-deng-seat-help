'use client';

export type AuthMode = 'login' | 'register';

type Props = {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  account: string;
  setAccount: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  passwordAgain: string;
  setPasswordAgain: (value: string) => void;
  onLogin: () => void;
  onRegister: () => void;
};

export function AuthPanel(props: Props) {
  const isRegister = props.authMode === 'register';
  return (
    <section className="panel auth">
      <div className="head"><h3>{isRegister ? '注册证号' : '登录'}</h3></div>
      <div className="body table">
        <div className="tabs">
          <button className={!isRegister ? 'active' : ''} onClick={() => props.setAuthMode('login')}>登录</button>
          <button className={isRegister ? 'active' : ''} onClick={() => props.setAuthMode('register')}>注册证号</button>
        </div>
        <label className="field full">账号 / 证号<input value={props.account} onChange={(event) => props.setAccount(event.target.value)} /></label>
        <label className="field full">密码<input type="password" value={props.password} onChange={(event) => props.setPassword(event.target.value)} /></label>
        {isRegister ? <label className="field full">确认密码<input type="password" value={props.passwordAgain} onChange={(event) => props.setPasswordAgain(event.target.value)} /></label> : null}
        <button className="btn" onClick={isRegister ? props.onRegister : props.onLogin}>{isRegister ? '注册' : '登录'}</button>
        <p className="muted">如果遇到忘记密码，请先联系小管注销之前的账号，再注册新的。</p>
        <p className="muted">管理员测试账号：admin / admin123456。</p>
      </div>
    </section>
  );
}
