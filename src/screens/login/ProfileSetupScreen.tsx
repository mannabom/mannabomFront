// ProfileSetupScreen.tsx
import React, { useState } from 'react';
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

  const regionOptions = [
    '서울특별시',
    '부산광역시',
    '대구광역시',
    '인천광역시',
    '광주광역시',
    '대전광역시',
    '울산광역시',
    '세종특별자치시',
    '경기도',
    '강원특별자치도',
    '충청북도',
    '충청남도',
    '전북특별자치도',
    '전라남도',
    '경상북도',
    '경상남도',
    '제주특별자치도',
  ];

  const districtOptions: Record<string, string[]> = {
    서울특별시: [
      '종로구','중구','용산구','성동구','광진구','동대문구','중랑구','성북구','강북구','도봉구',
      '노원구','은평구','서대문구','마포구','양천구','강서구','구로구','금천구','영등포구','동작구',
      '관악구','서초구','강남구','송파구','강동구',
    ],
    부산광역시: [
      '중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구',
      '연제구','수영구','사상구','기장군',
    ],
    대구광역시: ['중구','동구','서구','남구','북구','수성구','달서구','달성군'],
    인천광역시: ['중구','동구','미추홀구','연수구','남동구','부평구','계양구','서구','강화군','옹진군'],
    광주광역시: ['동구','서구','남구','북구','광산구'],
    대전광역시: ['동구','중구','서구','유성구','대덕구'],
    울산광역시: ['중구','남구','동구','북구','울주군'],
    세종특별자치시: ['세종시'],
    경기도: [
      '수원시','성남시','안양시','안산시','용인시','평택시','과천시','오산시','시흥시','군포시','의왕시','하남시',
      '이천시','안성시','김포시','화성시','광주시','양주시','포천시','여주시','연천군','가평군','양평군','고양시',
      '부천시','광명시','동두천시','구리시','남양주시','의정부시','파주시',
    ],
    강원특별자치도: [
      '춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시','홍천군','횡성군','영월군','평창군','정선군',
      '철원군','화천군','양구군','인제군','고성군','양양군',
    ],
    충청북도: ['청주시','충주시','제천시','보은군','옥천군','영동군','증평군','진천군','괴산군','음성군','단양군'],
    충청남도: ['천안시','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','금산군','부여군','서천군','청양군','홍성군','예산군','태안군'],
    전북특별자치도: ['전주시','군산시','익산시','정읍시','남원시','김제시','완주군','진안군','무주군','장수군','임실군','순창군','고창군','부안군'],
    전라남도: ['목포시','여수시','순천시','나주시','광양시','담양군','곡성군','구례군','고흥군','보성군','화순군','장흥군','강진군','해남군','영암군','무안군','함평군','영광군','장성군','완도군','진도군','신안군'],
    경상북도: ['포항시','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','군위군','의성군','청송군','영양군','영덕군','청도군','고령군','성주군','칠곡군','예천군','봉화군','울진군','울릉군'],
    경상남도: ['창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','의령군','함안군','창녕군','고성군','남해군','하동군','산청군','함양군','거창군','합천군'],
    제주특별자치도: ['제주시','서귀포시'],
  };

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

  const handleSubmit = async () => {
    if (!isFormValid() || isLoading) {
      Alert.alert('알림', '모든 항목을 올바르게 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const profileData: PhysicalProfileData = {
        height: parseInt(height, 10),
        bodyType: bodyType as string,
        region: {
          sido: region,
          sigungu: district,
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
                  regionOptions,
                  region,
                  value => {
                    setRegion(value);
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
                    districtOptions[region] || [],
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
