import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@gilmoa/map_recent_searches';
const MAX_RECENT = 8;

export async function loadRecentMapSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export async function saveRecentMapSearches(terms: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(terms.slice(0, MAX_RECENT)));
  } catch {
    // ignore persistence errors
  }
}

/** 맨 앞에 추가하고 중복 제거 */
export function prependRecentSearch(prev: string[], term: string): string[] {
  const next = term.trim();
  if (!next) return prev;
  return [next, ...prev.filter((item) => item !== next)].slice(0, MAX_RECENT);
}
