import React, { useEffect, useState } from 'react';

const empty = { title: '', category: '', description: '', price: '' };

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      setForm(initialProduct ? { ...initialProduct, price: String(initialProduct.price) } : empty);
    }
  }, [open, initialProduct]);

  if (!open) return null;

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, id: initialProduct?.id, price: Number(form.price) });
  };

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <span className="modal__title">{mode === 'create' ? 'Добавить товар' : 'Редактировать товар'}</span>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input className="input" value={form.title} onChange={set('title')} placeholder="iPhone 16" required />
          </label>
          <div className="formRow">
            <label className="label">
              Категория
              <input className="input" value={form.category} onChange={set('category')} placeholder="Смартфоны" required />
            </label>
            <label className="label">
              Цена (₽)
              <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="99999" required />
            </label>
          </div>
          <label className="label">
            Описание
            <textarea className="textarea" value={form.description} onChange={set('description')} placeholder="Краткое описание товара..." />
          </label>
          <div className="modal__footer">
            <button className="btn" type="button" onClick={onClose}>Отмена</button>
            <button className="btn btn--primary" type="submit">
              {mode === 'create' ? 'Добавить' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
