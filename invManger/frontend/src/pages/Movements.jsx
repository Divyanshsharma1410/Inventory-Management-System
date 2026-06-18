import { useEffect, useState } from 'react';
import api, { apiError } from '../api/client.js';

const movementLabel = { IN: 'Stock in', OUT: 'Stock out', ADJUST: 'Adjusted' };

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/movements', { params: { limit: 100 } })
      .then((r) => setMovements(r.data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Stock History</h1>
          <p className="muted">Every stock movement, most recent first.</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel no-pad">
        {loading ? <div className="loading">Loading…</div>
          : movements.length === 0 ? <div className="empty">No stock movements yet.</div>
          : (
            <table className="table">
              <thead><tr><th>Product</th><th>Type</th><th>Quantity</th><th>Note</th><th>By</th><th>When</th></tr></thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.product?.name}</strong><div className="muted small">{m.product?.sku}</div></td>
                    <td><span className={`badge badge-${m.type.toLowerCase()}`}>{movementLabel[m.type]}</span></td>
                    <td>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                    <td className="muted">{m.note || '—'}</td>
                    <td>{m.user?.name || '—'}</td>
                    <td className="muted">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
