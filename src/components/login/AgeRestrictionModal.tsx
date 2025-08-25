// src/components/AgeRestrictionModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  BackHandler,
} from 'react-native';

const { width } = Dimensions.get('window');

interface AgeRestrictionModalProps {
  visible: boolean;
  onClose?: () => void; // optional로 변경
}

const AgeRestrictionModal: React.FC<AgeRestrictionModalProps> = ({
  visible,
}) => {
  const handleAppExit = () => {
    // 앱 완전 종료
    BackHandler.exitApp();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleAppExit}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.content}>
            {/* 메시지 */}
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>
                나이 조건을 충족하지 않아 앱을 이용할 수 없습니다 😭
              </Text>
            </View>

            {/* 앱 종료하기 버튼 */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleAppExit}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>앱 종료하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    width: width * 0.8,
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  stepContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  messageContainer: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AgeRestrictionModal;
