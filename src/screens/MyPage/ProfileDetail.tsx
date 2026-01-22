// src/screens/ProfileDetail/ProfileDetail.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';

import apiClient from '../../services/apiClient';
import { API_ENDPOINTS_LIST } from '../../config/api';

type ServerProfile = {
  nickName?: string;
  birthDate?: string;
  gender?: string;
  mbti?: string;
  university?: string;
  regionSido?: string;
  regionSigungu?: string;
  height?: number;
  profileImageUrl?: string;
  bodyType?: string; // SLIM | AVERAGE | CHUBBY
  email?: string;
  smoking?: string; // NON_SMOKER | VAPE_ONLY | REGULAR_SMOKER
  alcohol?: string; // NON_DRINKER | OCCASIONAL_DRINKER | FREQUENT_DRINKER
};

type QuestionAnswer = {
  question?: string;
  answer?: string;
};

type ProfileForm = {
  nickName: string;
  mbti: string;
  height: string;
  regionSido: string;
  regionSigungu: string;
  university: string;
  email: string;
  gender: string;
  bodyType: string;
  birthDate: string;
  smoking: string;
  alcohol: string;
};

type ChoiceItem = {
  question: string;
  key: string;
  options: [string, string];
};

type UserMainPhotoResponseDTO = {
  photoURL?: string;
};

const { width: SCREEN_W } = Dimensions.get('window');

const PINK = '#FF6F8E';
const PINK_LIGHT = '#FFF1F1';
const BORDER = '#E6E6E6';

const REQUIRED_INTRO_MIN = 100;
const REQUIRED_SHORT_MIN = 30;
const OPTIONAL_MIN = 30;

const BODY_TYPE_OPTIONS = [
  { label: '마름', value: 'SLIM' },
  { label: '보통', value: 'AVERAGE' },
  { label: '통통', value: 'CHUBBY' },
];

const REGION_OPTIONS = [
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

const DISTRICT_OPTIONS: Record<string, string[]> = {
  서울특별시: [
    '종로구',
    '중구',
    '용산구',
    '성동구',
    '광진구',
    '동대문구',
    '중랑구',
    '성북구',
    '강북구',
    '도봉구',
    '노원구',
    '은평구',
    '서대문구',
    '마포구',
    '양천구',
    '강서구',
    '구로구',
    '금천구',
    '영등포구',
    '동작구',
    '관악구',
    '서초구',
    '강남구',
    '송파구',
    '강동구',
  ],
  부산광역시: [
    '중구',
    '서구',
    '동구',
    '영도구',
    '부산진구',
    '동래구',
    '남구',
    '북구',
    '해운대구',
    '사하구',
    '금정구',
    '강서구',
    '연제구',
    '수영구',
    '사상구',
    '기장군',
  ],
  대구광역시: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
  인천광역시: [
    '중구',
    '동구',
    '미추홀구',
    '연수구',
    '남동구',
    '부평구',
    '계양구',
    '서구',
    '강화군',
    '옹진군',
  ],
  광주광역시: ['동구', '서구', '남구', '북구', '광산구'],
  대전광역시: ['동구', '중구', '서구', '유성구', '대덕구'],
  울산광역시: ['중구', '남구', '동구', '북구', '울주군'],
  세종특별자치시: ['세종시'],
  경기도: [
    '수원시',
    '성남시',
    '안양시',
    '안산시',
    '용인시',
    '평택시',
    '과천시',
    '오산시',
    '시흥시',
    '군포시',
    '의왕시',
    '하남시',
    '이천시',
    '안성시',
    '김포시',
    '화성시',
    '광주시',
    '양주시',
    '포천시',
    '여주시',
    '연천군',
    '가평군',
    '양평군',
    '고양시',
    '부천시',
    '광명시',
    '동두천시',
    '구리시',
    '남양주시',
    '의정부시',
    '파주시',
  ],
  강원특별자치도: [
    '춘천시',
    '원주시',
    '강릉시',
    '동해시',
    '태백시',
    '속초시',
    '삼척시',
    '홍천군',
    '횡성군',
    '영월군',
    '평창군',
    '정선군',
    '철원군',
    '화천군',
    '양구군',
    '인제군',
    '고성군',
    '양양군',
  ],
  충청북도: [
    '청주시',
    '충주시',
    '제천시',
    '보은군',
    '옥천군',
    '영동군',
    '증평군',
    '진천군',
    '괴산군',
    '음성군',
    '단양군',
  ],
  충청남도: [
    '천안시',
    '공주시',
    '보령시',
    '아산시',
    '서산시',
    '논산시',
    '계룡시',
    '당진시',
    '금산군',
    '부여군',
    '서천군',
    '청양군',
    '홍성군',
    '예산군',
    '태안군',
  ],
  전북특별자치도: [
    '전주시',
    '군산시',
    '익산시',
    '정읍시',
    '남원시',
    '김제시',
    '완주군',
    '진안군',
    '무주군',
    '장수군',
    '임실군',
    '순창군',
    '고창군',
    '부안군',
  ],
  전라남도: [
    '목포시',
    '여수시',
    '순천시',
    '나주시',
    '광양시',
    '담양군',
    '곡성군',
    '구례군',
    '고흥군',
    '보성군',
    '화순군',
    '장흥군',
    '강진군',
    '해남군',
    '영암군',
    '무안군',
    '함평군',
    '영광군',
    '장성군',
    '완도군',
    '진도군',
    '신안군',
  ],
  경상북도: [
    '포항시',
    '경주시',
    '김천시',
    '안동시',
    '구미시',
    '영주시',
    '영천시',
    '상주시',
    '문경시',
    '경산시',
    '군위군',
    '의성군',
    '청송군',
    '영양군',
    '영덕군',
    '청도군',
    '고령군',
    '성주군',
    '칠곡군',
    '예천군',
    '봉화군',
    '울진군',
    '울릉군',
  ],
  경상남도: [
    '창원시',
    '진주시',
    '통영시',
    '사천시',
    '김해시',
    '밀양시',
    '거제시',
    '양산시',
    '의령군',
    '함안군',
    '창녕군',
    '고성군',
    '남해군',
    '하동군',
    '산청군',
    '함양군',
    '거창군',
    '합천군',
  ],
  제주특별자치도: ['제주시', '서귀포시'],
};

const CHOICES: ChoiceItem[] = [
  { question: '연인과 싸웠을 때(선택 시 1포인트팅 지급!)', key: '싸웠을', options: ['바로 풀고 싶다', '시간을 좀 가지고 싶다'] },
  { question: '연인과 함께한 사진', key: '사진', options: ['SNS에 공유해도 된다', 'SNS에 공유하기 싫다'] },
  { question: '연애에서 더 중요한 것은', key: '중요한 것은', options: ['편안함', '설렘'] },
  { question: '연인과의 데이트에서', key: '데이트에서', options: ['실내에서 데이트하기', '실외에서 데이트하기'] },
  { question: '연애에서 적당한 질투가', key: '질투', options: ['있어야 재미있다', '쿨한 게 편하다'] },
  { question: '연인과의 이상적인 하루는', key: '이상적인 하루', options: ['편안한 일상 즐기기', '새로운 경험 해보기'] },
  { question: '연인에게 주로 끌리는 모습은', key: '끌리는', options: ['배려심 넘치는 모습', '주도적인 모습'] },
  { question: '연인이 내 친구들과', key: '친구들과', options: ['어울리며 놀기', '따로 놀기'] },
];

const TEXT_QA_ITEMS = [
  { label: '나에게 연애란 어떤 의미 인가요?', matchKey: '연애란', fallbackTitle: '나에게 연애란?' },
  { label: '나의 소울 푸드?', matchKey: '소울', fallbackTitle: '나의 소울 푸드는?' },
  { label: '나의 하루 그리고 나의 휴일은?', matchKey: '휴일', fallbackTitle: '나의 하루, 그리고 나의 휴일은?' },
  { label: '하고 싶은 데이트는?', matchKey: '하고 싶은 데이트', fallbackTitle: '하고 싶은 데이트는?' },
];

const labelBodyType = (v?: string) => BODY_TYPE_OPTIONS.find(o => o.value === v)?.label || '';

const labelSmoking = (v?: string) => {
  if (v === 'VAPE_ONLY') return '전자담배';
  if (v === 'REGULAR_SMOKER') return '흡연';
  if (v === 'NON_SMOKER') return '비흡연';
  return '';
};

const labelAlcohol = (v?: string) => {
  if (v === 'FREQUENT_DRINKER') return '자주 음주';
  if (v === 'OCCASIONAL_DRINKER') return '가끔 음주';
  if (v === 'NON_DRINKER') return '안 마심';
  return '';
};

const mapSmokeToSlider = (s?: string) => {
  if (s === 'VAPE_ONLY') return 50;
  if (s === 'REGULAR_SMOKER') return 100;
  if (s === 'NON_SMOKER') return 0;
  return 0;
};

const mapDrinkToSlider = (d?: string) => {
  if (d === 'OCCASIONAL_DRINKER') return 50;
  if (d === 'FREQUENT_DRINKER') return 100;
  if (d === 'NON_DRINKER') return 0;
  return 0;
};

const mapSliderToSmokingEnum = (v: number) => {
  if (v >= 67) return 'REGULAR_SMOKER';
  if (v >= 33) return 'VAPE_ONLY';
  return 'NON_SMOKER';
};

const mapSliderToAlcoholEnum = (v: number) => {
  if (v >= 67) return 'FREQUENT_DRINKER';
  if (v >= 33) return 'OCCASIONAL_DRINKER';
  return 'NON_DRINKER';
};

const splitMbti = (mbti?: string) => {
  const s = (mbti || '').toUpperCase();
  const arr = s.split('').slice(0, 4);
  while (arr.length < 4) arr.push('');
  return arr as [string, string, string, string];
};

const isMbtiValid = (arr: string[]) => arr.length === 4 && arr.every(x => x && x.length === 1);

const norm = (s?: string) => (s || '').replace(/\s+/g, '').toLowerCase();

// ✅ 핵심: 3단 고정 스냅 (0 / 50 / 100) + 중간값 금지
const snapToTri = (raw: number) => {
  if (raw < 25) return 0;   // 0~24.999 -> 0
  if (raw < 75) return 50;  // 25~74.999 -> 50
  return 100;               // 75~100 -> 100
};

export default function ProfileDetail() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ServerProfile | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);

  const photoScrollRef = useRef<ScrollView>(null);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const [form, setForm] = useState<ProfileForm>({
    nickName: '',
    mbti: '',
    height: '',
    regionSido: '',
    regionSigungu: '',
    university: '',
    email: '',
    gender: '',
    bodyType: '',
    birthDate: '',
    smoking: '',
    alcohol: '',
  });

  const [basicModalVisible, setBasicModalVisible] = useState(false);
  const [draftHeight, setDraftHeight] = useState('');
  const [draftBodyType, setDraftBodyType] = useState('');
  const [draftRegion, setDraftRegion] = useState('');
  const [draftDistrict, setDraftDistrict] = useState('');
  const [draftMbti, setDraftMbti] = useState<string[]>(['', '', '', '']);
  const [draftSmoking, setDraftSmoking] = useState(0);
  const [draftDrinking, setDraftDrinking] = useState(0);

  const [showBodyTypeDropdown, setShowBodyTypeDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  const openBasicModal = () => {
    setDraftHeight(form.height || '');
    setDraftBodyType(form.bodyType || '');
    setDraftRegion(form.regionSido || '');
    setDraftDistrict(form.regionSigungu || '');
    setDraftMbti(splitMbti(form.mbti || profile?.mbti));

    // ✅ 모달 처음 열릴 때도 0/50/100 유지
    setDraftSmoking(snapToTri(mapSmokeToSlider(form.smoking || profile?.smoking)));
    setDraftDrinking(snapToTri(mapDrinkToSlider(form.alcohol || profile?.alcohol)));

    setShowBodyTypeDropdown(false);
    setShowRegionDropdown(false);
    setShowDistrictDropdown(false);
    setBasicModalVisible(true);
  };

  const closeAllDropdowns = () => {
    setShowBodyTypeDropdown(false);
    setShowRegionDropdown(false);
    setShowDistrictDropdown(false);
  };

  const handleMbtiSelect = (index: number, value: string) => {
    setDraftMbti(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const loadMainPhoto = async (): Promise<string | undefined> => {
    try {
      const res = await apiClient.get('/api/user/main_photo');
      const raw = res?.data;

      const photoURL: string | undefined =
        (raw as UserMainPhotoResponseDTO)?.photoURL ??
        (raw?.data as UserMainPhotoResponseDTO)?.photoURL ??
        raw?.result?.photoURL;

      if (photoURL && typeof photoURL === 'string') return photoURL;
      return undefined;
    } catch (e: any) {
      console.warn('⚠️ [ProfileDetail] main photo load failed:', e?.response?.data || e?.message || e);
      return undefined;
    }
  };

  const findQuestionTitleByKey = (keyword: string, fallback: string) => {
    const found = questionAnswers.find(q => norm(q.question).includes(norm(keyword)))?.question;
    return found || fallback;
  };

  const getAnswer = (keyword: string) => {
    const found = questionAnswers.find(q => norm(q.question).includes(norm(keyword)))?.answer ?? '';
    return typeof found === 'string' ? found : '';
  };

  const upsertAnswer = (questionKey: string, questionTitleFallback: string, answer: string) => {
    setQuestionAnswers(prev => {
      const next = [...prev];
      const idx = next.findIndex(q => norm(q.question).includes(norm(questionKey)));

      if (idx >= 0) {
        next[idx] = { ...next[idx], answer };
      } else {
        const serverTitle = prev.find(q => norm(q.question).includes(norm(questionKey)))?.question;
        next.push({ question: serverTitle || questionTitleFallback, answer });
      }
      return next;
    });
  };

  const loadProfile = async () => {
    try {
      setLoading(true);

      const [profileRes, mainPhotoURL] = await Promise.all([
        apiClient.get(API_ENDPOINTS_LIST.USER_PROFILE),
        loadMainPhoto(),
      ]);

      const data: any = profileRes.data?.data ?? profileRes.data;
      const profileData: any = data?.profile ?? data;

      const nextProfile: ServerProfile = {
        nickName: profileData?.nickName ?? profileData?.nickname,
        birthDate: profileData?.birthDate,
        gender: profileData?.gender,
        mbti: profileData?.mbti,
        height: profileData?.height,
        regionSido: profileData?.regionSido,
        regionSigungu: profileData?.regionSigungu,
        university: profileData?.university,
        profileImageUrl:
          mainPhotoURL ??
          profileData?.profileImageUrl ??
          profileData?.profileImage ??
          data?.profileImageUrl,
        bodyType: profileData?.bodyType,
        email: profileData?.email,
        smoking: profileData?.smoking,
        alcohol: profileData?.alcohol,
      };

      const answersRaw: any[] =
        data?.questionAnswerList ??
        data?.questionAnswers ??
        data?.answers ??
        data?.list ??
        [];

      const answers: QuestionAnswer[] = (Array.isArray(answersRaw) ? answersRaw : [])
        .map((item: any, idx: number) => {
          const qText =
            item?.question?.question ??
            item?.question ??
            item?.title ??
            item?.questionText ??
            item?.questionTitle ??
            `질문 ${idx + 1}`;

          const aText =
            item?.answer ??
            item?.content ??
            item?.value ??
            item?.answerText ??
            '';

          return { question: String(qText), answer: typeof aText === 'string' ? aText : String(aText ?? '') };
        })
        .filter(a => a.question && a.answer !== undefined);

      setQuestionAnswers(answers);
      setProfile(nextProfile);

      setForm({
        nickName: nextProfile.nickName ?? '',
        mbti: nextProfile.mbti ?? '',
        height: nextProfile.height ? String(nextProfile.height) : '',
        regionSido: nextProfile.regionSido ?? '',
        regionSigungu: nextProfile.regionSigungu ?? '',
        university: nextProfile.university ?? '',
        email: nextProfile.email ?? '',
        gender: nextProfile.gender ?? '',
        bodyType: nextProfile.bodyType ?? '',
        birthDate: nextProfile.birthDate ?? '',
        smoking: nextProfile.smoking ?? '',
        alcohol: nextProfile.alcohol ?? '',
      });

      const url = nextProfile.profileImageUrl;
      setPhotoUrls(url ? [url] : []);
      setActivePhotoIndex(0);
    } catch (e: any) {
      console.error('❌ [ProfileDetail] load error:', e?.response?.data || e?.message || e);
      Alert.alert('오류', '프로필 불러오기 실패', [{ text: '다시 시도', onPress: loadProfile }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const birthYear = useMemo(() => {
    if (!form.birthDate) return undefined;
    const y = parseInt(form.birthDate.split('-')[0], 10);
    return Number.isFinite(y) ? y : undefined;
  }, [form.birthDate]);

  const age = useMemo(() => {
    if (!birthYear) return undefined;
    return new Date().getFullYear() - birthYear;
  }, [birthYear]);

  const address = useMemo(() => {
    const a = (form.regionSido ? `${form.regionSido} ` : '') + (form.regionSigungu || '');
    return a.trim();
  }, [form.regionSido, form.regionSigungu]);

  const validateBeforeSave = () => {
    const intro = getAnswer('자기소개').trim();
    const charm = getAnswer('설레게').trim();
    const ideal = getAnswer('바라는').trim();

    if (intro.length < REQUIRED_INTRO_MIN) {
      Alert.alert('알림', `자기소개는 ${REQUIRED_INTRO_MIN}자 이상 입력해주세요.`);
      return false;
    }
    if (charm.length < REQUIRED_SHORT_MIN) {
      Alert.alert('알림', `나를 설레게 하는 매력은 ${REQUIRED_SHORT_MIN}자 이상 입력해주세요.`);
      return false;
    }
    if (ideal.length < REQUIRED_SHORT_MIN) {
      Alert.alert('알림', `연인에게 바라는 한가지는 ${REQUIRED_SHORT_MIN}자 이상 입력해주세요.`);
      return false;
    }

    const mbtiArr = splitMbti(form.mbti);
    if (!isMbtiValid(mbtiArr)) {
      Alert.alert('알림', 'MBTI(4글자)를 입력/선택해주세요.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (saving) return;
    if (!validateBeforeSave()) return;

    setSaving(true);
    try {
      const mbtiValue = (form.mbti || '').toUpperCase();
      const payloadQuestionAnswers = (questionAnswers || []).map(({ question, answer }) => ({ question, answer }));

      const payload = {
        profile: {
          gender: form.gender || undefined,
          height: form.height ? Number(form.height) : undefined,
          bodyType: form.bodyType || undefined,
          regionSido: form.regionSido || undefined,
          regionSigungu: form.regionSigungu || undefined,
          nickName: form.nickName || undefined,
          birthDate: form.birthDate || undefined,
          mbti: mbtiValue || undefined,
          smoking: form.smoking ? form.smoking : undefined,
          alcohol: form.alcohol ? form.alcohol : undefined,
          university: form.university || undefined,
          email: form.email || undefined,
        },
        questionAnswers: payloadQuestionAnswers,
      };

      await apiClient.put(API_ENDPOINTS_LIST.USER_PROFILE, payload);
      Alert.alert('저장 완료', '프로필이 업데이트 되었어요.');
      await loadProfile();
      navigation.goBack();
    } catch (e: any) {
      console.error('❌ [ProfileDetail] save error:', e?.response?.data || e?.message || e);
      Alert.alert('오류', '프로필 저장에 실패했어요. 입력값을 확인해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigation.goBack();

  const onPhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_W);
    if (idx !== activePhotoIndex) setActivePhotoIndex(idx);
  };

  const handleDeletePhoto = () => Alert.alert('TODO', '사진 삭제 API/요청 스펙 주면 바로 붙여줄게요.');
  const handleAddPhoto = () => Alert.alert('TODO', '사진 추가(앨범 선택) 라이브러리 + 업로드 API 스펙 주면 바로 붙여줄게요.');

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
        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
          {(options as any[]).map((option, index) => {
            const isObj = typeof option === 'object';
            const label = isObj ? option.label : option;
            const value = isObj ? option.value : option;
            const selected = selectedValue === value;

            return (
              <TouchableOpacity
                key={`${value}-${index}`}
                style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                onPress={() => {
                  onSelect(value);
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.dropdownItemText, selected && styles.dropdownItemTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ✅ 여기서 스냅 적용: 드래그 중에도 0/50/100만 유지
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

  if (loading) {
    return (
      <View style={[styles.loadingWrap]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>불러오는 중...</Text>
      </View>
    );
  }

  const heroName = `${form.nickName || '닉네임'}${age ? `(${age})` : ''}${form.mbti ? `, ${form.mbti}` : ''}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>프로필</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={styles.backText}>{'< 뒤로 가기'}</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <ScrollView
            ref={photoScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onPhotoScroll}
            scrollEventThrottle={16}
            style={styles.heroScroll}
          >
            {(photoUrls.length ? photoUrls : ['https://via.placeholder.com/600']).map((uri, idx) => (
              <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.heroImage} />
            ))}
          </ScrollView>

          {photoUrls.length > 1 && (
            <View style={styles.dotsRow}>
              {photoUrls.map((_, i) => (
                <View key={i} style={[styles.dot, i === activePhotoIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          <View style={styles.photoActions}>
            <Pressable style={[styles.iconBtn]} onPress={handleDeletePhoto}>
              <Text style={styles.iconBtnText}>🗑</Text>
            </Pressable>
            <Pressable style={[styles.iconBtn]} onPress={handleAddPhoto}>
              <Text style={styles.iconBtnText}>＋</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.profileBlock}>
          <View style={styles.basicHeaderRow}>
            <Text style={styles.nameLine}>{heroName}</Text>

            <Pressable style={styles.editBasicBtn} onPress={openBasicModal} hitSlop={10}>
              <Text style={styles.editBasicIcon}>✏️</Text>
              <Text style={styles.editBasicText}>기본 정보 수정</Text>
            </Pressable>
          </View>

          <View style={styles.basicInfoRow}>
            <View style={styles.basicLeftCol}>
              <View style={styles.leftLine}>
                <Text style={styles.leftIcon}>🎓</Text>
                <Text style={styles.leftText}>{form.university || ''}</Text>
              </View>

              <View style={styles.leftLine}>
                <Text style={styles.leftIcon}>📍</Text>
                <Text style={styles.leftText}>{address || ''}</Text>
              </View>

              <View style={styles.leftLine}>
                <Text style={styles.leftIcon}>🚭</Text>
                <Text style={styles.leftText}>{labelSmoking(form.smoking) || ''}</Text>
              </View>

              <View style={styles.leftLine}>
                <Text style={styles.leftIcon}>🍷</Text>
                <Text style={styles.leftText}>{labelAlcohol(form.alcohol) || ''}</Text>
              </View>
            </View>

            <View style={styles.basicRightCol}>
              {!!form.height && <Text style={styles.rightLineText}>{`키 ${form.height}cm`}</Text>}
              {!!form.bodyType && <Text style={styles.rightLineText}>{`체형 ${labelBodyType(form.bodyType)}`}</Text>}
            </View>
          </View>

          <Text style={styles.reportText}>신고 횟수: 0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.cardTitle}>자기소개</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="자기소개를 입력해주세요"
              placeholderTextColor="#999"
              value={getAnswer('자기소개')}
              onChangeText={txt => upsertAnswer('자기소개', findQuestionTitleByKey('자기소개', '자기소개 (필수)'), txt)}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.hintText}>{REQUIRED_INTRO_MIN}자 이상 입력해주세요</Text>

          <Text style={[styles.cardTitle, { marginTop: 18 }]}>연인에게 바라는 한가지는?</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="바라는 점을 입력해주세요"
              placeholderTextColor="#999"
              value={getAnswer('바라는')}
              onChangeText={txt => upsertAnswer('바라는', findQuestionTitleByKey('바라는', '연인에게 꼭 바라는 한 가지는?'), txt)}
            />
          </View>
          <Text style={styles.hintText}>{REQUIRED_SHORT_MIN}자 이상 입력해주세요</Text>

          <Text style={[styles.cardTitle, { marginTop: 18 }]}>나를 설레게 하는 이성의 매력</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="매력 포인트를 입력해주세요"
              placeholderTextColor="#999"
              value={getAnswer('설레게')}
              onChangeText={txt => upsertAnswer('설레게', findQuestionTitleByKey('설레게', '나를 설레게 하는 이성의 매력?'), txt)}
            />
          </View>
          <Text style={styles.hintText}>{REQUIRED_SHORT_MIN}자 이상 입력해주세요</Text>
        </View>

        <View style={styles.section}>
          {TEXT_QA_ITEMS.map((item, idx) => {
            const val = getAnswer(item.matchKey);
            const first = !val?.trim();

            return (
              <View key={item.matchKey} style={{ marginBottom: idx === TEXT_QA_ITEMS.length - 1 ? 0 : 18 }}>
                <Text style={styles.qTitle}>
                  {item.label}{' '}
                  {first ? <Text style={styles.qBonus}>(첫 입력 시 5포인트팅 지급!)</Text> : null}
                </Text>

                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    placeholder={first ? '내용을 입력해주세요! (첫 입력 시 5포인트팅 지급!)' : '내용을 입력해주세요'}
                    placeholderTextColor="#999"
                    value={val}
                    onChangeText={txt => upsertAnswer(item.matchKey, findQuestionTitleByKey(item.matchKey, item.fallbackTitle), txt)}
                    textAlignVertical="top"
                  />
                </View>

                <Text style={styles.hintText}>{OPTIONAL_MIN}자 이상 입력해주세요</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          {CHOICES.map((item, idx) => {
            const selected = getAnswer(item.key);
            const titleToUse = findQuestionTitleByKey(item.key, item.question);

            return (
              <View key={item.key} style={{ marginBottom: idx === CHOICES.length - 1 ? 0 : 18 }}>
                <Text style={styles.choiceTitle}>{item.question}</Text>

                <View style={styles.vsRow}>
                  {item.options.map(opt => {
                    const active = selected === opt;
                    return (
                      <Pressable
                        key={opt}
                        style={[styles.choicePill, active ? styles.choicePillActive : styles.choicePillIdle]}
                        onPress={() => upsertAnswer(item.key, titleToUse, opt)}
                      >
                        <Text style={[styles.choicePillText, active && styles.choicePillTextActive]}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                  <Text style={styles.vsText}>VS</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.bottomButtons}>
          <Pressable style={[styles.bottomBtn, styles.btnCancel]} onPress={handleCancel}>
            <Text style={[styles.bottomBtnText, styles.btnCancelText]}>취소</Text>
          </Pressable>
          <Pressable style={[styles.bottomBtn, styles.btnSave]} onPress={handleSave}>
            <Text style={[styles.bottomBtnText, styles.btnSaveText]}>{saving ? '저장 중...' : '저장'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={basicModalVisible}
        onRequestClose={() => setBasicModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setBasicModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>신체 프로필</Text>

            <Text style={styles.modalSectionTitle}>키</Text>
            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={styles.unitInput}
                    placeholder="키"
                    placeholderTextColor="#999"
                    value={draftHeight}
                    onChangeText={v => setDraftHeight(v.replace(/[^0-9]/g, '').slice(0, 3))}
                    keyboardType="numeric"
                    maxLength={3}
                    onFocus={closeAllDropdowns}
                  />
                  <Text style={styles.unitText}>cm</Text>
                </View>
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>체형</Text>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowBodyTypeDropdown(v => !v);
                  setShowRegionDropdown(false);
                  setShowDistrictDropdown(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.dropdownText, !draftBodyType && styles.placeholder]}>
                  {labelBodyType(draftBodyType) || '체형'}
                </Text>
              </TouchableOpacity>

              {renderDropdown(
                showBodyTypeDropdown,
                BODY_TYPE_OPTIONS,
                draftBodyType,
                v => setDraftBodyType(v),
                () => setShowBodyTypeDropdown(false),
              )}
            </View>

            <Text style={styles.modalSectionTitle}>지역</Text>
            <View style={styles.modalRow}>
              <View style={[styles.modalCol, { marginRight: 10 }]}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setShowRegionDropdown(v => !v);
                    setShowBodyTypeDropdown(false);
                    setShowDistrictDropdown(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dropdownText, !draftRegion && styles.placeholder]}>
                    {draftRegion || '시/도'}
                  </Text>
                </TouchableOpacity>

                {renderDropdown(
                  showRegionDropdown,
                  REGION_OPTIONS,
                  draftRegion,
                  v => {
                    setDraftRegion(v);
                    setDraftDistrict('');
                  },
                  () => setShowRegionDropdown(false),
                )}
              </View>

              <View style={styles.modalCol}>
                <TouchableOpacity
                  style={[styles.dropdown, !draftRegion && styles.dropdownDisabled]}
                  onPress={() => {
                    if (!draftRegion) return;
                    setShowDistrictDropdown(v => !v);
                    setShowRegionDropdown(false);
                    setShowBodyTypeDropdown(false);
                  }}
                  activeOpacity={0.85}
                  disabled={!draftRegion}
                >
                  <Text style={[styles.dropdownText, !draftDistrict && styles.placeholder]}>
                    {draftDistrict || '시/군/구'}
                  </Text>
                </TouchableOpacity>

                {draftRegion
                  ? renderDropdown(
                      showDistrictDropdown,
                      DISTRICT_OPTIONS[draftRegion] || [],
                      draftDistrict,
                      v => setDraftDistrict(v),
                      () => setShowDistrictDropdown(false),
                    )
                  : null}
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>MBTI (필수)</Text>
            <View style={styles.mbtiWrap}>
              <View style={styles.mbtiRow}>
                {['E', 'S', 'F', 'J'].map((ch, i) => {
                  const active = draftMbti[i] === ch;
                  return (
                    <Pressable
                      key={ch}
                      style={[styles.mbtiBtn, active && styles.mbtiBtnActive]}
                      onPress={() => handleMbtiSelect(i, ch)}
                    >
                      <Text style={[styles.mbtiText, active && styles.mbtiTextActive]}>{ch}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.mbtiRow}>
                {['I', 'N', 'T', 'P'].map((ch, i) => {
                  const idx = i;
                  const active = draftMbti[idx] === ch;
                  return (
                    <Pressable
                      key={ch}
                      style={[styles.mbtiBtn, active && styles.mbtiBtnActive]}
                      onPress={() => handleMbtiSelect(idx, ch)}
                    >
                      <Text style={[styles.mbtiText, active && styles.mbtiTextActive]}>{ch}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>흡연</Text>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>비흡연</Text>
              <Text style={styles.sliderLabel}>전자 담배</Text>
              <Text style={styles.sliderLabel}>일반 담배</Text>
            </View>
            {renderPercentSlider(draftSmoking, setDraftSmoking)}

            <Text style={[styles.modalSectionTitle, { marginTop: 12 }]}>음주</Text>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>안마심</Text>
              <Text style={styles.sliderLabel}>가끔 음주</Text>
              <Text style={styles.sliderLabel}>자주 음주</Text>
            </View>
            {renderPercentSlider(draftDrinking, setDraftDrinking)}

            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setBasicModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>취소</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={() => {
                  const mbti = draftMbti.join('').toUpperCase();

                  setForm(prev => ({
                    ...prev,
                    height: draftHeight,
                    bodyType: draftBodyType,
                    regionSido: draftRegion,
                    regionSigungu: draftDistrict,
                    mbti: mbti,
                    smoking: mapSliderToSmokingEnum(draftSmoking),
                    alcohol: mapSliderToAlcoholEnum(draftDrinking),
                  }));

                  setBasicModalVisible(false);
                }}
              >
                <Text style={styles.modalBtnSaveText}>저장</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const TRACK_HEIGHT = 30;
const TRACK_RADIUS = 15;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  backText: { fontSize: 14, color: '#111' },

  heroCard: {
    width: '100%',
    height: 340,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F7F7F7',
    position: 'relative',
    marginBottom: 14,
  },
  heroScroll: { flex: 1 },
  heroImage: { width: SCREEN_W - 32, height: 340, resizeMode: 'cover' },

  dotsRow: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginHorizontal: 3,
  },
  dotActive: { backgroundColor: '#fff' },

  photoActions: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18 },

  profileBlock: { paddingVertical: 8, paddingHorizontal: 0, marginBottom: 6 },
  basicHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  nameLine: { flex: 1, fontSize: 18, fontWeight: '900', color: '#111', marginRight: 10 },

  editBasicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
  },
  editBasicIcon: { fontSize: 13 },
  editBasicText: { fontSize: 12, fontWeight: '900', color: '#111' },

  basicInfoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  basicLeftCol: { flex: 1 },
  basicRightCol: { minWidth: 90, alignItems: 'flex-end' },

  leftLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  leftIcon: { width: 22, fontSize: 16 },
  leftText: { color: '#111', fontSize: 14, fontWeight: '700' },

  rightLineText: { color: '#111', fontSize: 14, fontWeight: '800', marginBottom: 10 },

  reportText: { color: '#777', fontSize: 12, marginTop: 2, alignSelf: 'flex-end' },

  section: { marginTop: 18 },

  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 8 },
  inputBox: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { height: 44, color: '#111' },
  textArea: { minHeight: 90, color: '#111' },
  hintText: { marginTop: 6, color: '#999', fontSize: 12 },

  qTitle: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 8 },
  qBonus: { color: '#999', fontWeight: '700', fontSize: 12 },

  choiceTitle: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
    marginBottom: 10,
  },
  vsRow: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 10 },
  vsText: {
    position: 'absolute',
    left: '50%',
    marginLeft: -10,
    fontWeight: '900',
    color: '#999',
    fontSize: 12,
  },
  choicePill: { flex: 1, borderRadius: 999, borderWidth: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  choicePillIdle: { borderColor: BORDER, backgroundColor: '#fff' },
  choicePillActive: { borderColor: PINK, backgroundColor: PINK },
  choicePillText: { fontSize: 13, fontWeight: '800', color: '#111' },
  choicePillTextActive: { color: '#fff' },

  bottomButtons: { flexDirection: 'row', gap: 10, marginTop: 18 },
  bottomBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { backgroundColor: '#EDEDED' },
  btnSave: { backgroundColor: PINK },
  bottomBtnText: { fontSize: 14, fontWeight: '900' },
  btnCancelText: { color: '#666' },
  btnSaveText: { color: '#fff' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 12 },

  modalSectionTitle: { fontSize: 14, fontWeight: '900', color: '#111', marginTop: 10, marginBottom: 8 },
  modalRow: { flexDirection: 'row', marginBottom: 10 },
  modalCol: { flex: 1, position: 'relative' },

  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  unitInput: { flex: 1, color: '#111' },
  unitText: { color: '#666', marginLeft: 6, fontWeight: '700' },

  dropdown: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dropdownDisabled: { backgroundColor: '#F4F4F4' },
  dropdownText: { color: '#111', fontWeight: '700' },
  placeholder: { color: '#999' },

  dropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    zIndex: 2000,
    elevation: 10,
    overflow: 'hidden',
  },
  dropdownScroll: { maxHeight: 220 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  dropdownItemSelected: { backgroundColor: PINK_LIGHT },
  dropdownItemText: { color: '#111', fontWeight: '700' },
  dropdownItemTextSelected: { color: PINK, fontWeight: '900' },

  mbtiWrap: { marginBottom: 8 },
  mbtiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  mbtiBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFD5DD', alignItems: 'center', justifyContent: 'center' },
  mbtiBtnActive: { backgroundColor: '#E34E70' },
  mbtiText: { fontWeight: '900', color: '#E34E70', fontSize: 16 },
  mbtiTextActive: { color: '#fff' },

  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sliderLabel: { fontSize: 12, color: '#111', fontWeight: '700' },

  customSliderContainer: { width: '100%', height: 44, justifyContent: 'center' },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_RADIUS,
    backgroundColor: '#00000010',
  },
  sliderCenterLine: {
    position: 'absolute',
    left: 15,
    right: 15,
    height: 2,
    top: '50%',
    marginTop: -1,
    backgroundColor: '#00000022',
  },
  sliderCenterTick: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 14,
    top: '50%',
    marginTop: -7,
    backgroundColor: '#00000055',
    borderRadius: 1,
  },
  slider: { width: '100%', height: 44 },

  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnCancel: { backgroundColor: '#EDEDED' },
  modalBtnSave: { backgroundColor: PINK },
  modalBtnCancelText: { color: '#666', fontWeight: '900' },
  modalBtnSaveText: { color: '#fff', fontWeight: '900' },
});
