import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.scss';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, firstName, lastName, password);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="brand">📱 PhoneStore</div>
          <h1 className="auth-card__title">Регистрация</h1>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <label className="label">
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" autoFocus required />
          </label>
          <div className="formRow">
            <label className="label">
              Имя
              <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Иван" required />
            </label>
            <label className="label">
              Фамилия
              <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Иванов" required />
            </label>
          </div>
          <label className="label">
            Пароль
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <div className="auth-card__footer">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="link">Войти</Link>
        </div>
      </div>
    </div>
  );
}
