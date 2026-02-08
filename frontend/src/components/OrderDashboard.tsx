import { useState, useEffect } from 'react'
import { orderApi, Order } from '../api/client'
import ShipOrderButton from './ShipOrderButton'

function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderIds, setOrderIds] = useState<number[]>([])

  useEffect(() => {
    // For demo purposes, we'll track order IDs and fetch them individually
    // In a real app, you'd have a list orders endpoint
    loadRecentOrders()
  }, [])

  const loadRecentOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedOrders = await orderApi.getOrders(0, 50)
      setOrders(fetchedOrders)
      setOrderIds(fetchedOrders.map(o => o.id))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderStatusUpdate = (orderId: number) => {
    // Reload orders after status update
    loadRecentOrders()
  }

  if (loading) {
    return <div className="loading">Loading orders...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div>
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
              <td colSpan={6} style={{ textAlign: 'center' }}>
                No orders found. Create an order through the API.
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const total = order.order_items.reduce(
                (sum, item) => sum + parseFloat(item.price_at_time) * item.quantity_ordered,
                0
              )
              
              return (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.order_items.map((item, idx) => (
                      <div key={item.id} style={{ fontSize: '12px' }}>
                        {item.product_name || `Product ${item.product_id}`} x{item.quantity_ordered}
                      </div>
                    ))}
                  </td>
                  <td>${total.toFixed(2)}</td>
                  <td>
                    {order.status === 'Pending' && (
                      <ShipOrderButton 
                        orderId={order.id} 
                        onSuccess={handleOrderStatusUpdate}
                      />
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
      <button onClick={loadRecentOrders} style={{ marginTop: '15px' }}>
        Refresh
      </button>
    </div>
  )
}

export default OrderDashboard
