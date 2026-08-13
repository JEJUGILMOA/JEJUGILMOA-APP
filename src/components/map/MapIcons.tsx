import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';

import type { MapMode, PlaceCategory } from '../../constants/map';

type IconProps = {
  color: ColorValue;
  size?: number;
};

function BaseSvg({
  size = 20,
  children,
}: {
  size?: number;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

/** Lucide: search */
export function SearchIcon({ color, size = 18 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
      <Path
        d="m21 21-4.3-4.3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: layers */
export function LayersIcon({ color, size = 18 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: locate-fixed */
export function LocateIcon({ color, size = 22 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M2 12h3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 12h3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 2v3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 19v3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="7" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
    </BaseSvg>
  );
}

/** Lucide: map */
export function MapModeIcon({ color, size = 20 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 5.764v15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 3.236v15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: map-pin */
export function MapPinIcon({ color, size = 20 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={2} />
    </BaseSvg>
  );
}

/** Lucide: navigation */
export function NavigationIcon({ color, size = 20 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M3.337 7.862a2.5 2.5 0 0 0 0 4.276l15.19 5.396a1.5 1.5 0 0 0 1.96-1.96L15.138 3.337a2.5 2.5 0 0 0-4.276 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m13 13 6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: flame */
export function FlameIcon({ color, size = 20 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: flag */
export function FlagIcon({ color, size = 16 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 22v-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: x */
export function CloseIcon({ color, size = 16 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M18 6 6 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m6 6 12 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: clock */
export function ClockIcon({ color, size = 16 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path
        d="M12 6v6l4 2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: play */
export function PlayIcon({ color, size = 16 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: arrow-up-right */
export function ArrowUpRightIcon({ color, size = 16 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M7 7h10v10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 17 17 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: utensils */
export function UtensilsIcon({ color, size = 20 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 2v20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: coffee */
export function CoffeeIcon({ color, size = 20 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M10 2v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 2v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: mountain */
export function MountainIcon({ color, size = 20 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="m8 3 4 8 5-5 5 15H2L8 3z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: star */
export function StarIcon({ color, size = 16 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

/** Lucide: layout-grid (전체) */
export function GridIcon({ color, size = 14 }: IconProps): React.JSX.Element {
  return (
    <BaseSvg size={size}>
      <Path
        d="M5 4h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 4h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 14h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 14h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseSvg>
  );
}

export function ModeOptionIcon({
  mode,
  color,
  size = 20,
}: {
  mode: MapMode;
  color: ColorValue;
  size?: number;
}): React.JSX.Element {
  switch (mode) {
    case 'general':
      return <MapModeIcon color={color} size={size} />;
    case 'plan':
      return <MapPinIcon color={color} size={size} />;
    case 'activeTrip':
      return <NavigationIcon color={color} size={size} />;
    case 'heatmap':
      return <FlameIcon color={color} size={size} />;
  }
}

export function CategoryIcon({
  category,
  color,
  size = 14,
}: {
  category: PlaceCategory;
  color: ColorValue;
  size?: number;
}): React.JSX.Element {
  switch (category) {
    case 'all':
      return <GridIcon color={color} size={size} />;
    case 'food':
      return <UtensilsIcon color={color} size={size} />;
    case 'cafe':
      return <CoffeeIcon color={color} size={size} />;
    case 'spot':
      return <MountainIcon color={color} size={size} />;
    case 'favorite':
      return <StarIcon color={color} size={size} />;
  }
}
