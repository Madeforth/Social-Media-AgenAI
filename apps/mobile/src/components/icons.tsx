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
      d="M4 20V4l8 10 8-10v16"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Google's "G" mark. Brand colours are fixed, unlike the stroke icons above. */
export const GoogleIcon = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z"
    />
    <Path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74z" />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.1C6.22 6.87 8.87 4.75 12 4.75z"
    />
  </Svg>
);
