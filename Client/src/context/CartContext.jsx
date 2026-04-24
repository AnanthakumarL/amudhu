import React, { createContext, useContext, useReducer, useState } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + (action.payload.quantity || 1) }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) }
    case 'UPDATE_QTY': {
      if (action.payload.qty <= 0) {
        return { ...state, items: state.items.filter(i => i.id !== action.payload.id) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id ? { ...i, quantity: action.payload.qty } : i
        ),
      }
    }
    case 'CLEAR':
      return { ...state, items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const addItem = (product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...product, quantity } })
    toast.success(`${product.name} added to cart`, {
      style: {
        background: '#435729',
        color: '#fff',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: '14px',
        borderRadius: '12px',
      },
      iconTheme: { primary: '#a8bf8e', secondary: '#fff' },
    })
  }

  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id })
  const updateQty  = (id, qty) => dispatch({ type: 'UPDATE_QTY', payload: { id, qty } })
  const clearCart  = () => dispatch({ type: 'CLEAR' })

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0)
  const subtotal   = state.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const delivery   = subtotal >= 499 ? 0 : 49
  const total      = subtotal + delivery

  return (
    <CartContext.Provider
      value={{
        items: state.items, addItem, removeItem, updateQty, clearCart,
        totalItems, subtotal, delivery, total, sidebarOpen, setSidebarOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
