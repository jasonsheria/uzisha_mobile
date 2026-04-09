import React from 'react';
import { ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const HomeIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="home" size={size} color={color} />
);

export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="magnify" size={size} color={color} />
);

export const HeartIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="heart" size={size} color={color} />
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="calendar" size={size} color={color} />
);

export const UserIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="account" size={size} color={color} />
);

export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="plus-circle" size={size} color={color} />
);

export const MenuIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="menu" size={size} color={color} />
);

export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="check-circle" size={size} color={color} />
);

export const XIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="close-circle" size={size} color={color} />
);

export const StarIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="star" size={size} color={color} />
);

export const MapPinIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="map-marker" size={size} color={color} />
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="phone" size={size} color={color} />
);

export const MailIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="email" size={size} color={color} />
);

export const FilterIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="tune" size={size} color={color} />
);

export const BackIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="chevron-left" size={size} color={color} />
);

export const ChatIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="message-text" size={size} color={color} />
);

export const MapIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="map-search" size={size} color={color} />
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="cog" size={size} color={color} />
);

export const BellIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="bell" size={size} color={color} />
);

export const MoonIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="moon-waning-crescent" size={size} color={color} />
);

export const SunIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="white-balance-sunny" size={size} color={color} />
);

export const BookmarkIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <MaterialCommunityIcons name="bookmark" size={size} color={color} />
);
