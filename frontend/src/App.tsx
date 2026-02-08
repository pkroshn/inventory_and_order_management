import { useState } from 'react'
import ProductList from './components/ProductList'
import OrderDashboard from './components/OrderDashboard'
import './App.css'

function App() {
  return (
    <div className="container">
      <div className="header">
        <h1>Inventory & Order Management System</h1>
        <p>Manage products and orders efficiently</p>
      </div>
      
      <div className="section">
        <h2>Products</h2>
        <ProductList />
      </div>
      
      <div className="section">
        <h2>Orders</h2>
        <OrderDashboard />
      </div>
    </div>
  )
}

export default App
