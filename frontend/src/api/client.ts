import axios from 'axios'

// In Docker use VITE_API_URL=/api/v1 so requests go through Vite proxy to backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Product {
  id: number
  name: string
  price: string
  stock_quantity: number
}

export interface OrderItem {
  id: number
  product_id: number
  quantity_ordered: number
  price_at_time: string
  product_name: string | null
}

export interface Order {
  id: number
  created_at: string
  status: 'Pending' | 'Shipped' | 'Cancelled'
  order_items: OrderItem[]
}

export const productApi = {
  getProducts: async (skip: number = 0, limit: number = 100): Promise<{ items: Product[], total: number, skip: number, limit: number }> => {
    const response = await apiClient.get('/products/', {
      params: { skip, limit }
    })
    return response.data
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}/`)
    return response.data
  },
  
  createProduct: async (product: { name: string, price: string, stock_quantity: number }): Promise<Product> => {
    const response = await apiClient.post('/products/', product)
    return response.data
  },

  updateProduct: async (id: number, product: { name?: string, price?: string, stock_quantity?: number }): Promise<Product> => {
    const response = await apiClient.patch(`/products/${id}/`, product)
    return response.data
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}/`)
  },

  deleteProductsBulk: async (ids: number[]): Promise<{ deleted: number }> => {
    const response = await apiClient.post('/products/bulk-delete/', ids)
    return response.data
  },
}

export const orderApi = {
  getOrders: async (skip: number = 0, limit: number = 100): Promise<Order[]> => {
    const response = await apiClient.get('/orders/', {
      params: { skip, limit }
    })
    return response.data
  },
  
  getOrder: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get(`/orders/${orderId}/`)
    return response.data
  },
  
  createOrder: async (items: { product_id: number, quantity: number }[]): Promise<Order> => {
    const response = await apiClient.post('/orders/', { items })
    return response.data
  },
  
  updateOrderStatus: async (orderId: number, status: 'Pending' | 'Shipped' | 'Cancelled'): Promise<Order> => {
    const response = await apiClient.patch(`/orders/${orderId}/status`, { status })
    return response.data
  },

  cancelOrder: async (orderId: number): Promise<void> => {
    await apiClient.delete(`/orders/${orderId}/`)
  },

  addOrderItems: async (orderId: number, items: { product_id: number; quantity: number }[]): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderId}/items/`, { items })
    return response.data
  },
}

export default apiClient
