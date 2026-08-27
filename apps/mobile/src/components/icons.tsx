import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

/**
 * The same icon paths the web app draws, so the two surfaces stay visually
 * identical. Kept as SVG rather than an icon font for that reason.
 */
interface IconProps {
  size?: number;
  /** `ColorValue` rather than `string`: navigator callbacks hand back platform colors. */
  color: ColorValue;
}

function Icon({ size = 22, color, children }: IconProps & { children: ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export const HomeIcon = (props: IconProps) => (
  <Icon {...props}>
    <Path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z" />
  </Icon>
);

export const SparkIcon = (props: IconProps) => (
  <Icon {...props}>
    <Path d="M12 3l1.9 4.9L19 9.8l-5.1 1.9L12 17l-1.9-5.3L5 9.8l5.1-1.9z" />
    <Path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </Icon>
);

export const CalendarIcon = (props: IconProps) => (
  <Icon {...props}>
    <Rect x="3" y="5" width="18" height="16" rx="3" />
    <Path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
);

export const LibraryIcon = (props: IconProps) => (
  <Icon {...props}>
    <Rect x="3" y="4" width="7" height="7" rx="2" />
    <Rect x="14" y="4" width="7" height="7" rx="2" />
    <Rect x="3" y="14" width="7" height="7" rx="2" />
    <Rect x="14" y="14" width="7" height="7" rx="2" />
  </Icon>
);

export const MoreIcon = (props: IconProps) => (
  <Icon {...props}>
    <Circle cx="5" cy="12" r="1.4" />
    <Circle cx="12" cy="12" r="1.4" />
    <Circle cx="19" cy="12" r="1.4" />
  </Icon>
);

export const ClockIcon = (props: IconProps) => (
  <Icon {...props}>
    <Circle cx="12" cy="12" r="8.5" />
    <Path d="M12 7.5V12l3 1.8" />
  </Icon>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <Path d="M9 5l7 7-7 7" />
  </Icon>
);

export const ApexMarkIcon = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3l8 18h-4.2L12 11.6 8.2 21H4z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
    <Path d="M9.6 15h4.8" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);
