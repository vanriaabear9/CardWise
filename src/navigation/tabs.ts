import type { IconName } from '@/types';

export interface TabConfig {
  /** Route file name inside src/app/(tabs)/ ('index' is the Home route). */
  name: 'index' | 'create' | 'history' | 'profile';
  /** Label shown under the icon. */
  title: string;
  /** Icon when the tab is selected (filled). */
  activeIcon: IconName;
  /** Icon when the tab is not selected (outline). */
  inactiveIcon: IconName;
}

/** The four main tabs, in the order they appear in the bottom bar. */
export const TABS: readonly TabConfig[] = [
  { name: 'index', title: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { name: 'create', title: 'Create', activeIcon: 'add-circle', inactiveIcon: 'add-circle-outline' },
  { name: 'history', title: 'History', activeIcon: 'time', inactiveIcon: 'time-outline' },
  { name: 'profile', title: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
];
