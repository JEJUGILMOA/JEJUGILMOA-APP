/** FE PageHeader(PageHeader.css.ts, vars.size)와 맞춘 토큰 */
export const PageHeaderTokens = {
  height: 56,
  touch: 44,
  titleSize: 20,
  titleWeight: '700' as const,
  titleColor: '#25252D',
  background: '#FFFFFF',
  muted: '#9C9C97',
  mutedPressed: '#5B5C60',
  primary: '#17783C',
  gap: 8,
} as const;

export type HeaderActionTone = 'default' | 'muted' | 'primary';
export type HeaderActionIcon = 'more' | 'bookmark';

export type HeaderAction = {
  id: string;
  label: string;
  tone?: HeaderActionTone;
  icon?: HeaderActionIcon;
};
