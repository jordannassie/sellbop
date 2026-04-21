'use client'
import {
  createContext, useContext, useState, useCallback,
  useEffect, ReactNode,
} from 'react'
import type { Storefront, Product } from '@/lib/domain/entities'
import { DEMO_STOREFRONT } from '@/lib/demo-data/seed'
import { demoStorefrontRepo, demoProductRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { toast } from 'sonner'

interface StoreEditorCtx {
  config: Storefront
  products: Product[]
  isDirty: boolean
  isSaving: boolean
  update: (patch: Partial<Storefront>) => void
  saveChanges: () => Promise<void>
  resetToDefault: () => void
}

const StoreEditorContext = createContext<StoreEditorCtx | null>(null)

export function StoreEditorProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Storefront>(DEMO_STOREFRONT)
  const [products, setProducts] = useState<Product[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load persisted storefront + ALL account products (including Printify) on mount
  useEffect(() => {
    demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id).then(s => {
      if (s) {
        // Merge with DEMO_STOREFRONT defaults so new fields added later are always present
        setConfig({ ...DEMO_STOREFRONT, ...(s as Storefront) })
      }
    })
    demoProductRepo.findAll(DEMO_SELLER_PROFILE.id).then(all => {
      setProducts(all.length > 0 ? all : [])
    })
  }, [])

  const update = useCallback((patch: Partial<Storefront>) => {
    setConfig(prev => ({ ...prev, ...patch }))
    setIsDirty(true)
  }, [])

  const saveChanges = useCallback(async () => {
    setIsSaving(true)
    try {
      await demoStorefrontRepo.upsert({
        sellerId: config.sellerId,
        slug: config.slug,
        title: config.title,
        headline: config.headline,
        bio: config.bio,
        avatarUrl: config.avatarUrl,
        bannerUrl: config.bannerUrl,
        featuredProductIds: config.featuredProductIds,
        productOrder: config.productOrder,
        hiddenProductIds: config.hiddenProductIds,
        themeColor: config.themeColor,
        buttonStyle: config.buttonStyle,
        cardStyle: config.cardStyle,
        headerLayout: config.headerLayout,
        cardDensity: config.cardDensity,
        sectionOrder: config.sectionOrder,
        sectionVisibility: config.sectionVisibility,
        socialLinks: config.socialLinks,
        headerMedia: config.headerMedia,
        headerPhotoUrl: config.headerPhotoUrl,
        headerVideoUrl: config.headerVideoUrl,
        published: config.published,
      })
      setIsDirty(false)
      toast.success('Store saved!')
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [config])

  const resetToDefault = useCallback(() => {
    setConfig(DEMO_STOREFRONT)
    setIsDirty(false)
    toast.success('Reset to defaults.')
  }, [])

  return (
    <StoreEditorContext.Provider value={{
      config,
      products,
      isDirty,
      isSaving,
      update,
      saveChanges,
      resetToDefault,
    }}>
      {children}
    </StoreEditorContext.Provider>
  )
}

export function useStoreEditor() {
  const ctx = useContext(StoreEditorContext)
  if (!ctx) throw new Error('useStoreEditor must be inside StoreEditorProvider')
  return ctx
}
