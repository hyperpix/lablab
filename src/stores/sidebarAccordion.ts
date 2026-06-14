import { reactive } from 'vue'

// Shared accordion state: exactly max 2 sidebar sections expanded at once
const expandedSections = reactive<Record<string, boolean>>({
  Main: true,
  HRM: true,
  'Billing & Finance': false,
  Operations: false,
  System: false,
})

export function getExpandedSections(): Record<string, boolean> {
  return expandedSections
}

export function toggleSidebarSection(label: string): void {
  if (label === 'Main') return // Main section cannot be toggled

  if (expandedSections[label]) {
    expandedSections[label] = false
  } else {
    const expandedCount = Object.values(expandedSections).filter(Boolean).length
    if (expandedCount >= 2) {
      // Collapse the first expanded section (oldest key insertion order)
      for (const key of Object.keys(expandedSections)) {
        if (expandedSections[key] && key !== label && key !== 'Main') {
          expandedSections[key] = false
          break
        }
      }
    }
    expandedSections[label] = true
  }
}
