import type { NativeToastState } from './components/WebToast'
import { HIDDEN_NATIVE_TOAST } from './components/WebToast'

let pending: NativeToastState | null = null

/** 화면 전환 직전 토스트를 넘길 때 사용. 다음 WebView 포커스에서 take 한다. */
export function setPendingNativeToast(
  input: Pick<NativeToastState, 'message' | 'kind'> & Partial<NativeToastState>,
) {
  pending = {
    ...HIDDEN_NATIVE_TOAST,
    visible: true,
    id: input.id ?? `pending-${Date.now()}`,
    kind: input.kind,
    message: input.message,
    duration: input.duration ?? 2000,
    actions: input.actions ?? [],
  }
}

export function takePendingNativeToast(): NativeToastState | null {
  const next = pending
  pending = null
  return next
}
