/**
 * Re-exports shared user-store context.
 * All dashboard components must use this hook inside UserStoreProvider.
 */
export {
  useUserStore,
  UserStoreProvider,
  type StoreRow,
  type UserStoreSummary,
  type UseUserStoreResult,
} from '@/context/user-store-context'
