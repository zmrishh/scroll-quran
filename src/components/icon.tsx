import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'heart'
  | 'bookmark'
  | 'share'
  | 'user'
  | 'check'
  | 'x'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-right'
  | 'lock'
  | 'book'
  | 'note'
  | 'feed'
  | 'search'
  | 'chevron-left'
  | 'reset';

type Props = { name: IconName; size?: number; color: string; filled?: boolean; strokeWidth?: number };

export function Icon({ name, size = 24, color, filled = false, strokeWidth = 1.8 }: Props) {
  const s = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  const f = filled ? { ...s, fill: color } : s;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'heart' && (
        <Path {...f} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      )}
      {name === 'bookmark' && <Path {...f} d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />}
      {name === 'share' && (
        <>
          <Path {...s} d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <Path {...s} d="m16 6-4-4-4 4" />
          <Path {...s} d="M12 2v13" />
        </>
      )}
      {name === 'user' && (
        <>
          <Path {...s} d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <Circle {...f} cx={12} cy={7} r={4} />
        </>
      )}
      {name === 'check' && <Path {...s} d="M20 6 9 17l-5-5" />}
      {name === 'x' && (
        <>
          <Path {...s} d="M18 6 6 18" />
          <Path {...s} d="m6 6 12 12" />
        </>
      )}
      {name === 'chevron-up' && <Path {...s} d="m18 15-6-6-6 6" />}
      {name === 'chevron-down' && <Path {...s} d="m6 9 6 6 6-6" />}
      {name === 'chevron-right' && <Path {...s} d="m9 18 6-6-6-6" />}
      {name === 'lock' && (
        <>
          <Rect {...f} x={3} y={11} width={18} height={11} rx={2} />
          <Path {...s} d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      )}
      {name === 'book' && (
        <>
          <Path {...s} d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <Path {...s} d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </>
      )}
      {name === 'note' && (
        <>
          <Path {...s} d="M12 20h9" />
          <Path {...s} d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </>
      )}
      {name === 'feed' && (
        <>
          <Path {...s} d="M7 2h10" />
          <Rect {...f} x={4} y={6} width={16} height={16} rx={3} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle {...s} cx={11} cy={11} r={7} />
          <Path {...s} d="m20 20-3.5-3.5" />
        </>
      )}
      {name === 'chevron-left' && <Path {...s} d="m15 18-6-6 6-6" />}
      {name === 'reset' && (
        <>
          <Path {...s} d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <Path {...s} d="M3 3v5h5" />
        </>
      )}
    </Svg>
  );
}
