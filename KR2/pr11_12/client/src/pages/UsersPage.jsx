import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ProductsPage.scss';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['user', 'seller', 'admin'];

export default function UsersPage() {
  const { user: me, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsers()
      .then((res) => setUsers(res.data))
      .catch(() => alert('Ошибка загрузки пользователей'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (id, role) => {
    try {
      const res = await api.updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка смены роли');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">⚡ TechStore</div>
          <div className="header__right">
            <Link to="/products" className="nav-link">Товары</Link>
            <span className="role-badge role-badge--admin">admin</span>
            <span className="user-info">{me?.first_name} {me?.last_name}</span>
            <button className="btn btn--logout" onClick={logout}>Выйти</button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Пользователи</h1>
          </div>

          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : users.length === 0 ? (
            <div className="empty">Пользователей нет</div>
          ) : (
            <div className="grid">
              {users.map((u) => (
                <div className="card" key={u.id}>
                  <div className="card__header">
                    <span className="card__name">{u.first_name} {u.last_name}</span>
                    <span className={`role-badge role-badge--${u.role}`}>{u.role}</span>
                  </div>
                  <p className="card__desc">{u.email}</p>
                  <div className="card__meta">
                    <div className="card__actions">
                      {ROLES.filter((r) => r !== u.role).map((r) => (
                        <button
                          key={r}
                          className={`btn btn--${r === 'admin' ? 'danger' : r === 'seller' ? 'success' : 'primary'}`}
                          onClick={() => handleRoleChange(u.id, r)}
                          disabled={u.id === me?.id}
                        >
                          → {r}
                        </button>
                      ))}
                      <button
                        className="btn btn--danger"
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === me?.id}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">© {new Date().getFullYear()} TechStore</div>
      </footer>
    </div>
  );
}
