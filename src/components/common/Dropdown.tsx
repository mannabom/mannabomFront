import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';

interface DropdownProps {
  options: string[];
  placeholder?: string;
  value?: string | null;
  onSelect: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  placeholder,
  value,
  onSelect,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.dropdownBox}>
      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setVisible(!visible)}
      >
        <Text style={[styles.dropdownText, !value && { color: '#ABABAB' }]}>
          {value ?? placeholder}
        </Text>
        <Text style={styles.arrow}>{visible ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {visible && (
        <View style={styles.dropdownList}>
          <FlatList
            data={options}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownBox: {
    width: 125,
    height: 36,
  },
  dropdownBtn: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#AFB1B6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontFamily: 'Work Sans',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: '#000',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  arrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownList: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#AFB1B6',
    borderRadius: 8,
    backgroundColor: '#fff',
    zIndex: 10,
    maxHeight: 124,
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontFamily: 'Work Sans',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: '#000',
  },
});

export default Dropdown;
