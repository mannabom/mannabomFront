<<<<<<< HEAD
// src/screens/ProfileSetupScreen.tsx
import React, { useState, useEffect } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
<<<<<<< HEAD
import Slider from '@react-native-community/slider';
import { getProfileId } from '../../utils/AuthUtils';
import apiClient from '../../services/apiClient';
import { SmokingHabit, DrinkingHabit } from '../../types/Profile';
import { API_ENDPOINTS_LIST } from '../../config/api';
=======

import Physical from '../../components/profile/Physical';
import Region from '../../components/profile/Region';
import MBTI from '../../components/profile/MBTI';
import TriStateSlider from '../../components/common/TriStateSlider'; // 아까 만든 흡연/음주 슬라이더
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8

export default function ProfileSetupScreen({ navigation }: any) {
  const [smoking, setSmoking] = useState<number>(0); // 0: 비흡연, 1: 전자담배, 2: 일반담배
  const [drinking, setDrinking] = useState<number>(0); // 0: 안마심, 1: 가끔, 2: 자주

<<<<<<< HEAD
const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  onProfileComplete,
}) => {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedMBTI, setSelectedMBTI] = useState<string[]>(['', '', '', '']);
  const [smoking, setSmoking] = useState<SmokingHabit | null>(null);
  const [drinking, setDrinking] = useState<DrinkingHabit | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isBodyTypeDropdownOpen, setIsBodyTypeDropdownOpen] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      setProfileId(id);
    };
    fetchProfileId();
  }, []);

  const bodyTypeOptions = ['마름', '보통', '통통', '근육질'];
  const regionOptions = ['서울특별시', '경기도', '인천광역시', '부산광역시'];
  const districtOptions: Record<string, string[]> = {
    서울특별시: ['강남구', '서초구', '송파구', '강서구'],
    경기도: ['수원시', '성남시', '고양시', '안양시'],
    인천광역시: ['연수구', '남동구', '부평구', '서구'],
    부산광역시: ['해운대구', '부산진구', '동래구', '서면구'],
  };
  const mbtiOptions = [
    ['E', 'I'],
    ['S', 'N'],
    ['F', 'T'],
    ['J', 'P'],
  ];

  const handleMBTISelect = (index: number, value: string) => {
    const newMBTI = [...selectedMBTI];
    newMBTI[index] = value;
    setSelectedMBTI(newMBTI);
  };

  const isFormValid = () => {
    return (
      height.length > 0 &&
      bodyType.length > 0 &&
      region.length > 0 &&
      district.length > 0 &&
      selectedMBTI.every(item => item.length > 0) &&
      smoking !== null &&
      drinking !== null
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || isLoading || !profileId) {
      Alert.alert('알림', '모든 항목을 올바르게 입력해주세요.');
      return;
    }

    setIsLoading(true);

    const profileData = {
      profileId: profileId,
      height: parseInt(height, 10),
      bodyType: bodyType,
      region: {
        sido: region,
        sigungu: district,
      },
      mbti: selectedMBTI.join(''),
      smokingHabit: smoking,
      drinkingHabit: drinking,
    };

    try {
      const response = await apiClient.post(
        API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP,
        profileData,
      );

      if (response.data.success) {
        Alert.alert('프로필 설정 완료', '다음 단계로 진행합니다.', [
          { text: '확인', onPress: onProfileComplete },
        ]);
      } else {
        Alert.alert(
          '오류',
          response.data.message || '프로필 설정 중 문제가 발생했습니다.',
        );
      }
    } catch (error) {
      console.error('프로필 설정 API 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 흡연 슬라이더 값을 숫자로 변환하는 헬퍼 함수
  const getSmokingValue = () => {
    if (smoking === SmokingHabit.NON_SMOKER) return 0;
    if (smoking === SmokingHabit.VAPE_ONLY) return 1;
    if (smoking === SmokingHabit.REGULAR_SMOKER) return 2;
    return 0; // 기본값
  };

  // 음주 슬라이더 값을 숫자로 변환하는 헬퍼 함수
  const getDrinkingValue = () => {
    if (drinking === DrinkingHabit.NON_DRINKER) return 0;
    if (drinking === DrinkingHabit.OCCASIONAL_DRINKER) return 1;
    if (drinking === DrinkingHabit.FREQUENT_DRINKER) return 2;
    return 0; // 기본값
  };

  // 숫자값을 흡연 습관으로 변환하는 헬퍼 함수
  const setSmokingFromValue = (value: number) => {
    switch (value) {
      case 0:
        setSmoking(SmokingHabit.NON_SMOKER);
        break;
      case 1:
        setSmoking(SmokingHabit.VAPE_ONLY);
        break;
      case 2:
        setSmoking(SmokingHabit.REGULAR_SMOKER);
        break;
      default:
        setSmoking(SmokingHabit.NON_SMOKER);
    }
  };

  // 숫자값을 음주 습관으로 변환하는 헬퍼 함수
  const setDrinkingFromValue = (value: number) => {
    switch (value) {
      case 0:
        setDrinking(DrinkingHabit.NON_DRINKER);
        break;
      case 1:
        setDrinking(DrinkingHabit.OCCASIONAL_DRINKER);
        break;
      case 2:
        setDrinking(DrinkingHabit.FREQUENT_DRINKER);
        break;
      default:
        setDrinking(DrinkingHabit.NON_DRINKER);
    }
  };

  // 흡연 습관을 텍스트로 변환하는 헬퍼 함수
  const getSmokingText = () => {
    switch (smoking) {
      case SmokingHabit.NON_SMOKER:
        return '비흡연';
      case SmokingHabit.VAPE_ONLY:
        return '전자 담배';
      case SmokingHabit.REGULAR_SMOKER:
        return '일반 담배';
      default:
        return '';
    }
  };

  // 음주 습관을 텍스트로 변환하는 헬퍼 함수
  const getDrinkingText = () => {
    switch (drinking) {
      case DrinkingHabit.NON_DRINKER:
        return '안 마심';
      case DrinkingHabit.OCCASIONAL_DRINKER:
        return '가끔 음주';
      case DrinkingHabit.FREQUENT_DRINKER:
        return '자주 음주';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>1 신체 프로필</Text>

          {/* 키/체형 입력 */}
          <View style={[styles.section, styles.row]}>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="키"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <Text style={styles.unit}>cm</Text>
            </View>
            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={[
                  styles.dropdownHeader,
                  isBodyTypeDropdownOpen && styles.dropdownHeaderActive,
                ]}
                onPress={() =>
                  setIsBodyTypeDropdownOpen(!isBodyTypeDropdownOpen)
                }
              >
                <Text
                  style={[
                    styles.dropdownHeaderText,
                    bodyType === '' && { color: '#999' },
                  ]}
                >
                  {bodyType || '체형'}
                </Text>
              </TouchableOpacity>
              {isBodyTypeDropdownOpen && (
                <View style={styles.dropdownList}>
                  {bodyTypeOptions.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setBodyType(option);
                        setIsBodyTypeDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* 지역 선택 */}
          <Text style={styles.sectionTitle}>지역</Text>
          <View style={[styles.section, styles.row]}>
            <View style={styles.locationDropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.dropdownHeader,
                  isRegionDropdownOpen && styles.dropdownHeaderActive,
                ]}
                onPress={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              >
                <Text
                  style={[
                    styles.dropdownHeaderText,
                    region === '' && { color: '#999' },
                  ]}
                >
                  {region || '시/도'}
                </Text>
              </TouchableOpacity>
              {isRegionDropdownOpen && (
                <View style={styles.dropdownList}>
                  {regionOptions.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setRegion(option);
                        setDistrict('');
                        setIsRegionDropdownOpen(false);
                        setIsDistrictDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.locationDropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.dropdownHeader,
                  isDistrictDropdownOpen && styles.dropdownHeaderActive,
                ]}
                onPress={() =>
                  region && setIsDistrictDropdownOpen(!isDistrictDropdownOpen)
                }
              >
                <Text
                  style={[
                    styles.dropdownHeaderText,
                    district === '' && { color: '#999' },
                  ]}
                >
                  {district || '구/군'}
                </Text>
              </TouchableOpacity>
              {isDistrictDropdownOpen && region && (
                <View style={styles.dropdownList}>
                  {districtOptions[region]?.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setDistrict(option);
                        setIsDistrictDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* MBTI 선택 */}
          <Text style={styles.sectionTitle}>MBTI (필수)</Text>
          <View style={styles.mbtiGrid}>
            {mbtiOptions.map((options, index) => (
              <View key={index} style={styles.mbtiRow}>
                {options.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.mbtiButton,
                      selectedMBTI[index] === option &&
                        styles.mbtiButtonSelected,
                    ]}
                    onPress={() => handleMBTISelect(index, option)}
                  >
                    <Text
                      style={[
                        styles.mbtiButtonText,
                        selectedMBTI[index] === option
                          ? styles.mbtiButtonTextSelected
                          : styles.mbtiButtonTextUnselected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* 흡연 슬라이더 */}
          <Text style={styles.sectionTitle}>흡연</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>비흡연</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={2}
              step={1}
              value={getSmokingValue()}
              onSlidingComplete={setSmokingFromValue}
              minimumTrackTintColor="#FF6B6B"
              maximumTrackTintColor="#D3D3D3"
              thumbTintColor="#FF6B6B"
            />
            <Text style={styles.sliderLabel}>일반 담배</Text>
          </View>
          <Text style={styles.sliderValue}>{getSmokingText()}</Text>

          {/* 음주 슬라이더 */}
          <Text style={styles.sectionTitle}>음주</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>안 마심</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={2}
              step={1}
              value={getDrinkingValue()}
              onSlidingComplete={setDrinkingFromValue}
              minimumTrackTintColor="#FF6B6B"
              maximumTrackTintColor="#D3D3D3"
              thumbTintColor="#FF6B6B"
            />
            <Text style={styles.sliderLabel}>자주 음주</Text>
          </View>
          <Text style={styles.sliderValue}>{getDrinkingText()}</Text>

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isFormValid() && !isLoading
                ? styles.submitButtonActive
                : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isLoading}
          >
            <Text
              style={[
                styles.submitButtonText,
                isFormValid() && !isLoading
                  ? styles.submitButtonTextActive
                  : styles.submitButtonTextDisabled,
              ]}
            >
              {isLoading ? '저장 중...' : '다음'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
=======
  const handleNext = () => {
    console.log({
      smoking,
      drinking,
    });
    navigation.navigate('NextScreen'); // 다음 스크린으로 이동
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 신체 프로필 */}
      <View style={{ marginBottom: 100 }}>
        <Physical />
      </View>

      {/* 지역 */}
      <View style={{ marginBottom: 140 }}>
        <Region />
      </View>

      {/* MBTI */}
      <MBTI />

      {/* 흡연 */}
      <View>
        <Text style={styles.sectionTitle}>흡연</Text>
        <TriStateSlider
          labels={['비흡연', '전자 담배', '일반 담배']}
          value={smoking as any}
          onValueChange={setSmoking}
        />
      </View>

      {/* 음주 */}
      <View style={{ marginTop: 30 }}>
        <Text style={styles.sectionTitle}>음주</Text>
        <TriStateSlider
          labels={['안마심', '가끔 음주', '자주 음주']}
          value={drinking as any}
          onValueChange={setDrinking}
        />
      </View>

      {/* 다음 버튼 */}
      <View style={styles.nextBtnWrapper}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>다음</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
=======
    backgroundColor: '#fff',
    paddingHorizontal: 16,
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
    color: '#102A43',
    marginBottom: 3,
  },
<<<<<<< HEAD
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333333',
  },
  unit: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666666',
  },
  dropdownHeader: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownHeaderActive: {
    borderColor: '#FF6B6B',
  },
  dropdownHeaderText: {
    fontSize: 16,
    color: '#333333',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 10,
    marginTop: 5,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  locationDropdownContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 5,
  },
  mbtiGrid: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mbtiRow: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
  },
  mbtiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
=======
  nextBtnWrapper: {
    marginTop: 32,
    alignItems: 'center',
  },
  nextBtn: {
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8
    backgroundColor: '#FFB6C1',
    width: 125,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
<<<<<<< HEAD
  mbtiButtonSelected: {
    backgroundColor: '#FF6B6B',
  },
  mbtiButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mbtiButtonTextSelected: {
    color: '#FFFFFF',
  },
  mbtiButtonTextUnselected: {
    color: '#FFFFFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666666',
    width: 60,
    textAlign: 'center',
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: -5,
    marginBottom: 15,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#999999',
  },
});

export default ProfileSetupScreen;
=======
  nextBtnText: {
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.23,
    textAlign: 'center',
    color: '#000',
  },
});
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8
