import { useState } from 'react'
import { orderApi } from '../api/client'

interface ShipOrderButtonProps {
  orderId: number
  onSuccess: (orderId: number) => void
}

function ShipOrderButton({ orderId, onSuccess }: ShipOrderButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const runShip = async () => {
    try {
      setLoading(true)
      setError(null)
      await orderApi.updateOrderStatus(orderId, 'Shipped')
      setShowConfirm(false)
      onSuccess(orderId)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      let message = 'Failed to update order status'
      if (detail != null) {
        if (Array.isArray(detail)) {
          const parts = detail.map((d: { msg?: string }) => d.msg).filter(Boolean)
          if (parts.length) message = parts.join('. ')
        } else if (typeof detail === 'string') {
          message = detail
        }
      }
      if (message === 'Failed to update order status' && err.response?.status) {
        message += ` (${err.response.status})`
      }
      setError(message)
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
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

      {showConfirm && (
        <div
          className="modal-backdrop"
          onClick={() => !loading && setShowConfirm(false)}
        >
          <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ship order</h3>
              {!loading && (
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowConfirm(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              )}
            </div>
            <div className="modal-body">
              <p className="modal-message">
                Are you sure you want to ship order #{orderId}? This will update the order status to Shipped.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="success"
                  disabled={loading}
                  onClick={() => runShip()}
                >
                  {loading ? 'Shipping...' : 'Ship'}
                </button>
                <button
                  type="button"
                  onClick={() => !loading && setShowConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShipOrderButton
