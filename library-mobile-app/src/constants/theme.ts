/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Tập trung màu giao diện, kiểu chữ và khoảng cách dùng chung cho toàn bộ ứng dụng.
import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  // Màu nền và chữ theo hai chế độ sáng/tối.
  light: {
    text: '#633617',
    background: '#FFF8F1',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFF0DF',
    textSecondary: '#947B68',
  },
  dark: {
    text: '#FFF3E0',
    background: '#2C1E15',
    backgroundElement: '#3B291D',
    backgroundSelected: '#684126',
    textSecondary: '#D0AE92',
  },
} as const;

export const BrandColors = {
  // Màu nhận diện thương hiệu được dùng độc lập với bảng màu theo chế độ.
  primary: '#FF9F43',
  primaryStrong: '#E97824',
  background: '#FFF3E0',
  backgroundSoft: '#FFF8F1',
  text: '#633617',
  textStrong: '#E65100',
  border: '#F2DFCC',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  // Thang khoảng cách theo đơn vị pixel để các thành phần giữ nhịp bố cục nhất quán.
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
