/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useQuery } from '@tanstack/react-query'
import { getModels } from '@/features/models/api'
import type { Model } from '@/features/models/types'

const addModelName = (names: Set<string>, value?: string) => {
  const name = typeof value === 'string' ? value.trim() : ''
  if (name) names.add(name)
}

export const extractModelCatalogNames = (items: Model[] = []) => {
  const names = new Set<string>()

  items.forEach((item) => {
    addModelName(names, item.model_name)
    item.matched_models?.forEach((name) => addModelName(names, name))
  })

  return Array.from(names).sort((a, b) => a.localeCompare(b))
}

export function useModelCatalogNames() {
  const query = useQuery({
    queryKey: ['system-settings', 'model-catalog-names'],
    queryFn: async () => {
      const response = await getModels({ page_size: 10000 })
      if (!response.success) {
        throw new Error(response.message || 'Failed to load model catalog')
      }
      return extractModelCatalogNames(response.data?.items ?? [])
    },
    staleTime: 60_000,
  })

  return {
    modelNames: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
  }
}
