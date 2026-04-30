'use client'

import { useState, useEffect, useCallback } from 'react'
import { demoProductRepo, demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import type { Storefront } from '@/lib/domain/entities'

export interface LaunchChecklist {
  storeCreated: boolean
  headlineAdded: boolean
  bioAdded: boolean
  productCreated: boolean
  productPriced: boolean
  productDescribed: boolean
  productAccessAdded: boolean
  storePreviewViewed: boolean
  storePublished: boolean
  storeLinkCopied: boolean
}

export type ChecklistKey = keyof LaunchChecklist

const STORAGE_KEY = 'sellbop_launch_checklist'

function readStorage(): Partial<LaunchChecklist> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<LaunchChecklist>) : {}
  } catch {
    return {}
  }
}

function writeStorage(data: Partial<LaunchChecklist>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* storage unavailable */ }
}

export interface UseLaunchChecklistResult {
  checklist: LaunchChecklist
  completedCount: number
  totalCount: number
  percentComplete: number
  isLaunched: boolean
  storefront: Storefront | null
  markComplete: (key: ChecklistKey) => void
  refresh: () => Promise<void>
}

export function useLaunchChecklist(): UseLaunchChecklistResult {
  const [checklist, setChecklist] = useState<LaunchChecklist>({
    storeCreated: false,
    headlineAdded: false,
    bioAdded: false,
    productCreated: false,
    productPriced: false,
    productDescribed: false,
    productAccessAdded: false,
    storePreviewViewed: false,
    storePublished: false,
    storeLinkCopied: false,
  })
  const [storefront, setStorefront] = useState<Storefront | null>(null)

  const refresh = useCallback(async () => {
    const stored = readStorage()

    const [products, sf] = await Promise.all([
      demoProductRepo.findAll(DEMO_SELLER_PROFILE.id),
      demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id),
    ])

    const anyProduct = products.length > 0
    const pricedProduct = products.some(p => p.price > 0)
    const describedProduct = products.some(p => (p.description?.trim() ?? '').length > 20)
    const accessProduct = products.some(p => p.externalUrl || p.fileAssetIds?.length > 0)

    const storeCreated = !!sf?.title && sf.title.trim().length > 0
    const headlineAdded = !!sf?.headline && sf.headline.trim().length > 0
    const bioAdded = !!sf?.bio && sf.bio.trim().length > 0
    const storePublished = sf?.published ?? false

    setStorefront(sf as Storefront | null)
    setChecklist({
      storeCreated,
      headlineAdded,
      bioAdded,
      productCreated: anyProduct,
      productPriced: pricedProduct,
      productDescribed: describedProduct,
      productAccessAdded: accessProduct,
      storePreviewViewed: stored.storePreviewViewed ?? false,
      storePublished,
      storeLinkCopied: stored.storeLinkCopied ?? false,
    })
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function markComplete(key: ChecklistKey) {
    const stored = readStorage()
    const updated = { ...stored, [key]: true }
    writeStorage(updated)
    setChecklist(prev => ({ ...prev, [key]: true }))
  }

  const entries = Object.values(checklist)
  const completedCount = entries.filter(Boolean).length
  const totalCount = entries.length
  const percentComplete = Math.round((completedCount / totalCount) * 100)
  const isLaunched = checklist.storePublished

  return {
    checklist,
    completedCount,
    totalCount,
    percentComplete,
    isLaunched,
    storefront,
    markComplete,
    refresh,
  }
}
