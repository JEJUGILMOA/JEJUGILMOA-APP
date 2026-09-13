/** 지도 탭 진행중 여행/목록 강제 재조회. MapScreen 포커스·구독에서 반영한다. */
type Listener = (seq: number) => void;

let seq = 0;
const listeners = new Set<Listener>();

export function requestMapTabRefresh(): number {
  seq += 1;
  listeners.forEach((listener) => listener(seq));
  return seq;
}

/** 현재 refresh 시퀀스 (포커스 시 MapScreen state와 동기화) */
export function getMapTabRefreshSeq(): number {
  return seq;
}

export function subscribeMapTabRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
