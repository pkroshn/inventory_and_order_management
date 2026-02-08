import { useState } from 'react'
import { orderApi } from '../api/client'

interface ShipOrderButtonProps {
  orderId: number
  onSuccess: (orderId: number) => void
}

function ShipOrderButton({ orderId, onSuccess }: ShipOrderButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShip = async () => {
    if (!confirm(`Are you sure you want to ship order #${orderId}?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      await orderApi.updateOrderStatus(orderId, 'Shipped')
      onSuccess(orderId)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update order status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button 
        onClick={handleShip} 
        disabled={loading}
        className="success"
      >
        {loading ? 'Shipping...' : 'Ship Order'}
      </button>
      {error && (
        <div className="error" style={{ marginTop: '5px', fontSize: '12px' }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default ShipOrderButton
