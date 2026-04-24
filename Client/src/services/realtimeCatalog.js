import axios from 'axios'
import { categories as localCategories } from '../data/products'

const API_BASE_URL = (() => {
  const configured = import.meta.env.VITE_API_BASE_URL
  if (configured) return configured

  if (typeof window === 'undefined') return 'http://localhost:7999/api/v1'

  const protocol = window.location.protocol || 'http:'
  const hostname = window.location.hostname || 'localhost'
  return `${protocol}//${hostname}:7999/api/v1`
})()

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const fallbackImage = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=700&q=80'

function normalizeCategory(c) {
  const id = c.id || c._id || c.slug
  const label = c.name || c.label || 'Uncategorized'
  return { id, label }
}

function normalizeProduct(product, categoryById) {
  const attrs = product.attributes || {}
  const categoryLabel = categoryById[product.category_id] || 'Uncategorized'
  const tags = Array.isArray(attrs.tags) ? attrs.tags : [categoryLabel]
  const image = product.image_url || attrs.image || fallbackImage

  return {
    id: product.id,
    name: product.name,
    tagline: attrs.tagline || product.description || 'Freshly handcrafted flavour',
    description: product.description || 'Freshly handcrafted flavour',
    price: Number(product.price || 0),
    originalPrice: product.compare_at_price ?? null,
    category: categoryLabel.toLowerCase(),
    categoryId: product.category_id || null,
    rating: Number(attrs.rating ?? 4.8),
    reviews: Number(attrs.reviews ?? 0),
    weight: attrs.weight || '100 ml',
    bestseller: Boolean(product.featured),
    new: Boolean(attrs.is_new),
    tags,
    image,
    gallery: [image],
    ingredients: attrs.ingredients || 'Ingredients information will be updated soon.',
    allergens: attrs.allergens || 'Not specified',
  }
}

export async function fetchRealtimeCatalog({
  search = '',
  categoryId = 'all',
  pageSize = 100,
} = {}) {
  const [categoriesResult, productsResult] = await Promise.allSettled([
    api.get('/categories', { params: { page: 1, page_size: pageSize } }),
    api.get('/products', {
      params: {
        page: 1,
        page_size: pageSize,
        is_active: true,
        ...(categoryId && categoryId !== 'all' ? { category_id: categoryId } : {}),
      },
    }),
  ])

  const categoriesData = categoriesResult.status === 'fulfilled'
    ? (categoriesResult.value.data?.data || [])
    : []

  if (productsResult.status !== 'fulfilled') {
    throw productsResult.reason
  }

  const productsData = productsResult.value.data?.data || []

  const categories = categoriesData
    .map(normalizeCategory)
    .filter(c => c.id)

  const visibleCategories = categories.filter(c => String(c.label || '').trim().toLowerCase() !== 'all')

  const categoryById = categories.reduce((acc, c) => {
    acc[c.id] = c.label
    return acc
  }, {})

  let products = productsData.map(p => normalizeProduct(p, categoryById))

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }

  return {
    categories: localCategories,
    products,
  }
}
