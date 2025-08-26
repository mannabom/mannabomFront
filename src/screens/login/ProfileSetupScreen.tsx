import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';

import { getProfileId } from '../../utils/AuthUtils';
import apiClient from '../../services/apiClient';
import { SmokingHabit, DrinkingHabit } from '../../types/Profile';
import { API_ENDPOINTS_LIST } from '../../config/api';

interface ProfileSetupScreenProps {
  onProfileComplete: () => void;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  onProfileComplete,
}) => {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedMBTI, setSelectedMBTI] = useState<string[]>(['', '', '', '']);
  const [smoking, setSmoking] = useState<SmokingHabit | null>(null);
  const [drinking, setDrinking] = useState<DrinkingHabit | null>(null);
  const [gender, setGender] = useState(''); // gender 상태 추가
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      setProfileId(id);
    };
    fetchProfileId();
  }, []);

  const genderOptions = ['남성', '여성', '기타'];
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
  const smokingOptions = [
    SmokingHabit.NON_SMOKER,
    SmokingHabit.VAPE_ONLY,
    SmokingHabit.REGULAR_SMOKER,
  ];
  const drinkingOptions = [
    DrinkingHabit.NON_DRINKER,
    DrinkingHabit.OCCASIONAL_DRINKER,
    DrinkingHabit.FREQUENT_DRINKER,
  ];

  const handleMBTISelect = (index: number, value: string) => {
    const newMBTI = [...selectedMBTI];
    newMBTI[index] = value;
    setSelectedMBTI(newMBTI);
  };

  const handleSmokingSelect = (value: SmokingHabit) => {
    setSmoking(value);
  };

  const handleDrinkingSelect = (value: DrinkingHabit) => {
    setDrinking(value);
  };

  const isFormValid = () => {
    return (
      age.length > 0 &&
      height.length > 0 &&
      bodyType.length > 0 &&
      gender.length > 0 && // gender 유효성 검사 추가
      region.length > 0 &&
      district.length > 0 &&
      selectedMBTI.every(item => item.length > 0) &&
      smoking !== null &&
      drinking !== null
    );
  };

  const handleSubmit = async () => {
    // if (!isFormValid() || isLoading || !profileId) {
    //   Alert.alert('알림', '모든 항목을 올바르게 입력해주세요.');
    //   return;
    // }
    // setIsLoading(true);
    // const profileData = {
    //   profileId: profileId,
    //   height: parseInt(height, 10),
    //   bodyType: bodyType,
    //   region: {
    //     sido: region,
    //     sigungu: district,
    //   },
    //   mbti: selectedMBTI.join(''),
    //   smokingHabit: smoking,
    //   drinkingHabit: drinking,
    //   // DTO에 없는 항목들은 제거 또는 빈 값으로 처리
    //   selfIntroduction: '',
    //   attractivePartnerTrait: '',
    //   desiredPartnerTrait: '',
    //   optionalAnswers: {},
    //   relationshipChoices: {},
    // };
    // try {
    //   const response = await apiClient.post(
    //     API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP,
    //     profileData,
    //   );
    //   if (response.data.success) {
    //     Alert.alert('프로필 설정 완료', '다음 단계로 진행합니다.', [
    //       { text: '확인', onPress: onProfileComplete },
    //     ]);
    //   } else {
    //     Alert.alert(
    //       '오류',
    //       response.data.message || '프로필 설정 중 문제가 발생했습니다.',
    //     );
    //   }
    // } catch (error) {
    //   console.error('프로필 설정 API 오류:', error);
    //   Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    // } finally {
    //   setIsLoading(false);
    // }
    onProfileComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>신체 프로필</Text>

          {/* 나이/키/몸무게 입력 섹션 */}
          <View style={styles.section}>
            <View style={styles.inputGroupContainer}>
              {/* 나이 입력 */}
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.inputRightMargin]}
                  placeholder="나이"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.unit}>세</Text>
              </View>

              {/* 키 입력 */}
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.inputRightMargin]}
                  placeholder="키"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.unit}>cm</Text>
              </View>

              {/* 몸무게 입력 */}
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.inputRightMargin]}
                  placeholder="몸무게"
                  value={bodyType}
                  onChangeText={setBodyType}
                  maxLength={3}
                />
                <Text style={styles.unit}>kg</Text>
              </View>
            </View>
          </View>

          {/* 성별 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>성별</Text>
            <View style={styles.genderContainer}>
              {genderOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderButton,
                    gender === option && styles.genderButtonSelected,
                  ]}
                  onPress={() => setGender(option)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === option && styles.genderTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 지역 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지역</Text>
            <View style={styles.row}>
              <View style={styles.regionContainer}>
                <Text style={styles.dropdownLabel}>시/도</Text>
                <View style={styles.dropdown}>
                  {regionOptions.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownOption,
                        region === option && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setRegion(option);
                        setDistrict('');
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          region === option &&
                            styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.regionContainer}>
                <Text style={styles.dropdownLabel}>구/군</Text>
                <View style={styles.dropdown}>
                  {region &&
                    districtOptions[region]?.map(option => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.dropdownOption,
                          district === option && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => setDistrict(option)}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            district === option &&
                              styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            </View>
          </View>

          {/* MBTI 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MBTI (필수)</Text>
            <View style={styles.mbtiContainer}>
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
                          selectedMBTI[index] === option &&
                            styles.mbtiButtonTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* 흡연/음주 습관 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>흡연 습관</Text>
            <View style={styles.habitContainer}>
              {smokingOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.habitButton,
                    smoking === option && styles.habitButtonSelected,
                  ]}
                  onPress={() => handleSmokingSelect(option)}
                >
                  <Text
                    style={[
                      styles.habitButtonText,
                      smoking === option && styles.habitButtonTextSelected,
                    ]}
                  >
                    {option === SmokingHabit.NON_SMOKER
                      ? '비흡연'
                      : option === SmokingHabit.VAPE_ONLY
                      ? '전자담배'
                      : '흡연'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>음주 습관</Text>
            <View style={styles.habitContainer}>
              {drinkingOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.habitButton,
                    drinking === option && styles.habitButtonSelected,
                  ]}
                  onPress={() => handleDrinkingSelect(option)}
                >
                  <Text
                    style={[
                      styles.habitButtonText,
                      drinking === option && styles.habitButtonTextSelected,
                    ]}
                  >
                    {option === DrinkingHabit.NON_DRINKER
                      ? '안 마심'
                      : option === DrinkingHabit.OCCASIONAL_DRINKER
                      ? '가끔 음주'
                      : '자주 음주'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isFormValid()
                ? styles.submitButtonActive
                : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isLoading}
          >
            <Text
              style={[
                styles.submitButtonText,
                isFormValid()
                  ? styles.submitButtonTextActive
                  : styles.submitButtonTextDisabled,
              ]}
            >
              다음
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: 'flex-start',
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
  },
  inputGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputRightMargin: {
    marginRight: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  ageInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  unit: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666666',
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionSelected: {
    backgroundColor: '#FF6B6B',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  dropdownOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  regionContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  mbtiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mbtiRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  mbtiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  mbtiButtonSelected: {
    backgroundColor: '#FF6B6B',
  },
  mbtiButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mbtiButtonTextSelected: {
    color: '#FFFFFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666666',
    width: 60,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999999',
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
  genderContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 15,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  genderButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  genderText: {
    fontSize: 14,
    color: '#333333',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  habitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  habitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  habitButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  habitButtonText: {
    fontSize: 14,
    color: '#333333',
  },
  habitButtonTextSelected: {
    color: '#FFFFFF',
  },
});
export default ProfileSetupScreen;
