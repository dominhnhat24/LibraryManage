import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  onSearchPress?: () => void;
}

export function SearchBar({
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  onSearchPress,
  returnKeyType = 'search',
  ...inputProps
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, focused && styles.focused, containerStyle]}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        {...inputProps}
        returnKeyType={returnKeyType}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, inputStyle]}
      />
      {onSearchPress && (
        <Pressable accessibilityRole="button" accessibilityLabel="Tìm kiếm" onPress={onSearchPress} style={styles.submit}>
          <Text style={styles.submitText}>Tìm</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  focused: {
    borderColor: '#FF9F43',
    backgroundColor: '#FFFFFF',
  },
  icon: {
    color: '#94A3B8',
    fontSize: 18,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    color: '#334155',
    fontSize: 14,
    outlineWidth: 0,
  },
  submit: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: 9,
    borderRadius: 4,
    backgroundColor: '#FFF3E0',
  },
  submitText: {
    color: '#B94E0C',
    fontSize: 12,
    fontWeight: '700',
  },
});
