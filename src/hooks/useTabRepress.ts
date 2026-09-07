import { useEffect, useRef } from 'react';

import { subscribeTabRepress } from '@/bridge/tabRepress';

/**
 * 이미 선택된 하단 탭을 다시 눌렀을 때 콜백을 실행한다.
 * `tabName`은 expo-router Tabs의 route name (`index` | `map` | `plan` | `record` | `my`)과 같아야 한다.
 */
export function useTabRepress(tabName: string, onRepress: () => void): void {
  const onRepressRef = useRef(onRepress);
  onRepressRef.current = onRepress;

  useEffect(() => {
    if (!tabName) return;
    return subscribeTabRepress((pressedTab) => {
      if (pressedTab !== tabName) return;
      onRepressRef.current();
    });
  }, [tabName]);
}
