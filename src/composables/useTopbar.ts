import { ref } from 'vue'

export interface TopbarAction {
  label: string
  onClick: () => void
  variant?: string
  theme?: string
}

export interface ToolbarConfig {
  searchPlaceholder?: string
  filter?: boolean
  sort?: boolean
  refresh?: boolean
  onRefresh?: () => void
}

// Module-level singletons — shared across all callers
const actions       = ref<TopbarAction[]>([])
const toolbarConfig = ref<ToolbarConfig | null>(null)
const toolbarSearch = ref('')

export function useTopbar() {
  function setActions(newActions: TopbarAction[]) {
    actions.value = newActions
  }

  function setToolbar(cfg: ToolbarConfig) {
    toolbarConfig.value = cfg
    toolbarSearch.value = ''
  }

  function clearAll() {
    actions.value       = []
    toolbarConfig.value = null
    toolbarSearch.value = ''
  }

  return { actions, setActions, toolbarConfig, toolbarSearch, setToolbar, clearAll }
}
