// Authentication hooks
export { useAuth } from './useAuth';

// State management hooks
export { useDashboardState } from './useDashboardState';
export type { DashboardActions, DashboardState } from './useDashboardState';

// Error handling hooks
export { useErrorHandler } from './useErrorHandler';
export type { ErrorActions, ErrorState } from './useErrorHandler';

// Loading state hooks
export { useLoadingState } from './useLoadingState';
export type { LoadingActions, LoadingState } from './useLoadingState';

// Utility hooks
export {
    useFilterState, useFormState,
    useModalState, usePaginationState, useSelectionState
} from './useStateUtils';

// State helper hooks
export {
    useCleanup, useDebouncedState, useIsMounted, usePersistedState, useSafeState
} from './useStateHelpers';
