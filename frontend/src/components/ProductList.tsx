import { useState, useEffect } from 'react'
import { productApi, Product } from '../api/client'

function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', price: '', stock_quantity: '0' })
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean
    title: string
    message: string
    confirmLabel: string
    danger?: boolean
    onConfirm: () => Promise<void>
  }>({ show: false, title: '', message: '', confirmLabel: '', onConfirm: async () => {} })
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productApi.getProducts()
      // Handle both { items: [...] } and direct array (defensive)
      const list = Array.isArray(data)
        ? data
        : (data?.items ?? [])
      setProducts(Array.isArray(list) ? list : [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Refetch when user returns to the tab (e.g. after adding a product in API docs)
  useEffect(() => {
    const onFocus = () => loadProducts()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const name = form.name.trim()
    const price = parseFloat(form.price)
    const stock = parseInt(form.stock_quantity, 10)
    if (!name) {
      setFormError('Name is required')
      return
    }
    if (isNaN(price) || price <= 0) {
      setFormError('Price must be a positive number')
      return
    }
    if (isNaN(stock) || stock < 0) {
      setFormError('Stock quantity must be 0 or greater')
      return
    }
    try {
      setSubmitting(true)
      await productApi.createProduct({
        name,
        price: form.price,
        stock_quantity: stock,
      })
      setForm({ name: '', price: '', stock_quantity: '0' })
      setShowForm(false)
      await loadProducts()
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Failed to add product'
      setFormError(String(message || 'Failed to add product'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProductId == null) return
    setFormError(null)
    const name = form.name.trim()
    const price = parseFloat(form.price)
    const stock = parseInt(form.stock_quantity, 10)
    if (!name) {
      setFormError('Name is required')
      return
    }
    if (isNaN(price) || price <= 0) {
      setFormError('Price must be a positive number')
      return
    }
    if (isNaN(stock) || stock < 0) {
      setFormError('Stock quantity must be 0 or greater')
      return
    }
    try {
      setSubmitting(true)
      await productApi.updateProduct(editingProductId, {
        name,
        price: form.price,
        stock_quantity: stock,
      })
      setForm({ name: '', price: '', stock_quantity: '0' })
      setEditingProductId(null)
      await loadProducts()
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Failed to update product'
      setFormError(String(message || 'Failed to update product'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOneClick = (product: Product) => {
    setConfirmModal({
      show: true,
      title: 'Delete product',
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          setDeleting(true)
          await productApi.deleteProduct(product.id)
          setConfirmModal((c) => ({ ...c, show: false }))
          await loadProducts()
          setSelectedIds((prev) => {
            const next = new Set(prev)
            next.delete(product.id)
            return next
          })
        } catch {
          setConfirmModal((c) => ({ ...c, show: false }))
          setErrorModal({ show: true, message: 'Failed to delete product. Please try again.' })
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  const handleBulkDeleteClick = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setConfirmModal({
      show: true,
      title: 'Delete selected products',
      message: `Are you sure you want to delete ${ids.length} selected product(s)? This action cannot be undone.`,
      confirmLabel: 'Delete all',
      danger: true,
      onConfirm: async () => {
        try {
          setDeleting(true)
          await productApi.deleteProductsBulk(ids)
          setConfirmModal((c) => ({ ...c, show: false }))
          setSelectedIds(new Set())
          await loadProducts()
        } catch {
          setConfirmModal((c) => ({ ...c, show: false }))
          setErrorModal({ show: true, message: 'Failed to delete products. Please try again.' })
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)))
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id)
    setForm({
      name: product.name,
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
    })
    setFormError(null)
  }

  if (loading) {
    return <div className="loading">Loading products...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className="success"
          onClick={() => { setShowForm(true); setFormError(null); setForm({ name: '', price: '', stock_quantity: '0' }) }}
        >
          Add Product
        </button>
        <button onClick={loadProducts} disabled={loading}>Refresh</button>
        {selectedIds.size > 0 && (
          <button
            type="button"
            className="danger"
            onClick={handleBulkDeleteClick}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : `Delete selected (${selectedIds.size})`}
          </button>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => !submitting && (setShowForm(false), setFormError(null))}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Product</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !submitting && (setShowForm(false), setFormError(null))}
                disabled={submitting}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddProduct}>
              {formError && <div className="error" style={{ marginBottom: '10px' }}>{formError}</div>}
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Product name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="success" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setFormError(null) }} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProductId != null && (
        <div className="modal-backdrop" onClick={() => !submitting && (setEditingProductId(null), setFormError(null))}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Product</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !submitting && (setEditingProductId(null), setFormError(null))}
                disabled={submitting}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateProduct}>
              {formError && <div className="error" style={{ marginBottom: '10px' }}>{formError}</div>}
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Product name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="success" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => { setEditingProductId(null); setFormError(null) }} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewProduct && (
        <div className="modal-backdrop" onClick={() => setViewProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>View Product</h3>
              <button type="button" className="modal-close" onClick={() => setViewProduct(null)} aria-label="Close">×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="form-group">
                <label>ID</label>
                <p style={{ margin: 0 }}>{viewProduct.id}</p>
              </div>
              <div className="form-group">
                <label>Name</label>
                <p style={{ margin: 0 }}>{viewProduct.name}</p>
              </div>
              <div className="form-group">
                <label>Price</label>
                <p style={{ margin: 0 }}>${Number(viewProduct.price).toFixed(2)}</p>
              </div>
              <div className="form-group">
                <label>Stock quantity</label>
                <p style={{ margin: 0 }}>{viewProduct.stock_quantity}</p>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setViewProduct(null); openEditModal(viewProduct) }}>
                  Edit
                </button>
                <button type="button" onClick={() => setViewProduct(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div
          className="modal-backdrop modal-backdrop-confirm"
          onClick={() => !deleting && setConfirmModal((c) => ({ ...c, show: false }))}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="confirm-modal-title">{confirmModal.title}</h3>
              {!deleting && (
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setConfirmModal((c) => ({ ...c, show: false }))}
                  aria-label="Close"
                >
                  ×
                </button>
              )}
            </div>
            <div className="modal-body">
              <p className="modal-message">{confirmModal.message}</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className={confirmModal.danger ? 'danger' : ''}
                  disabled={deleting}
                  onClick={() => confirmModal.onConfirm()}
                >
                  {deleting ? 'Please wait...' : confirmModal.confirmLabel}
                </button>
                <button
                  type="button"
                  onClick={() => !deleting && setConfirmModal((c) => ({ ...c, show: false }))}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorModal.show && (
        <div className="modal-backdrop" onClick={() => setErrorModal({ show: false, message: '' })}>
          <div className="modal modal-alert" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-error">
              <h3>Error</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setErrorModal({ show: false, message: '' })}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-message">{errorModal.message}</p>
              <div className="modal-actions">
                <button type="button" onClick={() => setErrorModal({ show: false, message: '' })}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input
                type="checkbox"
                checked={products.length > 0 && selectedIds.size === products.length}
                onChange={toggleSelectAll}
                aria-label="Select all"
              />
            </th>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center' }}>
                No products
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    aria-label={`Select product ${product.name}`}
                  />
                </td>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>${Number(product.price).toFixed(2)}</td>
                <td>
                  <span style={{ 
                    color: product.stock_quantity === 0 ? '#e74c3c' : 
                           product.stock_quantity < 10 ? '#f39c12' : '#27ae60',
                    fontWeight: '600'
                  }}>
                    {product.stock_quantity}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setViewProduct(product)}>View</button>
                    <button type="button" onClick={() => openEditModal(product)}>Edit</button>
                    <button type="button" className="danger" onClick={() => handleDeleteOneClick(product)} disabled={deleting}>Delete</button>
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

export default ProductList
