import React from 'react';

export default function ProductItem({ product, onEdit, onDelete }) {
  const { id, title, category, description, price } = product;

  return (
    <div className="card">
      <div className="card__header">
        <span className="card__name">{title}</span>
        <span className="card__category">{category}</span>
      </div>
      {description && <p className="card__desc">{description}</p>}
      <div className="card__meta">
        <span className="card__price">{Number(price).toLocaleString('ru-RU')} ₽</span>
        <div className="card__actions">
          {onEdit && <button className="btn" onClick={() => onEdit(product)}>Изменить</button>}
          {onDelete && <button className="btn btn--danger" onClick={() => onDelete(id)}>Удалить</button>}
        </div>
      </div>
    </div>
  );
}
