declare module 'frappe-ui' {
  import { DefineComponent } from 'vue'

  export const Button: DefineComponent<
    {
      variant?: 'solid' | 'outline' | 'ghost' | 'minimal'
      theme?: 'primary' | 'red' | 'gray' | 'warning' | 'emerald' | 'info'
      size?: 'sm' | 'md' | 'lg'
      loading?: boolean
      disabled?: boolean
    },
    {},
    any,
    any,
    any,
    any,
    any,
    any,
    {
      default: () => any
      prefix: () => any
      suffix: () => any
    }
  >

  export const Dialog: DefineComponent<
    {
      modelValue: boolean
      options?: {
        title?: string
        size?: 'sm' | 'md' | 'lg' | 'xl'
        onClose?: () => void
      }
    },
    {},
    any,
    any,
    any,
    any,
    any,
    any,
    {
      body: () => any
      actions: () => any
    }
  >

  export const Badge: DefineComponent<{
    variant?: 'solid' | 'subtle' | 'outline'
    theme?: 'primary' | 'red' | 'gray' | 'warning' | 'emerald' | 'info' | 'blue'
    size?: 'sm' | 'md' | 'lg'
  }>

  export const Alert: DefineComponent<{
    title?: string
    theme?: 'info' | 'success' | 'warning' | 'danger'
    variant?: 'solid' | 'subtle'
  }>

  export const LoadingIndicator: DefineComponent<{}>
  export const Textarea: DefineComponent<{}>
  export const Switch: DefineComponent<{}>
  export const FormControl: DefineComponent<{}>
  export const Select: DefineComponent<{}>
  export const FeatherIcon: DefineComponent<{}>
  export const Dropdown: DefineComponent<{}>
  export const Tooltip: DefineComponent<{}>
  export const Card: DefineComponent<{}>
  export const Checkbox: DefineComponent<{}>
}
