import Colors from './Colors';
import { PropertyCategories, PropertyTypeNames } from './PropertyCategories';

export { Colors, PropertyCategories, PropertyTypeNames };

// Styles globaux
export const GlobalStyles = {
  containerPadding: 16,
  borderRadius: 12,
  borderRadiusLarge: 16,
  shadowSmall: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowMedium: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  shadowLarge: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Espacements
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Typographie
export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 20, fontWeight: '700' as const },
  h4: { fontSize: 18, fontWeight: '700' as const },
  h5: { fontSize: 16, fontWeight: '700' as const },
  h6: { fontSize: 14, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  small: { fontSize: 11, fontWeight: '400' as const },
};
