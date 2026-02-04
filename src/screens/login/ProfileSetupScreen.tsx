// ProfileSetupScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  savePhysicalProfile,
  PhysicalProfileData,
} from '../../utils/ProfileStorage';

import {
  REGION_OPTIONS,
  DISTRICT_OPTIONS,
  normalizeSido,
  normalizeSigungu,
} from '../../constants/koreaRegions';

interface ProfileSetupScreenProps {
  onProfileComplete: () => void;
}

// Enum 정의 (서버 스키마와 일치)
enum BodyType {
  SLIM = 'SLIM',
  AVERAGE = 'AVERAGE',
  CHUBBY = 'CHUBBY',
}

enum SmokingHabit {
  NON_SMOKER = 'NON_SMOKER',
  VAPE_ONLY = 'VAPE_ONLY',
  REGULAR_SMOKER = 'REGULAR_SMOKER',
}

enum DrinkingHabit {
  NON_DRINKER = 'NON_DRINKER',
  OCCASIONAL_DRINKER = 'OCCASIONAL_DRINKER',
  FREQUENT_DRINKER = 'FREQUENT_DRINKER',
}

const PINK = '#FFB6C1';

// ✅ 3단 고정 스냅 (0 / 50 / 100) + 중간값 금지
const snapToTri = (raw: number) => {
  if (raw < 25) return 0;
  if (raw < 75) return 50;
  return 100;
};

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onProfileComplete }) => {
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState<BodyType | ''>('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedMBTI, setSelectedMBTI] = useState<string[]>(['', '', '', '']);

  // ✅ 퍼센트 느낌으로 연속값 (0~100) -> 이제 실제론 0/50/100만 들어감
  const [smoking, setSmoking] = useState<number>(0);
  const [drinking, setDrinking] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);

  const [showBodyTypeDropdown, setShowBodyTypeDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  const bodyTypeOptions = [
    { label: '마름', value: BodyType.SLIM },
    { label: '보통', value: BodyType.AVERAGE },
    { label: '통통', value: BodyType.CHUBBY },
  ];

  const handleMBTISelect = (index: number, value: string) => {
    const newMBTI = [...selectedMBTI];
    newMBTI[index] = value;
    setSelectedMBTI(newMBTI);
  };

  const isFormValid = () => {
    return (
      height.length > 0 &&
      bodyType !== '' &&
      region.length > 0 &&
      district.length > 0 &&
      selectedMBTI.every(item => item.length > 0)
    );
  };

  const getBodyTypeLabel = (value: BodyType | '') => {
    const option = bodyTypeOptions.find(opt => opt.value === value);
    return option ? option.label : '';
  };

  const mapSmoking = (value: number): SmokingHabit => {
    if (value < 34) return SmokingHabit.NON_SMOKER;
    if (value < 67) return SmokingHabit.VAPE_ONLY;
    return SmokingHabit.REGULAR_SMOKER;
  };

  const mapDrinking = (value: number): DrinkingHabit => {
    if (value < 34) return DrinkingHabit.NON_DRINKER;
    if (value < 67) return DrinkingHabit.OCCASIONAL_DRINKER;
    return DrinkingHabit.FREQUENT_DRINKER;
  };

  const districtList = useMemo(() => {
    const sidoN = normalizeSido(region);
    return DISTRICT_OPTIONS[sidoN] || [];
  }, [region]);

  const handleSubmit = async () => {
    if (!isFormValid() || isLoading) {
      Alert.alert('알림', '모든 항목을 올바르게 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const sidoN = normalizeSido(region);
      const sigunguN = normalizeSigungu(sidoN, district);

      const profileData: PhysicalProfileData = {
        height: parseInt(height, 10),
        bodyType: bodyType as string,
        region: {
          sido: sidoN,
          sigungu: sigunguN,
        },
        mbti: selectedMBTI.join(''),
        smokingHabit: mapSmoking(smoking),
        drinkingHabit: mapDrinking(drinking),
      };

      await savePhysicalProfile(profileData);
      onProfileComplete();
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      Alert.alert('오류', '프로필 저장 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDropdown = (
    visible: boolean,
    options: string[] | { label: string; value: string }[],
    selectedValue: string,
    onSelect: (value: string) => void,
    onClose: () => void,
  ) => {
    if (!visible) return null;

    return (
      <View style={styles.dropdownMenu}>
        <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
          {(options as any[]).map((option, index) => {
            const isObjectArray = typeof option === 'object';
            const label = isObjectArray ? option.label : option;
            const value = isObjectArray ? option.value : option;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownItem,
                  selectedValue === value && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  onSelect(value);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedValue === value && styles.dropdownItemTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ✅ 흡연/음주 공통 슬라이더 UI (스냅 로직 포함)
  const renderPercentSlider = (value: number, onChange: (v: number) => void) => {
    return (
      <View style={styles.customSliderContainer}>
        <View style={styles.sliderTrack} />
        <View style={styles.sliderCenterLine} />
        <View style={styles.sliderCenterTick} />

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={value}
          onValueChange={(raw) => onChange(snapToTri(raw))}
          onSlidingComplete={(raw) => onChange(snapToTri(raw))}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor="#FFFFFF"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>신체 프로필</Text>

          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.heightContainer}>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={styles.heightInput}
                    placeholder="키"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.unitInside}>cm</Text>
                </View>
              </View>

              <View style={styles.bodyTypeContainer}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setShowBodyTypeDropdown(!showBodyTypeDropdown);
                    setShowRegionDropdown(false);
                    setShowDistrictDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownText, !bodyType && styles.placeholder]}>
                    {getBodyTypeLabel(bodyType) || '체형'}
                  </Text>
                </TouchableOpacity>

                {renderDropdown(
                  showBodyTypeDropdown,
                  bodyTypeOptions,
                  bodyType,
                  value => setBodyType(value as BodyType),
                  () => setShowBodyTypeDropdown(false),
                )}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지역</Text>

            <View style={styles.row}>
              <View style={styles.regionContainer}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setShowRegionDropdown(!showRegionDropdown);
                    setShowBodyTypeDropdown(false);
                    setShowDistrictDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownText, !region && styles.placeholder]}>
                    {region || '시/도'}
                  </Text>
                </TouchableOpacity>

                {renderDropdown(
                  showRegionDropdown,
                  [...REGION_OPTIONS],
                  region,
                  value => {
                    const sidoN = normalizeSido(value);
                    setRegion(sidoN);
                    setDistrict('');
                  },
                  () => setShowRegionDropdown(false),
                )}
              </View>

              <View style={styles.regionContainer}>
                <TouchableOpacity
                  style={[styles.dropdown, !region && styles.dropdownDisabled]}
                  onPress={() => {
                    if (region) {
                      setShowDistrictDropdown(!showDistrictDropdown);
                      setShowBodyTypeDropdown(false);
                      setShowRegionDropdown(false);
                    }
                  }}
                  disabled={!region}
                >
                  <Text style={[styles.dropdownText, !district && styles.placeholder]}>
                    {district || '시/군/구'}
                  </Text>
                </TouchableOpacity>

                {region &&
                  renderDropdown(
                    showDistrictDropdown,
                    districtList,
                    district,
                    setDistrict,
                    () => setShowDistrictDropdown(false),
                  )}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MBTI (필수)</Text>

            <View style={styles.mbtiContainer}>
              <View style={styles.mbtiRow}>
                <TouchableOpacity
                  style={[styles.mbtiButton, selectedMBTI[0] === 'E' && styles.mbtiButtonSelected]}
                  onPress={() => handleMBTISelect(0, 'E')}
                >
                  <Text style={[styles.mbtiButtonText, selectedMBTI[0] === 'E' && styles.mbtiButtonTextSelected]}>
                    E
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mbtiButton, selectedMBTI[1] === 'S' && styles.mbtiButtonSelected]}
                  onPress={() => handleMBTISelect(1, 'S')}
                >
                  <Text style={[styles.mbtiButtonText, selectedMBTI[1] === 'S' && styles.mbtiButtonTextSelected]}>
                    S
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mbtiButton, selectedMBTI[2] === 'F' && styles.mbtiButtonSelected]}
                  onPress={() => handleMBTISelect(2, 'F')}
                >
                  <Text style={[styles.mbtiButtonText, selectedMBTI[2] === 'F' && styles.mbtiButtonTextSelected]}>
                    F
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mbtiButton, selectedMBTI[3] === 'J' && styles.mbtiButtonSelected]}
                  onPress={() => handleMBTISelect(3, 'J')}
                >
                  <Text style={[styles.mbtiButtonText, selectedMBTI[3] === 'J' && styles.mbtiButtonTextSelected]}>
                    J
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.mbtiRow}>
                <TouchableOpacity
                  style={[styles.mbtiButton, selectedMBTI[0] === 'I' && styles.mbtiButtonSelected]}
                  onPress={() => handleMBTISelect(0, 'I')}
                >
                  <Text style={[styles.mbtiButtonText, selectedMBTI[0] === 'I' && styles.mbtiButtonTextSelected]}>
                    I
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mbtiButton, selectedMBTI[1] === 'N' && styles.mbtiButtonSelected]}
                  onPress={() => handleMBTISelect(1, 'N')}
                >
                  <Text style={[styles.mbtiButtonText, selectedMBTI[1] === 'N' && styles.mbtiButtonTextSelected]}>
                    N
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mbtiButton, selectedMBTI[2] === 'T' && styles.mbtiButtonSelected]}
                  onPress={() => handleMBTISelect(2, 'T')}
                >
                  <Text style={[styles.mbtiButtonText, selectedMBTI[2] === 'T' && styles.mbtiButtonTextSelected]}>
                    T
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mbtiButton, selectedMBTI[3] === 'P' && styles.mbtiButtonSelected]}
                  onPress={() => handleMBTISelect(3, 'P')}
                >
                  <Text style={[styles.mbtiButtonText, selectedMBTI[3] === 'P' && styles.mbtiButtonTextSelected]}>
                    P
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>흡연</Text>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabelsContainer}>
                <Text style={styles.sliderLabel}>비흡연</Text>
                <Text style={styles.sliderLabel}>전자담배</Text>
                <Text style={styles.sliderLabel}>흡연</Text>
              </View>

              {renderPercentSlider(smoking, setSmoking)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>음주</Text>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabelsContainer}>
                <Text style={styles.sliderLabel}>안 마심</Text>
                <Text style={styles.sliderLabel}>가끔 음주</Text>
                <Text style={styles.sliderLabel}>자주 음주</Text>
              </View>

              {renderPercentSlider(drinking, setDrinking)}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isFormValid() && !isLoading ? styles.submitButtonActive : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isLoading}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.submitButtonText,
                isFormValid() && !isLoading ? styles.submitButtonTextActive : styles.submitButtonTextDisabled,
              ]}
            >
              {isLoading ? '저장 중...' : '다음'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const TRACK_HEIGHT = 30;
const TRACK_RADIUS = 15;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  content: { padding: 20 },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 30,
    textAlign: 'left',
  },

  section: { marginBottom: 30, position: 'relative' },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#102A43',
    marginBottom: 15,
    textAlign: 'left',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  heightContainer: { flex: 1, marginRight: 10 },
  bodyTypeContainer: { flex: 1, marginLeft: 10, position: 'relative' },

  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 15,
    minHeight: 48,
  },
  heightInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333333',
  },
  unitInside: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 8,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    minHeight: 48,
    justifyContent: 'center',
  },
  dropdownDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#D0D0D0',
  },
  dropdownText: { fontSize: 16, color: '#333333' },
  placeholder: { color: '#999999' },

  regionContainer: {
    flex: 1,
    marginHorizontal: 5,
    position: 'relative',
  },

  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 2,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScrollView: { maxHeight: 240 },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: { backgroundColor: '#F08080' },
  dropdownItemText: { fontSize: 16, color: '#333333' },
  dropdownItemTextSelected: { color: '#FFFFFF', fontWeight: '600' },

  mbtiContainer: { alignItems: 'center' },
  mbtiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  mbtiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  mbtiButtonSelected: { backgroundColor: '#F08080' },
  mbtiButtonText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  mbtiButtonTextSelected: { color: '#FFFFFF' },

  sliderContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  sliderLabel: { fontSize: 14, color: '#000000', fontWeight: '400' },

  customSliderContainer: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
  },

  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_RADIUS,
    backgroundColor: '#D9D9D940',
  },

  sliderCenterLine: {
    position: 'absolute',
    left: 15,
    right: 15,
    height: 2,
    top: '50%',
    marginTop: -1,
    backgroundColor: '#00000033',
  },

  sliderCenterTick: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 14,
    top: '50%',
    marginTop: -7,
    backgroundColor: '#00000066',
    borderRadius: 1,
  },

  slider: {
    width: '100%',
    height: 44,
  },

  submitButton: {
    width: '33%',
    alignSelf: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonActive: { backgroundColor: PINK },
  submitButtonDisabled: { backgroundColor: '#EAEAEA' },

  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitButtonTextActive: { color: '#333333' },
  submitButtonTextDisabled: { color: '#999999' },
});

export default ProfileSetupScreen;
