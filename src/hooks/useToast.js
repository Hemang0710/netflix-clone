import { toast } from 'sonner'

export function useToast() {
  return {
    success: (message, options = {}) => toast.success(message, options),
    error: (message, options = {}) => toast.error(message, options),
    loading: (message, options = {}) => toast.loading(message, options),
    promise: (promise, messages = {}) => toast.promise(promise, messages),
    info: (message, options = {}) => toast(message, options),
    dismiss: (id) => toast.dismiss(id),
  }
}
