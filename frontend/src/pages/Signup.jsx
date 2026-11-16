import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { ERROR } from '../api/errors.js';
import { useAuth } from '../auth.jsx';
import { toLocalDateString } from '../lib/datetime.js';

// 백엔드 POST /api/auth/signup 검증 규칙 (별빛시네마 백엔드 API 문서)
const RULES = {
  login_id: { re: /^[A-Za-z0-9_]{4,20}$/, msg: '아이디는 영문, 숫자, _ 4~20자로 입력해 주세요.' },
  phone: { re: /^010-?\d{4}-?\d{4}$/, msg: '전화번호는 01012345678 또는 010-1234-5678 형식으로 입력해 주세요.' },
};

const EMPTY = { login_id: '', password: '', password2: '', name: '', phone: '', birth_date: '' };

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

function validate(f) {
  const errors = {};
  if (!RULES.login_id.re.test(f.login_id.trim())) errors.login_id = RULES.login_id.msg;
  if (f.password.length < 8 || f.password.length > 64) errors.password = '비밀번호는 8~64자로 입력해 주세요.';
  if (f.password2 !== f.password) errors.password2 = '비밀번호가 서로 다릅니다.';
  if (!f.name.trim()) errors.name = '이름을 입력해 주세요.';
  if (!RULES.phone.re.test(f.phone.trim())) errors.phone = RULES.phone.msg;
  if (!f.birth_date) errors.birth_date = '생년월일을 입력해 주세요.';
  else if (f.birth_date > yesterday()) errors.birth_date = '생년월일은 오늘 이전 날짜여야 합니다.';
  return errors;
}

// 서버 409 응답을 해당 입력칸 옆에 보여 준다
const FIELD_OF_CODE = {
  [ERROR.DUPLICATE_LOGIN_ID]: 'login_id',
  [ERROR.DUPLICATE_PHONE]: 'phone',
};

export default function Signup() {
  const { member } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (member) return <Navigate to="/movies" replace />;

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const { password2, ...body } = form;
      await api.signup({ ...body, login_id: body.login_id.trim(), name: body.name.trim(), phone: body.phone.trim() });
      navigate('/login', { replace: true, state: { signedUp: body.login_id.trim() } });
    } catch (err) {
      const field = FIELD_OF_CODE[err.code];
      if (field) setErrors({ [field]: err.message });
      else setServerError(err.message);
      setBusy(false);
    }
  }

  const field = (key, label, props = {}) => (
    <label className="field">
      <span>{label}</span>
      <input
        value={form[key]}
        onChange={set(key)}
        aria-invalid={errors[key] ? 'true' : undefined}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        required
        {...props}
      />
      {errors[key] && (
        <small id={`${key}-error`} className="field-error">
          {errors[key]}
        </small>
      )}
    </label>
  );

  return (
    <div className="login">
      <form className="login-form" onSubmit={onSubmit} noValidate>
        <h1 className="login-title">회원가입</h1>
        {field('login_id', '아이디', { autoComplete: 'username', placeholder: '영문, 숫자, _ 4~20자' })}
        {field('password', '비밀번호', { type: 'password', autoComplete: 'new-password', placeholder: '8~64자' })}
        {field('password2', '비밀번호 확인', { type: 'password', autoComplete: 'new-password' })}
        {field('name', '이름', { autoComplete: 'name' })}
        {field('phone', '전화번호', { type: 'tel', autoComplete: 'tel', placeholder: '010-1234-5678' })}
        {field('birth_date', '생년월일', { type: 'date', max: yesterday() })}
        <p className="muted small">생년월일은 관람 등급(12·15·19세) 확인에 쓰입니다.</p>
        {serverError && (
          <p className="form-error" role="alert">
            {serverError}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? '가입하는 중…' : '회원가입'}
        </button>
        <p className="login-switch">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </div>
  );
}
