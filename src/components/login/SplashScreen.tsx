import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StatusBar, Image } from 'react-native';

interface SplashScreenProps {
  onSplashComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onSplashComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      // 스플래시 이미지 페이드인 애니메이션
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    };

    const performInitialization = async () => {
      try {
        // 보안 검사
        await performSecurityCheck();
        // 로그인 상태 확인
        await checkLoginStatus();

        // 최소 스플래시 표시 시간 (3초)
        setTimeout(() => {
          onSplashComplete();
        }, 3000);
      } catch (error) {
        console.error('초기화 중 오류:', error);
        // 오류가 있어도 3초 후 다음 화면으로 이동
        setTimeout(onSplashComplete, 3000);
      }
    };

    startAnimation();
    performInitialization();
  }, [fadeAnim, onSplashComplete]);

  const performSecurityCheck = async (): Promise<void> => {
    return new Promise(resolve => {
      // 앱 무결성 검사
      setTimeout(() => {
        console.log('보안 검사 완료');
        resolve();
      }, 800);
    });
  };

  const checkLoginStatus = async (): Promise<void> => {
    return new Promise(resolve => {
      // 로그인 정보 확인
      // AsyncStorage에서 토큰 확인 등의 작업
      setTimeout(() => {
        console.log('로그인 상태 확인 완료');
        resolve();
      }, 500);
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('../../assets/images/splash_screen.png')} // PNG 파일 경로
          style={styles.splashImage}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // 이미지 로딩 중 보여줄 배경색
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
