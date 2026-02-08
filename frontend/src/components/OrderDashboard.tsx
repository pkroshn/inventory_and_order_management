import { useState, useEffect } from 'react'
import { orderApi, productApi, Order, Product } from '../api/client'
import ShipOrderButton from './ShipOrderButton'

type OrderStatusType = 'Pending' | 'Shipped' | 'Cancelled'

function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createItems, setCreateItems] = useState<{ product_id: number; quantity: number }[]>([{ product_id: 0, quantity: 1 }])
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [editStatus, setEditStatus] = useState<OrderStatusType>('Pending')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editNewItems, setEditNewItems] = useState<{ product_id: number; quantity: number }[]>([{ product_id: 0, quantity: 1 }])
  const [editAddSubmitting, setEditAddSubmitting] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    loadRecentOrders()
  }, [])

  useEffect(() => {
    if ((showCreateModal || editOrder) && products.length === 0) {
      productApi.getProducts(0, 500).then((data) => {
        const list = Array.isArray(data) ? data : data?.items ?? []
        setProducts(Array.isArray(list) ? list : [])
      }).catch(() => setProducts([]))
    }
  }, [showCreateModal, editOrder])

  const loadRecentOrders = async () => {
    try {
      setLoading(true)
      const fetchedOrders = await orderApi.getOrders(0, 50)
      setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    const items = createItems.filter((row) => row.product_id > 0 && row.quantity > 0)
    if (items.length === 0) {
      setCreateError('Add at least one product with quantity.')
      return
    }
    try {
      setCreateSubmitting(true)
      await orderApi.createOrder(items)
      setShowCreateModal(false)
      setCreateItems([{ product_id: 0, quantity: 1 }])
      await loadRecentOrders()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setCreateError(Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg).join('. ') : (detail || 'Failed to create order'))
    } finally {
      setCreateSubmitting(false)
    }
  }

  const addCreateRow = () => {
    setCreateItems((prev) => [...prev, { product_id: 0, quantity: 1 }])
  }

  const removeCreateRow = (index: number) => {
    setCreateItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const updateCreateRow = (index: number, field: 'product_id' | 'quantity', value: number) => {
    setCreateItems((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const handleEditStatusSave = async () => {
    if (!editOrder) return
    setEditError(null)
    try {
      setEditSubmitting(true)
      await orderApi.updateOrderStatus(editOrder.id, editStatus)
      setEditOrder(null)
      setEditNewItems([{ product_id: 0, quantity: 1 }])
      await loadRecentOrders()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setEditError(Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg).join('. ') : (detail || 'Failed to update status'))
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleAddItemsToOrder = async () => {
    if (!editOrder) return
    const items = editNewItems.filter((row) => row.product_id > 0 && row.quantity > 0)
    if (items.length === 0) {
      setEditError('Select at least one product with quantity.')
      return
    }
    setEditError(null)
    try {
      setEditAddSubmitting(true)
      const updated = await orderApi.addOrderItems(editOrder.id, items)
      setEditOrder(updated)
      setEditNewItems([{ product_id: 0, quantity: 1 }])
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setEditError(Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg).join('. ') : (detail || 'Failed to add items'))
    } finally {
      setEditAddSubmitting(false)
    }
  }

  const addEditNewItemRow = () => {
    setEditNewItems((prev) => [...prev, { product_id: 0, quantity: 1 }])
  }

  const updateEditNewItemRow = (index: number, field: 'product_id' | 'quantity', value: number) => {
    setEditNewItems((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const removeEditNewItemRow = (index: number) => {
    setEditNewItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const openEditModal = (order: Order) => {
    setEditOrder(order)
    setEditStatus(order.status)
    setEditError(null)
    setEditNewItems([{ product_id: 0, quantity: 1 }])
  }

  const handleCancelOrder = async () => {
    if (!confirmCancel) return
    setCancelError(null)
    try {
      setCancelling(true)
      await orderApi.cancelOrder(confirmCancel.id)
      setConfirmCancel(null)
      await loadRecentOrders()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setCancelError(Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg).join('. ') : (detail || 'Failed to cancel order'))
    } finally {
      setCancelling(false)
    }
  }

  const orderTotal = (order: Order) =>
    order.order_items.reduce((sum, item) => sum + parseFloat(item.price_at_time) * item.quantity_ordered, 0)

  if (loading) {
    return <div className="loading">Loading orders...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="success" onClick={() => { setShowCreateModal(true); setCreateError(null); setCreateItems([{ product_id: 0, quantity: 1 }]) }}>
          Create Order
        </button>
        <button onClick={loadRecentOrders} disabled={loading}>Refresh</button>
      </div>

      {/* Create Order modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => !createSubmitting && setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Create Order</h3>
              <button type="button" className="modal-close" onClick={() => !createSubmitting && setShowCreateModal(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                {createError && <div className="error" style={{ marginBottom: '12px' }}>{createError}</div>}
                <p className="modal-message" style={{ marginBottom: '12px' }}>Add products and quantities.</p>
                {createItems.map((row, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    <select
                      value={row.product_id || ''}
                      onChange={(e) => updateCreateRow(index, 'product_id', Number(e.target.value))}
                      required
                      style={{ flex: 2, padding: '8px' }}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (stock: {p.stock_quantity})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateCreateRow(index, 'quantity', parseInt(e.target.value, 10) || 0)}
                      style={{ width: '80px', padding: '8px' }}
                    />
                    <button type="button" onClick={() => removeCreateRow(index)} disabled={createItems.length <= 1}>−</button>
                  </div>
                ))}
                <button type="button" onClick={addCreateRow} style={{ marginBottom: '16px' }}>+ Add item</button>
                <div className="modal-actions">
                  <button type="submit" className="success" disabled={createSubmitting}>{createSubmitting ? 'Creating...' : 'Create Order'}</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} disabled={createSubmitting}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order modal */}
      {viewOrder && (
        <div className="modal-backdrop" onClick={() => setViewOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Order #{viewOrder.id}</h3>
              <button type="button" className="modal-close" onClick={() => setViewOrder(null)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Created</label>
                <p style={{ margin: 0 }}>{new Date(viewOrder.created_at).toLocaleString()}</p>
              </div>
              <div className="form-group">
                <label>Status</label>
                <p style={{ margin: 0 }}>
                  <span className={`status-badge status-${viewOrder.status.toLowerCase()}`}>{viewOrder.status}</span>
                </p>
              </div>
              <div className="form-group">
                <label>Items</label>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {viewOrder.order_items.map((item) => (
                    <li key={item.id}>
                      {item.product_name || `Product ${item.product_id}`} × {item.quantity_ordered} @ ${Number(item.price_at_time).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="form-group">
                <label>Total</label>
                <p style={{ margin: 0 }}>${orderTotal(viewOrder).toFixed(2)}</p>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setViewOrder(null); openEditModal(viewOrder) }}>Edit</button>
                <button type="button" onClick={() => setViewOrder(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order modal: status + add items */}
      {editOrder && (
        <div className="modal-backdrop" onClick={() => !editSubmitting && !editAddSubmitting && (setEditOrder(null), setEditNewItems([{ product_id: 0, quantity: 1 }]))}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Edit Order #{editOrder.id}</h3>
              <button type="button" className="modal-close" onClick={() => !editSubmitting && !editAddSubmitting && (setEditOrder(null), setEditNewItems([{ product_id: 0, quantity: 1 }]))} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              {editError && <div className="error" style={{ marginBottom: '12px' }}>{editError}</div>}
              <div className="form-group">
                <label>Current items</label>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {editOrder.order_items.map((item) => (
                    <li key={item.id}>
                      {item.product_name || `Product ${item.product_id}`} × {item.quantity_ordered} @ ${Number(item.price_at_time).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              {editOrder.status === 'Pending' && (
                <>
                  <div className="form-group">
                    <label>Add items to order</label>
                    {editNewItems.map((row, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <select
                          value={row.product_id || ''}
                          onChange={(e) => updateEditNewItemRow(index, 'product_id', Number(e.target.value))}
                          style={{ flex: 2, padding: '8px' }}
                        >
                          <option value="">Select product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} (stock: {p.stock_quantity})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => updateEditNewItemRow(index, 'quantity', parseInt(e.target.value, 10) || 0)}
                          style={{ width: '70px', padding: '8px' }}
                        />
                        <button type="button" onClick={() => removeEditNewItemRow(index)} disabled={editNewItems.length <= 1}>−</button>
                      </div>
                    ))}
                    <button type="button" onClick={addEditNewItemRow} style={{ marginBottom: '12px' }}>+ Add row</button>
                    <button type="button" className="success" onClick={handleAddItemsToOrder} disabled={editAddSubmitting} style={{ marginLeft: '8px' }}>
                      {editAddSubmitting ? 'Adding...' : 'Add to order'}
                    </button>
                  </div>
                </>
              )}
              <div className="form-group">
                <label>Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as OrderStatusType)} style={{ width: '100%', padding: '10px' }}>
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="success" onClick={handleEditStatusSave} disabled={editSubmitting}>{editSubmitting ? 'Saving...' : 'Save status'}</button>
                <button type="button" onClick={() => { setEditOrder(null); setEditNewItems([{ product_id: 0, quantity: 1 }]) }} disabled={editSubmitting || editAddSubmitting}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm cancel modal */}
      {confirmCancel && (
        <div className="modal-backdrop modal-backdrop-confirm" onClick={() => !cancelling && (setConfirmCancel(null), setCancelError(null))}>
          <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel order</h3>
              {!cancelling && <button type="button" className="modal-close" onClick={() => { setConfirmCancel(null); setCancelError(null) }} aria-label="Close">×</button>}
            </div>
            <div className="modal-body">
              {cancelError && <div className="error" style={{ marginBottom: '12px' }}>{cancelError}</div>}
              <p className="modal-message">
                Cancel order #{confirmCancel.id}? This will set the order status to Cancelled.
              </p>
              <div className="modal-actions">
                <button type="button" className="danger" disabled={cancelling} onClick={handleCancelOrder}>{cancelling ? 'Cancelling...' : 'Cancel order'}</button>
                <button type="button" onClick={() => !cancelling && (setConfirmCancel(null), setCancelError(null))} disabled={cancelling}>Back</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Created At</th>
            <th>Status</th>
            <th>Items</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center' }}>No orders</td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
                </td>
                <td>
                  {order.order_items.map((item) => (
                    <div key={item.id} style={{ fontSize: '12px' }}>
                      {item.product_name || `Product ${item.product_id}`} ×{item.quantity_ordered}
                    </div>
                  ))}
                </td>
                <td>${orderTotal(order).toFixed(2)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setViewOrder(order)}>View</button>
                    <button type="button" onClick={() => openEditModal(order)}>Edit</button>
                    {order.status === 'Pending' && (
                      <ShipOrderButton orderId={order.id} onSuccess={loadRecentOrders} />
                    )}
                    {order.status !== 'Cancelled' && (
                      <button type="button" className="danger" onClick={() => setConfirmCancel(order)} disabled={cancelling}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default OrderDashboard
