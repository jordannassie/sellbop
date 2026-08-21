import type {
  GoogleTrendsSignal,
  ProductFitSignal,
  QuerySignal,
  SellBopSignal,
  YouTubeSignal,
} from '../types'

export interface ThemeResearchBundle {
  theme: string
  queries: QuerySignal[]
  youtube: YouTubeSignal
  trends: GoogleTrendsSignal
  productFit: ProductFitSignal
  sellbop: SellBopSignal
}

export interface ProviderContext {
  category: string
  topic?: string
}
