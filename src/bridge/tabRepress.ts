type TabRepressListener = (tabName: string) => void;

const listeners = new Set<TabRepressListener>();

/** 같은 탭을 다시 눌렀을 때 구독 콜백 실행 */
export function emitTabRepress(tabName: string): void {
  listeners.forEach((listener) => listener(tabName));
}

export function subscribeTabRepress(listener: TabRepressListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
