import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ProductsPage.scss';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ProductsList from '../components/ProductsList';
import ProductModal from '../components/ProductModal';

export default function ProductsPage() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState('Все');

  const canManage = user?.role === 'seller' || user?.role === 'admin';
  const canDelete = user?.role === 'admin';

  useEffect(() => {
    api.getProducts()
      .then((res) => setProducts(res.data))
      .catch(() => alert('Ошибка загрузки товаров'))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['Все', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = filterCategory === 'Все' ? products : products.filter((p) => p.category === filterCategory);

  const openCreate = () => { setModalMode('create'); setEditingProduct(null); setModalOpen(true); };
  const openEdit = (product) => { setModalMode('edit'); setEditingProduct(product); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingProduct(null); };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === 'create') {
        const res = await api.createProduct(payload);
        setProducts((prev) => [...prev, res.data]);
      } else {
        const res = await api.updateProduct(payload.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === payload.id ? res.data : p)));
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">📱 PhoneStore</div>
          <div className="header__right">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/users" className="nav-link">Пользователи</Link>
                )}
                <span className={`role-badge role-badge--${user.role}`}>{user.role}</span>
                <span className="user-info">{user.first_name} {user.last_name}</span>
                <button className="btn btn--logout" onClick={logout}>Выйти</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Войти</Link>
                <Link to="/register" className="btn btn--primary">Регистрация</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Товары</h1>
            {canManage && (
              <button className="btn btn--primary" onClick={openCreate}>+ Добавить товар</button>
            )}
          </div>

          <div className="categories">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`categoryBtn${filterCategory === cat ? ' categoryBtn--active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <ProductsList
              products={filtered}
              onEdit={canManage ? openEdit : null}
              onDelete={canDelete ? handleDelete : null}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">© {new Date().getFullYear()} PhoneStore</div>
      </footer>

      {canManage && (
        <ProductModal
          open={modalOpen}
          mode={modalMode}
          initialProduct={editingProduct}
          onClose={closeModal}
          onSubmit={handleSubmitModal}
        />
      )}
    </div>
  );
}
