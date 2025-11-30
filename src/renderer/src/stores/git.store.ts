import { useReactive, useMemoizedFn } from 'ahooks'

/**
 * Git状态存储
 * 使用ahooks的useReactive进行状态管理
 */
export const useGitStore = () => {
  const state = useReactive({
    isLoading: false,
    error: null as Error | null,
  })

  const setLoading = useMemoizedFn((loading: boolean) => {
    state.isLoading = loading
  })

  const setError = useMemoizedFn((error: Error | null) => {
    state.error = error
  })

  return {
    state,
    setLoading,
    setError,
  }
}