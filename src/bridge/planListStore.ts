import type { TravelPlanSummary } from '../api/plans';

export type PlanListState = {
  plans: TravelPlanSummary[];
  loading: boolean;
  error: string | null;
  updatedAt: number;
};

type Listener = (state: PlanListState) => void;

const listeners = new Set<Listener>();

let state: PlanListState = {
  plans: [],
  loading: false,
  error: null,
  updatedAt: 0,
};

function emit(): void {
  listeners.forEach((listener) => listener(state));
}

export function getPlanListState(): PlanListState {
  return state;
}

export function subscribePlanList(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

/** 웹 → 네이티브 SET_PLAN_SUMMARIES */
export function setPlanListFromWeb(
  plans: TravelPlanSummary[],
  error?: string | null,
): void {
  state = {
    plans,
    loading: false,
    error: error ?? null,
    updatedAt: Date.now(),
  };
  emit();
}

/** 네이티브가 웹에 목록을 요청하기 직전 */
export function markPlanListLoading(): void {
  state = {
    ...state,
    loading: true,
    error: null,
  };
  emit();
}

export function clearPlanList(): void {
  state = {
    plans: [],
    loading: false,
    error: null,
    updatedAt: Date.now(),
  };
  emit();
}
