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
import type { TFunction } from 'i18next'
import { EXCLUDED_GROUPS, QUOTA_TYPE_VALUES } from '../constants'
import type { PricingModel } from '../types'

// ----------------------------------------------------------------------------
// Model Helper Utilities
// ----------------------------------------------------------------------------

/**
 * Get available groups for a model
 */
export function getAvailableGroups(
  model: PricingModel,
  usableGroup: Record<string, { desc: string; ratio: number }>
): string[] {
  const modelEnableGroups = Array.isArray(model.enable_groups)
    ? model.enable_groups
    : []

  return Object.keys(usableGroup)
    .filter((g) => !EXCLUDED_GROUPS.includes(g))
    .filter((g) => modelEnableGroups.includes(g))
}

/**
 * Replace model placeholder in endpoint path
 */
export function replaceModelInPath(path: string, modelName: string): string {
  return path.replace(/\{model\}/g, modelName)
}

/**
 * Check if model is token-based pricing
 */
export function isTokenBasedModel(model: PricingModel): boolean {
  return model.quota_type === QUOTA_TYPE_VALUES.TOKEN
}

const SECOND_BASED_FIXED_PRICE_MODEL_PATTERNS = [
  /^veo(?:[-_.]|\d)/i,
  /^grok-imagine-video$/i,
]

/**
 * NewAPI stores video generation prices in the fixed-price field, but billing
 * multiplies that unit price by generated seconds in the task relay.
 */
export function isSecondBasedFixedPriceModel(model: PricingModel): boolean {
  if (model.quota_type !== QUOTA_TYPE_VALUES.REQUEST) return false

  const modelName = model.model_name || ''
  const endpointTypes = Array.isArray(model.supported_endpoint_types)
    ? model.supported_endpoint_types
    : []

  return (
    endpointTypes.some((endpoint) => endpoint.toLowerCase().includes('video')) ||
    SECOND_BASED_FIXED_PRICE_MODEL_PATTERNS.some((pattern) =>
      pattern.test(modelName)
    )
  )
}

export function getFixedPriceUnitLabel(
  model: PricingModel,
  t: TFunction
): string {
  return isSecondBasedFixedPriceModel(model) ? t('second') : t('request')
}

export function getFixedPricingTypeLabel(
  model: PricingModel,
  t: TFunction
): string {
  return isSecondBasedFixedPriceModel(model) ? t('Per Second') : t('Per Request')
}

export function getFixedPricingTypeShortLabel(
  model: PricingModel,
  t: TFunction
): string {
  return isSecondBasedFixedPriceModel(model) ? t('Second') : t('Request')
}
