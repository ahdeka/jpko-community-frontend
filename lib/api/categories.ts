import { apiClient } from './client'
import { Category } from '@/types'

export const categoriesApi = {
  getAll: () => apiClient.get<Category[]>('/api/categories', { next: { revalidate: 3600 } }),
}
