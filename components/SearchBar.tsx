import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  useColorScheme,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import Colors from '@/constants/Colors';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  onSearch?: (text: string) => void;
  style?: ViewStyle;
  placeholder?: string;
  icon?: React.ReactNode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  style,
  placeholder = 'Rechercher...',
  icon,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconLeft}>{icon}</View>}
      <TextInput
        style={[styles.input, !icon && { paddingLeft: 16 }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray500}
        onChangeText={onSearch}
        {...props}
      />
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark 
        ? 'rgba(30, 41, 59, 0.8)' 
        : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark 
        ? 'rgba(148, 163, 184, 0.15)' 
        : 'rgba(226, 232, 240, 0.6)',
      paddingRight: 14,
      paddingLeft: 4,
      height: 50,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.15 : 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: isDark ? Colors.dark.text : Colors.light.text,
      paddingVertical: 12,
      paddingHorizontal: 12,
      fontWeight: '500',
    },
    iconLeft: {
      paddingLeft: 12,
      paddingRight: 4,
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 18,
    },
  });
