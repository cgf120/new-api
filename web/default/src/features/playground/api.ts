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
import { api } from '@/lib/api'

import { API_ENDPOINTS } from './constants'
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelOption,
  GroupOption,
} from './types'

const NON_CHAT_MODEL_PATTERNS = [
  /(^|[-_\s])dall[-_\s]?e($|[-_\s0-9])/,
  /(^|[-_\s])flux($|[-_\s0-9])/,
  /(^|[-_\s])kling($|[-_\s0-9])/,
  /(^|[-_\s])luma($|[-_\s0-9])/,
  /(^|[-_\s])midjourney($|[-_\s0-9])/,
  /(^|[-_\s])mj($|[-_\s0-9])/,
  /(^|[-_\s])pika($|[-_\s0-9])/,
  /(^|[-_\s])pixverse($|[-_\s0-9])/,
  /(^|[-_\s])recraft($|[-_\s0-9])/,
  /(^|[-_\s])runway($|[-_\s0-9])/,
  /(^|[-_\s])sd($|[-_\s0-9])/,
  /(^|[-_\s])seedance($|[-_\s0-9])/,
  /(^|[-_\s])sora($|[-_\s0-9])/,
  /(^|[-_\s])stable[-_\s]?diffusion($|[-_\s0-9])/,
  /(^|[-_\s])veo($|[-_\s0-9.])/,
  /(^|[-_\s])wan($|[-_\s0-9.])/,
]

function isChatCompletionCompatibleModel(model: unknown): model is string {
  if (typeof model !== 'string') return false

  const name = model.trim().toLowerCase()
  if (!name) return false

  if (
    name.includes('image') ||
    name.includes('imagen') ||
    name.includes('grok-imagine') ||
    name.includes('nanobana') ||
    name.includes('nano-banana') ||
    name.includes('video')
  ) {
    return false
  }

  return !NON_CHAT_MODEL_PATTERNS.some((pattern) => pattern.test(name))
}

/**
 * Send chat completion request (non-streaming)
 */
export async function sendChatCompletion(
  payload: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const res = await api.post(API_ENDPOINTS.CHAT_COMPLETIONS, payload, {
    skipErrorHandler: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Get user available models
 */
export async function getUserModels(): Promise<ModelOption[]> {
  const res = await api.get(API_ENDPOINTS.USER_MODELS, {
    skipErrorHandler: true,
  } as Record<string, unknown>)
  const { data } = res

  if (!data.success || !Array.isArray(data.data)) {
    return []
  }

  return data.data
    .filter(isChatCompletionCompatibleModel)
    .map((model: string) => ({
      label: model,
      value: model,
    }))
}

/**
 * Get user groups
 */
export async function getUserGroups(): Promise<GroupOption[]> {
  const res = await api.get(API_ENDPOINTS.USER_GROUPS, {
    skipErrorHandler: true,
  } as Record<string, unknown>)
  const { data } = res

  if (!data.success || !data.data) {
    return []
  }

  const groupData = data.data as Record<string, { desc: string; ratio: number }>

  // label is for button display (name only); desc is for dropdown content
  return Object.entries(groupData).map(([group, info]) => ({
    label: group,
    value: group,
    ratio: info.ratio,
    desc: info.desc,
  }))
}
