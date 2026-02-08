import { useState, useEffect } from 'react'
import { productApi, Product } from '../api/client'

function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await productApi.getProducts()
      setProducts(data.items)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading products...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock Quantity</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center' }}>
                No products found
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>${parseFloat(product.price).toFixed(2)}</td>
                <td>
                  <span style={{ 
                    color: product.stock_quantity === 0 ? '#e74c3c' : 
                           product.stock_quantity < 10 ? '#f39c12' : '#27ae60',
                    fontWeight: '600'
                  }}>
                    {product.stock_quantity}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <button onClick={loadProducts} style={{ marginTop: '15px' }}>
        Refresh
      </button>
    </div>
  )
}

export default ProductList
