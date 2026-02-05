// src/mocks/datingMock.ts
// 🚨 MOCK DATA / MOCK API

import { DrinkingHabit, SmokingHabit } from '../types/DatingAPI';
import { allSmokingHabits, allDrinkingHabits } from '../utils/DatingUtils';

export const USE_DATING_MOCK = true;

export type UiProfileCard = {
  profileId: number;
  nickname: string;
  age: number;
  mbti: string;
  mainPhotoUrl: string;
  smoking: SmokingHabit;
  drinking: DrinkingHabit;
};

export type UiLoveCodeCard = {
  profileId: number;
  nickname: string;
  age: number;
  mbti: string;
  smoking: SmokingHabit;
  drinking: DrinkingHabit;
  requiredQA: { question: string; answer: string }[];
  optionalQA: { question: string; answer: string }[];
};

// ✅ setTimeout 타입 에러 해결
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(() => resolve(), ms));

// ✅ 배열 길이가 프로젝트마다 달라도 터지지 않게 안전장치
const S0 = allSmokingHabits[0];
const S1 = allSmokingHabits[1] ?? allSmokingHabits[0];
const S2 = allSmokingHabits[2] ?? allSmokingHabits[0];

const D0 = allDrinkingHabits[0];
const D1 = allDrinkingHabits[1] ?? allDrinkingHabits[0];
const D2 = allDrinkingHabits[2] ?? allDrinkingHabits[0];

const PROFILES: UiProfileCard[] = [
  { profileId: 101, nickname: '수진', age: 23, mbti: 'INFP', mainPhotoUrl: 'https://picsum.photos/900/900?random=201', smoking: S0, drinking: D1 },
  { profileId: 102, nickname: '하루', age: 26, mbti: 'ENFJ', mainPhotoUrl: 'https://picsum.photos/900/900?random=202', smoking: S1, drinking: D2 },
  { profileId: 103, nickname: '은호', age: 24, mbti: 'ENTP', mainPhotoUrl: 'https://picsum.photos/900/900?random=203', smoking: S2, drinking: D0 },
  { profileId: 104, nickname: '다온', age: 25, mbti: 'ISFJ', mainPhotoUrl: 'https://picsum.photos/900/900?random=204', smoking: S0, drinking: D0 },
  { profileId: 105, nickname: '민재', age: 27, mbti: 'ISTP', mainPhotoUrl: 'https://picsum.photos/900/900?random=205', smoking: S1, drinking: D1 },
  { profileId: 106, nickname: '라헬', age: 22, mbti: 'ENFP', mainPhotoUrl: 'https://picsum.photos/900/900?random=206', smoking: S0, drinking: D1 },
  { profileId: 107, nickname: '준오', age: 29, mbti: 'ESFJ', mainPhotoUrl: 'https://picsum.photos/900/900?random=207', smoking: S2, drinking: D2 },
  { profileId: 108, nickname: '채린', age: 21, mbti: 'INTJ', mainPhotoUrl: 'https://picsum.photos/900/900?random=208', smoking: S0, drinking: D0 },
  { profileId: 109, nickname: '도윤', age: 28, mbti: 'ISFP', mainPhotoUrl: 'https://picsum.photos/900/900?random=209', smoking: S1, drinking: D1 },
  { profileId: 110, nickname: '서율', age: 20, mbti: 'ESTP', mainPhotoUrl: 'https://picsum.photos/900/900?random=210', smoking: S0, drinking: D2 },
  { profileId: 111, nickname: '재이', age: 24, mbti: 'INFJ', mainPhotoUrl: 'https://picsum.photos/900/900?random=211', smoking: S0, drinking: D0 },
  { profileId: 112, nickname: '아인', age: 22, mbti: 'ENFJ', mainPhotoUrl: 'https://picsum.photos/900/900?random=212', smoking: S1, drinking: D1 },
  { profileId: 113, nickname: '현준', age: 27, mbti: 'ESTJ', mainPhotoUrl: 'https://picsum.photos/900/900?random=213', smoking: S2, drinking: D2 },
  { profileId: 114, nickname: '유림', age: 23, mbti: 'ISFP', mainPhotoUrl: 'https://picsum.photos/900/900?random=214', smoking: S0, drinking: D0 },
  { profileId: 115, nickname: '세민', age: 26, mbti: 'ENTJ', mainPhotoUrl: 'https://picsum.photos/900/900?random=215', smoking: S1, drinking: D1 },
];

const LOVECODES: UiLoveCodeCard[] = [
  {
    profileId: 101,
    nickname: '수진',
    age: 23,
    mbti: 'INFP',
    smoking: S0,
    drinking: D1,
    requiredQA: [
      { question: '자기소개', answer: '늘 따뜻한 말 한마디를 먼저 건네는 사람이고 싶어요. 작은 이벤트를 좋아해요.' },
      { question: '연인에게 바라는 한 가지는?', answer: '솔직함! 힘든 것도 기쁜 것도 같이 나누면 좋겠어요.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '사려 깊은 행동과 진심 어린 눈빛.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '벚꽃길 산책 + 필름카메라 찍기' },
      { question: '연애에서 중요한 것', answer: '편안함 60 / 설렘 40' },
    ],
  },
  {
    profileId: 102,
    nickname: '하루',
    age: 26,
    mbti: 'ENFJ',
    smoking: S1,
    drinking: D2,
    requiredQA: [
      { question: '자기소개', answer: '퇴근 후 요가로 힐링, 주말에는 전시회/뮤지컬로 에너지 충전합니다.' },
      { question: '연인에게 바라는 한 가지는?', answer: '감정 숨기지 말고 바로바로 공유해주기.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '센스 있는 칭찬과 예의 있는 태도.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '맛집 투어 + 드라이브' },
      { question: '연애에서 중요한 것', answer: '대화의 온도와 속도' },
    ],
  },
  {
    profileId: 103,
    nickname: '은호',
    age: 24,
    mbti: 'ENTP',
    smoking: S2,
    drinking: D0,
    requiredQA: [
      { question: '자기소개', answer: '문제 해결을 좋아하는 기획자. 새로운 아이디어로 상대를 웃게 합니다.' },
      { question: '연인에게 바라는 한 가지는?', answer: '서로의 일상을 궁금해해 주는 관심.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '호기심 많은 질문과 유머 코드.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '보드게임 카페에서 팀플' },
      { question: '연애에서 중요한 것', answer: '팀워크 80' },
    ],
  },
  {
    profileId: 104,
    nickname: '다온',
    age: 25,
    mbti: 'ISFJ',
    smoking: S0,
    drinking: D0,
    requiredQA: [
      { question: '자기소개', answer: '소소한 기록을 좋아하는 사람. 집밥과 따뜻한 차, 그리고 담요를 사랑해요.' },
      { question: '연인에게 바라는 한 가지는?', answer: '약속을 지켜주는 신뢰.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '배려 깊은 말투.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '홈카페 만들어서 디저트 굽기' },
      { question: '연애에서 중요한 것', answer: '안정감 80' },
    ],
  },
  {
    profileId: 105,
    nickname: '민재',
    age: 27,
    mbti: 'ISTP',
    smoking: S1,
    drinking: D1,
    requiredQA: [
      { question: '자기소개', answer: '운동과 캠핑을 즐기는 현실주의자. 해결사 타입입니다.' },
      { question: '연인에게 바라는 한 가지는?', answer: '서로의 공간을 존중하는 태도.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '확신에 찬 눈빛.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '차박 + 별 관측' },
      { question: '연애에서 중요한 것', answer: '자유 50 / 책임 50' },
    ],
  },
  {
    profileId: 106,
    nickname: '라헬',
    age: 22,
    mbti: 'ENFP',
    smoking: S0,
    drinking: D1,
    requiredQA: [
      { question: '자기소개', answer: '새로운 취미를 도전하는 걸 좋아해요. 최근엔 도예 시작!' },
      { question: '연인에게 바라는 한 가지는?', answer: '함께 놀아줄 호기심.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '장난스러운 미소.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '플리 공유하며 동네 산책' },
      { question: '연애에서 중요한 것', answer: '유쾌한 에너지' },
    ],
  },
  {
    profileId: 107,
    nickname: '준오',
    age: 29,
    mbti: 'ESFJ',
    smoking: S2,
    drinking: D2,
    requiredQA: [
      { question: '자기소개', answer: '친구들과의 모임을 즐기는 분위기 메이커. 요리 잘합니다.' },
      { question: '연인에게 바라는 한 가지는?', answer: '서로의 사람들을 존중해 주기.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '상대를 편안하게 하는 말투.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '집들이 겸 커플 쿠킹' },
      { question: '연애에서 중요한 것', answer: '배려 70 / 재미 30' },
    ],
  },
  {
    profileId: 108,
    nickname: '채린',
    age: 21,
    mbti: 'INTJ',
    smoking: S0,
    drinking: D0,
    requiredQA: [
      { question: '자기소개', answer: '책과 다큐를 좋아하는 현실주의자. 계획 세우는 걸 즐겨요.' },
      { question: '연인에게 바라는 한 가지는?', answer: '장기 목표를 함께 상의해주는 파트너십.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '논리적인 대화와 책임감.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '북카페에서 하루 종일' },
      { question: '연애에서 중요한 것', answer: '신뢰와 성장' },
    ],
  },
  {
    profileId: 109,
    nickname: '도윤',
    age: 28,
    mbti: 'ISFP',
    smoking: S1,
    drinking: D1,
    requiredQA: [
      { question: '자기소개', answer: '사진 찍으며 여행하는 자유 영혼. 말보다는 행동으로 표현해요.' },
      { question: '연인에게 바라는 한 가지는?', answer: '충동적인 여행 제안도 즐겨주기.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '자연스러운 스킨십과 배려.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '노을 보며 강변 산책' },
      { question: '연애에서 중요한 것', answer: '분위기와 공감' },
    ],
  },
  {
    profileId: 110,
    nickname: '서율',
    age: 20,
    mbti: 'ESTP',
    smoking: S0,
    drinking: D2,
    requiredQA: [
      { question: '자기소개', answer: '액티비티 러버! 즉흥 드라이브와 맛집 탐방이 삶의 낙.' },
      { question: '연인에게 바라는 한 가지는?', answer: '함께 뛰어놀 준비가 되어있는 것.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '웃을 때 눈이 예쁜 사람.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '놀이공원 올데이' },
      { question: '연애에서 중요한 것', answer: '스릴 60 / 안정 40' },
    ],
  },
  {
    profileId: 111,
    nickname: '재이',
    age: 24,
    mbti: 'INFJ',
    smoking: S0,
    drinking: D0,
    requiredQA: [
      { question: '자기소개', answer: '조용한 카페와 글쓰기를 사랑하는 사람. 깊은 대화를 좋아해요.' },
      { question: '연인에게 바라는 한 가지는?', answer: '마음을 천천히 공유할 시간.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '따뜻한 눈맞춤.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '산책하며 플레이리스트 공유' },
      { question: '연애에서 중요한 것', answer: '진정성 90' },
    ],
  },
  {
    profileId: 112,
    nickname: '아인',
    age: 22,
    mbti: 'ENFJ',
    smoking: S1,
    drinking: D1,
    requiredQA: [
      { question: '자기소개', answer: '사람 만나는 걸 좋아하는 활동가. 공연기획을 준비 중이에요.' },
      { question: '연인에게 바라는 한 가지는?', answer: '일정을 존중해주고 응원해주기.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '무대 뒤에서 조용히 챙겨주는 모습.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '소극장 연극 관람' },
      { question: '연애에서 중요한 것', answer: '응원과 동행' },
    ],
  },
  {
    profileId: 113,
    nickname: '현준',
    age: 27,
    mbti: 'ESTJ',
    smoking: S2,
    drinking: D2,
    requiredQA: [
      { question: '자기소개', answer: '계획형 리더 타입. 운동과 자기계발을 꾸준히 합니다.' },
      { question: '연인에게 바라는 한 가지는?', answer: '서로의 루틴을 존중하며 함께 성장하기.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '꾸준함과 책임감.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: 'PT 끝나고 건강식 요리' },
      { question: '연애에서 중요한 것', answer: '목표 공유' },
    ],
  },
  {
    profileId: 114,
    nickname: '유림',
    age: 23,
    mbti: 'ISFP',
    smoking: S0,
    drinking: D0,
    requiredQA: [
      { question: '자기소개', answer: '플로리스트 준비 중. 꽃과 향을 좋아해요.' },
      { question: '연인에게 바라는 한 가지는?', answer: '작은 변화도 함께 기뻐해주기.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '손편지와 따뜻한 목소리.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '꽃시장 데이트' },
      { question: '연애에서 중요한 것', answer: '사소한 관심' },
    ],
  },
  {
    profileId: 115,
    nickname: '세민',
    age: 26,
    mbti: 'ENTJ',
    smoking: S1,
    drinking: D1,
    requiredQA: [
      { question: '자기소개', answer: '스타트업 운영 중인 도전가. 효율과 스피드를 중시해요.' },
      { question: '연인에게 바라는 한 가지는?', answer: '문제 생기면 바로 솔루션 회의하기.' },
      { question: '나를 설레게 하는 이성의 매력?', answer: '자신감 있는 말투와 실행력.' },
    ],
    optionalQA: [
      { question: '이상적인 데이트', answer: '브런치 미팅 후 재밌는 워크숍' },
      { question: '연애에서 중요한 것', answer: '협력과 추진력' },
    ],
  },
];

export type MockFilterInput = {
  minAge: number;
  maxAge: number;
  smoking: SmokingHabit[];
  drinking: DrinkingHabit[];
  limit: number;
};

const matches = <T extends { age: number; smoking: SmokingHabit; drinking: DrinkingHabit }>(
  item: T,
  f: MockFilterInput,
) => {
  if (item.age < f.minAge || item.age > f.maxAge) return false;
  if (!f.smoking.includes(item.smoking)) return false;
  if (!f.drinking.includes(item.drinking)) return false;
  return true;
};

const pickN = <T,>(arr: T[], n: number) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

export const mockFetchProfileCards = async (f: MockFilterInput): Promise<UiProfileCard[]> => {
  await sleep(250);
  const filtered = PROFILES.filter(p => matches(p, f));
  return pickN(filtered.length ? filtered : PROFILES, f.limit);
};

export const mockFetchLoveCodeCards = async (f: MockFilterInput): Promise<UiLoveCodeCard[]> => {
  await sleep(250);
  const filtered = LOVECODES.filter(p => matches(p, f));
  return pickN(filtered.length ? filtered : LOVECODES, f.limit);
};

export const mockPurchaseExtraProfilesByTing = async (additionalProfileNumByTing: number) => {
  await sleep(200);
  if (additionalProfileNumByTing !== 1 && additionalProfileNumByTing !== 5) {
    throw new Error('additionalProfileNumByTing must be 1 or 5');
  }
  return true;
};
