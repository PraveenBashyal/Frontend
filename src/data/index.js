// Single entry point for data. The UI imports from here, never from
// mockSource/apiSource directly.
// Set VITE_USE_MOCK=false in .env.local to hit the real backend.

import * as mockSource from './mockSource'
import * as apiSource from './apiSource'

const flag = import.meta.env.VITE_USE_MOCK
export const USE_MOCK = flag === undefined || flag === '' ? true : flag !== 'false'

const source = USE_MOCK ? mockSource : apiSource

export const login               = source.login
export const register            = source.register
export const fetchProfile        = source.fetchProfile
export const updateProfile       = source.updateProfile
export const changePassword      = source.changePassword
export const fetchMarketOverview = source.fetchMarketOverview
export const fetchWatchlist      = source.fetchWatchlist
export const searchAssets        = source.searchAssets
export const fetchAssetDetail    = source.fetchAssetDetail
export const addToWatchlist      = source.addToWatchlist
export const removeFromWatchlist = source.removeFromWatchlist
export const analyzeAsset        = source.analyzeAsset
export const fetchAlerts         = source.fetchAlerts
export const sendChatMessage     = source.sendChatMessage
export const fetchPortfolio      = source.fetchPortfolio
export const addHolding          = source.addHolding
export const removeHolding       = source.removeHolding

// Alert mutations fire this event so the Sidebar recounts its unread badge
export const ALERTS_CHANGED = 'alerts-changed'

function announce() {
  window.dispatchEvent(new Event(ALERTS_CHANGED))
}

export async function dismissAlert(id) {
  await source.dismissAlert(id)
  announce()
}

export async function clearAlerts() {
  await source.clearAlerts()
  announce()
}

export async function markAlertsRead() {
  await source.markAlertsRead()
  announce()
}

export {
  MOOD, moodFromScore, summarise, toneClass,
  ASSET_TYPES, SORT_OPTIONS, filterAssets, sortAssets,
  priceHolding, summarisePortfolio,
} from './viewModels'
