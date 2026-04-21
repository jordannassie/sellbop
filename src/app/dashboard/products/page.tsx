'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Package, ExternalLink, Pencil } from 'lucide-react'
import { ProductImage } from '@/components/ui/product-image'
import type { Product } from '@/lib/domain/entities'

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital Download', service_offer: 'Service Offer',
  subscription: 'Subscription', bundle: 'Bundle', membership_ready: 'Membership',
}

function statusVariant(status: string) {
  return status === 'published' ? 'success' : status === 'archived' ? 'neutral' : 'warning'
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    demoProductRepo.findAll(DEMO_SELLER_PROFILE.id).then(setProducts)
  }, [])

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Products</h1>
          <p className="text-neutral-500 text-sm mt-1">{products.length} products · {products.filter(p => p.status === 'published').length} live</p>
        </div>
        <Link href="/dashboard/products/new"><Button>+ New Product</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <EmptyState icon={<Package size={32} />} title="No products yet" description="Create your first product page." action={<Link href="/dashboard/products/new"><Button size="sm">Create Product</Button></Link>} />
          ) : (
            <div className="divide-y divide-neutral-50">
              {products.map(p => (
                <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <ProductImage src={p.thumbnailUrl} alt={p.name} productType={p.productType} fill iconSize="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-black truncate">{p.name}</p>
                      <Badge variant={statusVariant(p.status)}>
                        {p.status === 'published' ? 'Live' : p.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {TYPE_LABELS[p.productType]} · {formatCurrency(p.price, p.currency)} · {p.salesCount} sales · {p.viewCount.toLocaleString()} views
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.status === 'published' && (
                      <Link href={`/p/${p.slug}`} target="_blank">
                        <Button size="sm" variant="ghost"><ExternalLink size={13} />View</Button>
                      </Link>
                    )}
                    <Link href={`/dashboard/products/${p.id}`}>
                      <Button size="sm" variant="secondary"><Pencil size={13} />Edit</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
