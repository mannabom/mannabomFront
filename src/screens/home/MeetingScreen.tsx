import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { API_BASE_URL, API_ENDPOINTS_LIST } from '../../config/api';
import { DISTRICT_OPTIONS, REGION_OPTIONS, normalizeSido, normalizeSigungu } from '../../constants/koreaRegions';
import { datingApiService } from '../../services/DatingApiService';
import { meetingApiService } from '../../services/MeetingApiService';
import apiClient from '../../services/apiClient';
import { Gender } from '../../types/KakaoAPI';
import {
  MeetingAgeRange,
  MeetingChatRoomInfo,
  MeetingFilterSettings,
  MeetingMemberProfile,
  MeetingRegion,
  MeetingRoomSummary,
  MeetingStatus,
  MeetingTeamMember,
  MyMeetingStatus,
} from '../../types/MeetingAPI';
import { getPhysicalProfile } from '../../utils/ProfileStorage';

const vipBadgeImg = require('../../assets/images/VIP.png');
const subBadgeImg = require('../../assets/images/SUB.png');
const tingIconImg = require('../../assets/images/Ting.png');
const eventTingIconImg = require('../../assets/images/Eventting.png');
const filterImg = require('../../assets/images/Filter.png');
const benchImg = require('../../assets/images/bench.png');

const DEFAULT_AGE_RANGE: MeetingAgeRange = { min: 20, max: 29 };
const DEFAULT_MEMBER_COUNTS = [2, 3, 4];
const DEFAULT_CREATE_MEMBER_COUNT = 2;
const DEFAULT_REGION: MeetingRegion = {
  sido: '서울특별시',
  sigungu: '강남구',
};
const SCREEN_H = Dimensions.get('window').height;

type CreateDraft = {
  region: MeetingRegion;
  ageRange: MeetingAgeRange;
  maxMembers: number;
};

type JoinMode = 'general' | 'fast';

type JoinContext =
  | {
      source: 'room';
      mode: JoinMode;
      room: MeetingRoomSummary;
    }
  | {
      source: 'code';
      mode: 'general';
      roomCode: string;
    };

type ProfileModalState = {
  room: MeetingRoomSummary;
  members: MeetingMemberProfile[];
  loading: boolean;
  error?: string;
};

type ErrorModalState = {
  title: string;
  message: string;
};

type InsufficientModalState = {
  mode: 'join' | 'create';
  required: number;
};

type MeetingUserContext = {
  userId?: number;
  nickname: string;
  gender: Gender;
  region: MeetingRegion;
  profileImage: string;
  isSubscribed: boolean;
};

const toAbsoluteUri = (value?: string) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const toNumber = (value: any, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const shortenSido = (sido: string) =>
  String(sido)
    .replace('특별자치도', '')
    .replace('특별자치시', '')
    .replace('특별시', '')
    .replace('광역시', '')
    .replace('도', '');

const formatRegionLabel = (region?: MeetingRegion) => {
  const sido = String(region?.sido ?? '').trim();
  const sigungu = String(region?.sigungu ?? '').trim();

  if (!sido || !sigungu || sigungu === '상관없음') {
    return '상관없음';
  }

  return `${shortenSido(sido)} ${sigungu}`;
};

const formatAgeRangeLabel = (ageRange?: MeetingAgeRange) => {
  const min = toNumber(ageRange?.min, 20);
  const max = toNumber(ageRange?.max, 29);
  if (min <= 20 && max >= 29) return '상관없음';
  return `${min}~${max}`;
};

const buildRoomCardTitle = (room: MeetingRoomSummary) =>
  `${formatRegionLabel(room.region)}/${formatAgeRangeLabel(room.ageRangeDto)}/${room.roomName}`;

const buildDefaultFilters = (region?: MeetingRegion): MeetingFilterSettings => {
  const sido = normalizeSido(region?.sido || DEFAULT_REGION.sido);
  const districts = DISTRICT_OPTIONS[sido] ?? [];
  const rawSigungu = region?.sigungu || districts[0] || DEFAULT_REGION.sigungu;
  const sigungu = normalizeSigungu(sido, rawSigungu);

  return {
    region: { sido, sigungu },
    ageRange: { ...DEFAULT_AGE_RANGE },
    memberCounts: [...DEFAULT_MEMBER_COUNTS],
  };
};

const buildDefaultCreateDraft = (region?: MeetingRegion): CreateDraft => {
  const filters = buildDefaultFilters(region);
  return {
    region: filters.region,
    ageRange: filters.ageRange,
    maxMembers: DEFAULT_CREATE_MEMBER_COUNT,
  };
};

const createRoomName = (draft: CreateDraft) =>
  `${formatRegionLabel(draft.region)} ${draft.maxMembers}인 미팅방`;

const getEntryCost = (gender: Gender, mode: JoinMode | 'create') => {
  const normalizedMode: JoinMode = mode === 'fast' ? 'fast' : 'general';

  if (gender === Gender.FEMALE) {
    return normalizedMode === 'fast' ? 10 : 30;
  }

  return normalizedMode === 'fast' ? 60 : 80;
};

const calculateMissingTings = (
  gender: Gender,
  mode: JoinMode | 'create',
  tingBalance: number,
  eventTingBalance: number,
) => {
  const baseMode: JoinMode = mode === 'fast' ? 'fast' : 'general';
  const normal = Math.max(0, tingBalance);
  const total = Math.max(0, tingBalance + eventTingBalance);

  if (gender === Gender.FEMALE) {
    const needed = baseMode === 'fast' ? 10 - total : 30 - total;
    return Math.max(needed, 0);
  }

  if (baseMode === 'fast') {
    return Math.max(30 - normal, 60 - total, 0);
  }

  return Math.max(50 - normal, 80 - total, 0);
};

const getWaitingNotice = (gender: Gender) => {
  if (gender === Gender.FEMALE) {
    return {
      intro: '저희 앱은 노쇼와 잠수를 지양합니다. 모두의 소중한 시간을 위해 보증금 제도를 운영합니다.',
      general: '일반 입장: 30팅 (보증금 30)',
      fast: '빠른 입장: 10팅 (보증금 10)',
      footnote: '만남 인증이 완료된 경우, 보증금은 이벤트 팅으로 돌려드립니다!',
    };
  }

  return {
    intro: '저희 앱은 노쇼와 잠수를 지양합니다. 모두의 소중한 시간을 위해 보증금 30팅이 함께 차감됩니다.',
    general: '일반 입장: 80팅 (입장료 50 + 보증금 30)',
    fast: '빠른 입장: 60팅 (입장료 30 + 보증금 30)',
    footnote: '매칭 완료 방에 합류한 뒤 환불이 어려울 수 있으며, 만남 인증 완료 시 보증금은 돌려드립니다.',
  };
};

const getWalletTooltipLines = (gender: Gender) => {
  if (gender === Gender.FEMALE) {
    return [
      '입장 보증금이 먼저 차감됩니다.',
      '만남 인증이 완료되면 이벤트 팅으로 반환됩니다.',
      '위약금 지불에 재화가 우선 사용됩니다.',
    ];
  }

  return [
    '사용자에 따라 결제 가능한 팅이 달라요.',
    '미팅방 입장 비용과 보증금이 함께 차감돼요.',
    '위약금 지불에 재화가 우선 사용됩니다.',
  ];
};

const getJoinModalCopy = (gender: Gender, mode: JoinMode) => {
  if (gender === Gender.FEMALE) {
    if (mode === 'fast') {
      return {
        title: '빠른 미팅 입장하기',
        description:
          '매칭 완료된 방에 추가 입장하는 경우 환불이 불가합니다.\n보증금 10팅이 차감되며, 만남 인증 완료 시 즉시 돌려드립니다.',
      };
    }

    return {
      title: '입장하기',
      description:
        '보증금 30팅이 차감됩니다.\n만남 인증이 완료되면 보증금 30팅은 즉시 돌려드려요. 보증금은 이벤트 팅으로 사용이 가능합니다.',
    };
  }

  if (mode === 'fast') {
    return {
      title: '빠른 미팅 입장하기',
      description:
        '매칭 완료 방에 추가 입장하는 경우 환불이 불가합니다.\n입장료 30팅과 보증금 30팅으로 총 60팅이 차감됩니다.',
    };
  }

  return {
    title: '입장하기',
    description:
      '입장료 50팅과 보증금 30팅으로 총 80팅이 차감됩니다.\n만남 인증이 완료되면 보증금 30팅은 즉시 돌려드려요.',
  };
};

const getMatchingStatusLabel = (status?: MeetingStatus) => {
  switch (status) {
    case 'FULL':
      return '팀 구성 완료';
    case 'MATCHING':
      return '매칭중';
    case 'MATCHED':
      return '매칭 완료';
    case 'RECRUITING':
    default:
      return '매칭중';
  }
};

const isLikelyFastJoinRoom = (room: MeetingRoomSummary) =>
  room.memberInfo.maxCount > 2 &&
  room.memberInfo.currentCount >= room.memberInfo.maxCount - 1;

const toMyMeetingStatus = (roomInfo: MeetingChatRoomInfo): MyMeetingStatus => ({
  hasActiveRoom: true,
  roomId: roomInfo.roomId,
  meetingId: roomInfo.meetingId,
  matchingStatus: roomInfo.matchingStatus,
  roomName: roomInfo.roomName,
  roomCode: roomInfo.roomCode,
  gender: roomInfo.gender,
  region: roomInfo.region,
  memberInfo: roomInfo.memberInfo,
  ageRangeDto: roomInfo.ageRangeDto,
  teamMembers: roomInfo.teamMembers,
  leader: roomInfo.leader,
});

const sortTeamMembers = (
  teamMembers: MyMeetingStatus['teamMembers'],
  context: MeetingUserContext,
) => {
  const members = Array.isArray(teamMembers) ? [...teamMembers] : [];
  return members.sort((a, b) => {
    const aSelf =
      (context.userId && a.userId === context.userId) ||
      (context.nickname && a.nickname === context.nickname);
    const bSelf =
      (context.userId && b.userId === context.userId) ||
      (context.nickname && b.nickname === context.nickname);

    if (aSelf === bSelf) return 0;
    return aSelf ? -1 : 1;
  });
};

const isSelfTeamMember = (
  member: MeetingTeamMember | undefined,
  context: MeetingUserContext,
) =>
  Boolean(
    member &&
      ((context.userId && member.userId === context.userId) ||
        (context.nickname && member.nickname === context.nickname)),
  );

const buildDisplayTeamMembers = (
  room: MyMeetingStatus | null,
  context: MeetingUserContext,
): MeetingTeamMember[] => {
  const sortedMembers = sortTeamMembers(room?.teamMembers, context);
  const hasSelf = sortedMembers.some(
    member =>
      (context.userId && member.userId === context.userId) ||
      (context.nickname && member.nickname === context.nickname),
  );

  if (!room?.hasActiveRoom || hasSelf) {
    return sortedMembers;
  }

  return [
    {
      userId: context.userId ?? -1,
      nickname: context.nickname || '나',
      profileImage: context.profileImage,
      leader: Boolean(room.leader),
    },
    ...sortedMembers,
  ];
};

const parseApiMessage = (error: any) =>
  String(
    error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message ??
      '',
  );

const isRoomFullError = (error: any) => {
  const message = parseApiMessage(error);
  return /가득|인원|정원|full/i.test(message);
};

const isRoomNotFoundError = (error: any) => {
  const message = parseApiMessage(error);
  return /존재|없는 방|사라졌|not found/i.test(message);
};

const isNoRoomListError = (error: any) => {
  const status = error?.response?.status;
  const message = parseApiMessage(error);

  return (
    status === 404 ||
    /조건.*방.*없|방.*없|생성된 방.*없|미팅.*없|meeting.*not.*found|no.*meeting|no.*room/i.test(
      message,
    )
  );
};

const isInsufficientTingError = (error: any) => {
  const message = parseApiMessage(error);
  return /부족|재화|팅/i.test(message);
};

const SilhouetteAvatar = ({ size, borderColor = '#CFCAC8' }: { size: number; borderColor?: string }) => {
  const headSize = size * 0.24;
  const shoulderWidth = size * 0.58;
  const shoulderHeight = size * 0.26;

  return (
    <View style={[styles.silhouetteWrap, { width: size, height: size, borderColor }]}>
      <View
        style={[
          styles.silhouetteHead,
          { width: headSize, height: headSize, borderColor },
        ]}
      />
      <View
        style={[
          styles.silhouetteShoulder,
          {
            width: shoulderWidth,
            height: shoulderHeight,
            borderColor,
            borderTopWidth: size * 0.042,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initializationErrorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  initializationErrorTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  initializationErrorBody: {
    color: '#777777',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  initializationRetryButton: {
    minWidth: 140,
    paddingHorizontal: 20,
  },
  waitingContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 26,
  },
  activeContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 26,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  activeTitleRow: {
    marginBottom: 18,
  },
  screenTitle: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  chip: {
    height: 24,
    width: 62,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  chipIcon: {
    width: 11,
    height: 11,
    resizeMode: 'contain',
  },
  vipChip: {
    backgroundColor: '#660099',
  },
  subChip: {
    backgroundColor: '#FFDEE6',
    borderWidth: 1,
    borderColor: '#00000018',
  },
  vipChipText: {
    color: '#F0C22D',
    fontSize: 12,
    fontWeight: '900',
  },
  subChipText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
  },
  balancePanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    width: 66,
  },
  balanceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
  },
  balanceIcon: {
    width: 19,
    height: 19,
    resizeMode: 'contain',
  },
  balanceNumber: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 2,
  },
  tooltipDismissLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9,
  },
  walletTooltip: {
    position: 'absolute',
    top: 58,
    right: 24,
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7E1DF',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  walletTooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  walletTooltipTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '800',
  },
  walletTooltipClose: {
    color: '#6B7280',
    fontSize: 24,
    lineHeight: 24,
  },
  walletTooltipLine: {
    color: '#333333',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  roomsPanel: {
    position: 'relative',
    backgroundColor: '#FFF8FA',
    borderRadius: 20,
    minHeight: 344,
    marginTop: 18,
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 18,
  },
  filterButton: {
    position: 'absolute',
    top: 14,
    right: 12,
    zIndex: 2,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  roomsLoadingWrap: {
    minHeight: 290,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCardsList: {
    paddingTop: 28,
    gap: 12,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7D9D8',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  roomCardTitle: {
    color: '#191919',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  roomCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  roomAvatarsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 60,
  },
  roomAvatarItem: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  initialAvatar: {
    backgroundColor: '#A9C8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  roomCardActions: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profilePreviewButton: {
    marginBottom: 8,
  },
  profilePreviewButtonText: {
    color: '#7A7A7A',
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    minWidth: 106,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFB9C8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabledJoinButton: {
    backgroundColor: '#DDDDDD',
  },
  joinButtonText: {
    color: '#452936',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledJoinButtonText: {
    color: '#4B4B4B',
  },
  disabledMutedText: {
    color: '#B3B3B3',
  },
  fastJoinCaption: {
    color: '#FF6E85',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  emptyStateWrap: {
    minHeight: 290,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 22,
  },
  benchImage: {
    width: 118,
    height: 118,
    resizeMode: 'contain',
    opacity: 0.6,
    marginBottom: 18,
  },
  emptyStateText: {
    color: '#1F1F1F',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  bottomActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
  },
  secondaryActionButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFB8C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#3E2A33',
    fontSize: 18,
    fontWeight: '800',
  },
  noticeCard: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8D0CF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  noticeTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  noticeBody: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 21,
  },
  noticeStar: {
    color: '#F6C343',
  },
  noticeSpacing: {
    marginTop: 12,
  },
  noticeHighlight: {
    color: '#FF7E96',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  noticeFootnote: {
    color: '#333333',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  activeCard: {
    position: 'relative',
    borderRadius: 20,
    backgroundColor: '#FFF8FA',
    minHeight: 310,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 56,
  },
  activeLeaveButton: {
    position: 'absolute',
    top: 22,
    left: 18,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLeaveButtonText: {
    color: '#111111',
    fontSize: 40,
    lineHeight: 40,
    fontWeight: '400',
  },
  activeStatusText: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  activeRoomMeta: {
    color: '#3C3C3C',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  activeRoomSubMeta: {
    color: '#7A7074',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  activeMembersWrap: {
    marginTop: 50,
    gap: 18,
  },
  activeMemberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  activeSingleMemberRow: {
    justifyContent: 'center',
  },
  activeMemberCell: {
    width: 110,
    alignItems: 'center',
  },
  chatButton: {
    alignSelf: 'center',
    minWidth: 132,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFB7C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  chatButtonText: {
    color: '#4C2A35',
    fontSize: 20,
    fontWeight: '800',
  },
  silhouetteWrap: {
    borderWidth: 2.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  silhouetteHead: {
    borderWidth: 2.5,
    borderRadius: 999,
    marginBottom: 8,
  },
  silhouetteShoulder: {
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  conditionModalCard: {
    maxWidth: 370,
    minHeight: SCREEN_H * 0.6,
  },
  createModalCard: {
    minHeight: SCREEN_H * 0.68,
  },
  modalHeader: {
    marginBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#1F2C55',
    fontSize: 28,
    fontWeight: '900',
  },
  modalCloseText: {
    color: '#3B3B3B',
    fontSize: 30,
    lineHeight: 30,
  },
  conditionContent: {
    paddingTop: 6,
    paddingBottom: 8,
  },
  conditionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  conditionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionSectionTitle: {
    color: '#1F2C55',
    fontSize: 17,
    fontWeight: '800',
  },
  conditionAgeTitle: {
    marginTop: 10,
    marginBottom: 10,
  },
  conditionMemberTitle: {
    marginTop: 20,
    marginBottom: 12,
  },
  defaultAction: {
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  defaultActionText: {
    color: '#404040',
    fontSize: 12,
    fontWeight: '700',
  },
  infoDotButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#778197',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDotText: {
    color: '#778197',
    fontSize: 11,
    fontWeight: '800',
  },
  regionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdownMenusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  dropdownMenuSlot: {
    flex: 1,
  },
  dropdownButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.2,
    borderColor: '#AEB4BE',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  dropdownButtonText: {
    color: '#5B6270',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownArrow: {
    color: '#5B6270',
    fontSize: 17,
  },
  dropdownMenuInline: {
    borderWidth: 1.2,
    borderColor: '#AEB4BE',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    maxHeight: 210,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownMenuItemText: {
    color: '#5B6270',
    fontSize: 16,
  },
  inlineGuideCard: {
    borderRadius: 14,
    backgroundColor: '#FFF7F9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  inlineGuideTitle: {
    color: '#1F2C55',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  inlineGuideText: {
    color: '#444444',
    fontSize: 13,
    lineHeight: 19,
  },
  sliderWrap: {
    height: 52,
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  ageBubble: {
    position: 'absolute',
    top: 0,
    width: 30,
    alignItems: 'center',
  },
  ageBubbleText: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '700',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#C8CDD6',
    marginTop: 18,
  },
  sliderTrackSelected: {
    position: 'absolute',
    top: 35,
    height: 4,
    backgroundColor: '#F58DA2',
    borderRadius: 999,
  },
  sliderThumb: {
    position: 'absolute',
    top: 27,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B8BEC8',
  },
  sliderScaleRow: {
    height: 0,
    overflow: 'hidden',
  },
  hiddenSlider: {
    width: '100%',
    height: 0,
    opacity: 0,
  },
  memberPillRow: {
    flexDirection: 'row',
    gap: 12,
  },
  memberPill: {
    minWidth: 48,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: '#FDECEF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  memberPillActive: {
    backgroundColor: '#FFB5C4',
  },
  memberPillText: {
    color: '#563845',
    fontSize: 16,
    fontWeight: '700',
  },
  memberPillTextActive: {
    color: '#2B1821',
  },
  conditionQuestionText: {
    color: '#43506E',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 28,
    marginBottom: 16,
  },
  filterFooterRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#DADADA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#677085',
    fontSize: 18,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFB4C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonWide: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFB4C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  disabledPrimaryButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#452936',
    fontSize: 18,
    fontWeight: '800',
  },
  createConfirmButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFB4C4',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  createConfirmText: {
    color: '#452936',
    fontSize: 20,
    fontWeight: '800',
  },
  createCostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  createCostChipText: {
    color: '#6D5363',
    fontSize: 18,
    fontWeight: '800',
  },
  roomCodeModalCard: {
    maxWidth: 350,
  },
  roomCodeInput: {
    height: 52,
    backgroundColor: '#F4F7FB',
    borderRadius: 26,
    paddingHorizontal: 18,
    color: '#374151',
    fontSize: 18,
    marginTop: 24,
  },
  joinModalCard: {
    maxWidth: 340,
  },
  joinDescription: {
    color: '#262626',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 10,
  },
  joinConfirmButton: {
    alignSelf: 'center',
    minWidth: 154,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFB4C4',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 18,
  },
  joinConfirmButtonText: {
    color: '#452936',
    fontSize: 19,
    fontWeight: '800',
  },
  joinCostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    gap: 2,
  },
  joinCostChipText: {
    color: '#6D5363',
    fontSize: 18,
    fontWeight: '800',
  },
  smallTingIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  simpleModalCard: {
    maxWidth: 320,
  },
  simpleModalBody: {
    color: '#2B2B2B',
    fontSize: 18,
    lineHeight: 27,
    marginTop: 14,
  },
  profileModalCard: {
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#FFC0CF',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  profileModalTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },
  profileModalSubtitle: {
    color: '#8D858A',
    fontSize: 12,
    marginTop: 2,
  },
  profileLoadingIndicator: {
    marginTop: 8,
  },
  profileListWrap: {
    marginTop: 10,
    gap: 12,
  },
  profileEmptyText: {
    color: '#8D858A',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  profileItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileItemRowFemale: {
    flexDirection: 'row-reverse',
  },
  profileItemTextWrap: {
    marginLeft: 12,
  },
  profileItemTextWrapFemale: {
    marginLeft: 0,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  profileItemName: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
  },
  profileItemNameFemale: {
    textAlign: 'right',
  },
  profileItemMeta: {
    color: '#8C8589',
    fontSize: 13,
    marginTop: 2,
  },
  profileItemMetaFemale: {
    textAlign: 'right',
  },
});

const AvatarCircle = ({
  uri,
  size,
  fallbackLabel,
  placeholder,
}: {
  uri?: string;
  size: number;
  fallbackLabel?: string;
  placeholder?: boolean;
}) => {
  const absoluteUri = toAbsoluteUri(uri);

  if (placeholder) {
    return <SilhouetteAvatar size={size} />;
  }

  if (absoluteUri) {
    return <Image source={{ uri: absoluteUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View style={[styles.initialAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initialAvatarText, { fontSize: Math.max(16, size * 0.28) }]}>
        {fallbackLabel || '?'}
      </Text>
    </View>
  );
};

const MeetingModal = ({
  visible,
  onClose,
  children,
  cardStyle,
  dismissOnBackdrop = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  cardStyle?: object;
  dismissOnBackdrop?: boolean;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      style={styles.modalBackdrop}
      onPress={dismissOnBackdrop ? onClose : undefined}
    >
      <Pressable style={[styles.modalCard, cardStyle]} onPress={() => {}}>
        {children}
      </Pressable>
    </Pressable>
  </Modal>
);

const MeetingConditionsModal = ({
  visible,
  title,
  questionText,
  variant,
  initialFilters,
  initialCreateDraft,
  defaultRegion,
  confirmLabel,
  confirmCost,
  onClose,
  onApplyFilters,
  onCreateRoom,
  submitting,
}: {
  visible: boolean;
  title: string;
  questionText: string;
  variant: 'filter' | 'create';
  initialFilters?: MeetingFilterSettings;
  initialCreateDraft?: CreateDraft;
  defaultRegion: MeetingRegion;
  confirmLabel: string;
  confirmCost?: number;
  onClose: () => void;
  onApplyFilters?: (filters: MeetingFilterSettings) => void;
  onCreateRoom?: (draft: CreateDraft) => void;
  submitting?: boolean;
}) => {
  const isCreate = variant === 'create';

  const [sido, setSido] = useState(defaultRegion.sido);
  const [sigungu, setSigungu] = useState(defaultRegion.sigungu);
  const [ageRange, setAgeRange] = useState(DEFAULT_AGE_RANGE);
  const [selectedCounts, setSelectedCounts] = useState<number[]>(DEFAULT_MEMBER_COUNTS);
  const [openMenu, setOpenMenu] = useState<'sido' | 'sigungu' | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const ageRangeRef = useRef(ageRange);
  const minStartRef = useRef(DEFAULT_AGE_RANGE.min);
  const maxStartRef = useRef(DEFAULT_AGE_RANGE.max);

  const THUMB = 18;
  const MIN_AGE = 20;
  const MAX_AGE = 29;
  const STEP_COUNT = 9;
  const usableWidth = Math.max(1, trackWidth - THUMB);

  const districtOptions = useMemo(() => {
    const normalizedSido = normalizeSido(sido || defaultRegion.sido);
    const districts = DISTRICT_OPTIONS[normalizedSido] ?? [];
    return ['상관없음', ...districts];
  }, [defaultRegion.sido, sido]);

  const selectedMaxMembers = selectedCounts[0] ?? DEFAULT_CREATE_MEMBER_COUNT;

  useEffect(() => {
    if (!visible) return;

    if (isCreate && initialCreateDraft) {
      setSido(normalizeSido(initialCreateDraft.region.sido || defaultRegion.sido));
      setSigungu(initialCreateDraft.region.sigungu || defaultRegion.sigungu);
      setAgeRange(initialCreateDraft.ageRange);
      setSelectedCounts([initialCreateDraft.maxMembers]);
    } else if (!isCreate && initialFilters) {
      setSido(normalizeSido(initialFilters.region.sido || defaultRegion.sido));
      setSigungu(initialFilters.region.sigungu || defaultRegion.sigungu);
      setAgeRange(initialFilters.ageRange);
      setSelectedCounts(initialFilters.memberCounts.length ? initialFilters.memberCounts : DEFAULT_MEMBER_COUNTS);
    } else {
      setSido(defaultRegion.sido);
      setSigungu(defaultRegion.sigungu);
      setAgeRange(DEFAULT_AGE_RANGE);
      setSelectedCounts(isCreate ? [DEFAULT_CREATE_MEMBER_COUNT] : DEFAULT_MEMBER_COUNTS);
    }

    setOpenMenu(null);
    setShowGuide(false);
  }, [defaultRegion, initialCreateDraft, initialFilters, isCreate, visible]);

  useEffect(() => {
    ageRangeRef.current = ageRange;
  }, [ageRange]);

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const valueToX = useCallback(
    (value: number) => {
      const ratio = (value - MIN_AGE) / (MAX_AGE - MIN_AGE);
      return ratio * usableWidth;
    },
    [usableWidth],
  );

  const snapAge = (value: number) => clamp(Math.round(value), MIN_AGE, MAX_AGE);

  const minX = valueToX(ageRange.min);
  const maxX = valueToX(ageRange.max);

  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        minStartRef.current = ageRangeRef.current.min;
      },
      onPanResponderMove: (_, gesture) => {
        if (!trackWidthRef.current) return;
        const stepPx = Math.max(1, (trackWidthRef.current - THUMB) / STEP_COUNT);
        const delta = Math.round(gesture.dx / stepPx);
        const nextMin = clamp(minStartRef.current + delta, MIN_AGE, ageRangeRef.current.max);
        setAgeRange(prev => ({ ...prev, min: snapAge(nextMin) }));
      },
      onPanResponderRelease: () => {
        setAgeRange(prev => ({ ...prev, min: snapAge(prev.min) }));
      },
    }),
  ).current;

  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        maxStartRef.current = ageRangeRef.current.max;
      },
      onPanResponderMove: (_, gesture) => {
        if (!trackWidthRef.current) return;
        const stepPx = Math.max(1, (trackWidthRef.current - THUMB) / STEP_COUNT);
        const delta = Math.round(gesture.dx / stepPx);
        const nextMax = clamp(maxStartRef.current + delta, ageRangeRef.current.min, MAX_AGE);
        setAgeRange(prev => ({ ...prev, max: snapAge(nextMax) }));
      },
      onPanResponderRelease: () => {
        setAgeRange(prev => ({ ...prev, max: snapAge(prev.max) }));
      },
    }),
  ).current;

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    trackWidthRef.current = nextWidth;
    setTrackWidth(nextWidth);
  };

  const handleReset = () => {
    setSido(defaultRegion.sido);
    setSigungu(defaultRegion.sigungu);
    setAgeRange({ ...DEFAULT_AGE_RANGE });
    setSelectedCounts(isCreate ? [DEFAULT_CREATE_MEMBER_COUNT] : [...DEFAULT_MEMBER_COUNTS]);
  };

  const handleSelectSido = (value: string) => {
    const normalizedSido = normalizeSido(value);
    setSido(normalizedSido);
    const nextDistricts = DISTRICT_OPTIONS[normalizedSido] ?? [];
    const fallbackSigungu = sigungu && nextDistricts.includes(sigungu) ? sigungu : nextDistricts[0] || '상관없음';
    setSigungu(normalizeSigungu(normalizedSido, fallbackSigungu));
    setOpenMenu(null);
  };

  const toggleMemberCount = (count: number) => {
    if (isCreate) {
      setSelectedCounts([count]);
      return;
    }

    setSelectedCounts(prev => {
      if (prev.includes(count)) {
        return prev.length > 1 ? prev.filter(item => item !== count) : prev;
      }
      return [...prev, count].sort((a, b) => a - b);
    });
  };

  const handleConfirm = () => {
    const nextRegion = {
      sido,
      sigungu,
    };

    if (isCreate && onCreateRoom) {
      onCreateRoom({
        region: nextRegion,
        ageRange,
        maxMembers: selectedMaxMembers,
      });
      return;
    }

    if (!isCreate && onApplyFilters) {
      onApplyFilters({
        region: nextRegion,
        ageRange,
        memberCounts: [...selectedCounts].sort((a, b) => a - b),
      });
    }
  };

  const renderDropdownMenu = (
    options: readonly string[],
    onSelect: (option: string) => void,
  ) => (
    <ScrollView
      style={styles.dropdownMenuInline}
      nestedScrollEnabled
      showsVerticalScrollIndicator
    >
      {options.map(option => (
        <TouchableOpacity
          key={option}
          style={styles.dropdownMenuItem}
          onPress={() => onSelect(option)}
        >
          <Text style={styles.dropdownMenuItemText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <MeetingModal
      visible={visible}
      onClose={onClose}
      cardStyle={[styles.conditionModalCard, isCreate && styles.createModalCard]}
    >
      <View style={styles.modalHeader}>
        <View style={styles.modalHeaderRow}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={styles.modalCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.conditionContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.conditionTopRow}>
          <View style={styles.conditionLabelRow}>
            <Text style={styles.conditionSectionTitle}>
              {isCreate ? '매칭 지역' : '지역'}
            </Text>
            {isCreate && (
              <TouchableOpacity
                style={styles.infoDotButton}
                onPress={() => setShowGuide(prev => !prev)}
              >
                <Text style={styles.infoDotText}>i</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.defaultAction} onPress={handleReset}>
            <Text style={styles.defaultActionText}>기본값 설정</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.regionButtonsRow}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setOpenMenu(prev => (prev === 'sido' ? null : 'sido'))}
          >
            <Text style={styles.dropdownButtonText}>{sido}</Text>
            <Text style={styles.dropdownArrow}>⌄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setOpenMenu(prev => (prev === 'sigungu' ? null : 'sigungu'))}
          >
            <Text style={styles.dropdownButtonText}>{sigungu}</Text>
            <Text style={styles.dropdownArrow}>{openMenu === 'sigungu' ? '⌃' : '⌄'}</Text>
          </TouchableOpacity>
        </View>

        {openMenu && (
          <View style={styles.dropdownMenusRow}>
            <View style={styles.dropdownMenuSlot}>
              {openMenu === 'sido'
                ? renderDropdownMenu(REGION_OPTIONS, handleSelectSido)
                : null}
            </View>
            <View style={styles.dropdownMenuSlot}>
              {openMenu === 'sigungu'
                ? renderDropdownMenu(districtOptions, option => {
                    setSigungu(option);
                    setOpenMenu(null);
                  })
                : null}
            </View>
          </View>
        )}

        {showGuide && isCreate && (
          <Pressable style={styles.inlineGuideCard} onPress={() => setShowGuide(false)}>
            <Text style={styles.inlineGuideTitle}>안내</Text>
            <Text style={styles.inlineGuideText}>
              같은 지역과 나이대, 같은 인원 수 조건의 팀끼리 빠르게 매칭될 수 있도록 방을
              생성해요.
            </Text>
          </Pressable>
        )}

        <Text style={[styles.conditionSectionTitle, styles.conditionAgeTitle]}>
          {isCreate ? '입장 가능 연령' : '나이대'}
        </Text>

        <View style={styles.sliderWrap} onLayout={onTrackLayout}>
          {trackWidth > 0 && (
            <>
              <View style={[styles.ageBubble, { left: minX + THUMB / 2 - 15 }]}>
                <Text style={styles.ageBubbleText}>{ageRange.min}</Text>
              </View>
              <View style={[styles.ageBubble, { left: maxX + THUMB / 2 - 15 }]}>
                <Text style={styles.ageBubbleText}>{ageRange.max}</Text>
              </View>
            </>
          )}

          <View style={styles.sliderTrack} />
          {trackWidth > 0 && (
            <View
              style={[
                styles.sliderTrackSelected,
                {
                  left: minX + THUMB / 2,
                  width: Math.max(0, maxX - minX),
                },
              ]}
            />
          )}
          <View style={[styles.sliderThumb, { left: minX }]} {...minPan.panHandlers} />
          <View style={[styles.sliderThumb, { left: maxX }]} {...maxPan.panHandlers} />
        </View>

        <View style={styles.sliderScaleRow}>
          <Slider
            style={styles.hiddenSlider}
            minimumValue={20}
            maximumValue={29}
            step={1}
            value={ageRange.min}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor="transparent"
            onValueChange={value => setAgeRange(prev => ({ ...prev, min: Math.min(value, prev.max) }))}
          />
          <Slider
            style={styles.hiddenSlider}
            minimumValue={20}
            maximumValue={29}
            step={1}
            value={ageRange.max}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor="transparent"
            onValueChange={value => setAgeRange(prev => ({ ...prev, max: Math.max(value, prev.min) }))}
          />
        </View>

        <Text style={[styles.conditionSectionTitle, styles.conditionMemberTitle]}>
          인원수
        </Text>

        <View style={styles.memberPillRow}>
          {[2, 3, 4].map(count => {
            const active = selectedCounts.includes(count);
            return (
              <TouchableOpacity
                key={count}
                style={[styles.memberPill, active && styles.memberPillActive]}
                onPress={() => toggleMemberCount(count)}
              >
                <Text style={[styles.memberPillText, active && styles.memberPillTextActive]}>
                  {count}인
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.conditionQuestionText}>{questionText}</Text>
      </ScrollView>

      {isCreate ? (
        <TouchableOpacity
          style={[styles.createConfirmButton, submitting && styles.disabledPrimaryButton]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          <Text style={styles.createConfirmText}>{confirmLabel}</Text>
          {typeof confirmCost === 'number' && (
            <View style={styles.createCostChip}>
              <Image source={tingIconImg} style={styles.smallTingIcon} />
              <Text style={styles.createCostChipText}>{confirmCost}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.filterFooterRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.disabledPrimaryButton]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </MeetingModal>
  );
};

const MeetingScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [screenLoading, setScreenLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<'join' | 'create' | null>(null);
  const [leavingRoom, setLeavingRoom] = useState(false);

  const [tingBalance, setTingBalance] = useState(0);
  const [eventTingBalance, setEventTingBalance] = useState(0);
  const [userContext, setUserContext] = useState<MeetingUserContext | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const [filterSettings, setFilterSettings] = useState<MeetingFilterSettings>(
    buildDefaultFilters(DEFAULT_REGION),
  );
  const filterSettingsRef = useRef(filterSettings);
  const filtersInitializedRef = useRef(false);

  const [createDraft, setCreateDraft] = useState<CreateDraft>(
    buildDefaultCreateDraft(DEFAULT_REGION),
  );
  const [activeRoom, setActiveRoom] = useState<MyMeetingStatus | null>(null);
  const [rooms, setRooms] = useState<MeetingRoomSummary[]>([]);

  const [walletTooltipVisible, setWalletTooltipVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [roomCodeModalVisible, setRoomCodeModalVisible] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinContext, setJoinContext] = useState<JoinContext | null>(null);
  const [profileModalState, setProfileModalState] = useState<ProfileModalState | null>(null);
  const [errorModal, setErrorModal] = useState<ErrorModalState | null>(null);
  const [insufficientModal, setInsufficientModal] = useState<InsufficientModalState | null>(null);

  const isVip = tingBalance >= 200;

  useEffect(() => {
    filterSettingsRef.current = filterSettings;
  }, [filterSettings]);

  const refreshWalletAndProfile = useCallback(async (requireCompleteContext = false) => {
    const [walletResult, profileResult, mainPhotoResult, storedProfileResult] = await Promise.allSettled([
      datingApiService.getTingWalletInfo(),
      apiClient.get(API_ENDPOINTS_LIST.USER_PROFILE),
      apiClient.get(API_ENDPOINTS_LIST.USER_MAIN_PHOTO),
      getPhysicalProfile(),
    ]);

    if (walletResult.status === 'fulfilled') {
      setTingBalance(toNumber(walletResult.value?.tingNum));
      setEventTingBalance(toNumber(walletResult.value?.eventTingNum));
    } else if (requireCompleteContext) {
      throw new Error('지갑 정보를 불러오지 못했습니다.');
    }

    const storedProfile =
      storedProfileResult.status === 'fulfilled' ? storedProfileResult.value : null;
    const mainPhotoData =
      mainPhotoResult.status === 'fulfilled'
        ? mainPhotoResult.value?.data?.data ?? mainPhotoResult.value?.data ?? {}
        : {};
    const mainPhotoUrl = toAbsoluteUri(
      mainPhotoData?.photoURL ??
        mainPhotoData?.photoUrl ??
        mainPhotoData?.url ??
        mainPhotoData?.profileImage ??
        mainPhotoData?.profileImageUrl,
    );

    if (profileResult.status === 'fulfilled') {
      const raw = profileResult.value?.data?.data ?? profileResult.value?.data ?? {};
      const rawProfile = raw?.profile ?? {};
      const rawSido =
        raw?.region?.sido ??
        raw?.profile?.region?.sido ??
        raw?.regionSido ??
        storedProfile?.region?.sido;
      const rawSigungu =
        raw?.region?.sigungu ??
        raw?.profile?.region?.sigungu ??
        raw?.regionSigungu ??
        storedProfile?.region?.sigungu;
      const rawGender = String(raw?.gender ?? rawProfile?.gender ?? '').toUpperCase();

      if (!rawSido || !rawSigungu || !Object.values(Gender).includes(rawGender as Gender)) {
        if (requireCompleteContext) {
          setUserContext(null);
          throw new Error('사용자 성별 또는 지역 정보가 없습니다.');
        }
        return null;
      }

      const normalizedSido = normalizeSido(String(rawSido));
      const normalizedSigungu = normalizeSigungu(
        normalizedSido,
        String(rawSigungu),
      );

      const nextContext: MeetingUserContext = {
        userId: raw?.userId ?? raw?.id ?? rawProfile?.userId ?? rawProfile?.profileId,
        nickname: String(raw?.nickName ?? raw?.nickname ?? rawProfile?.nickName ?? rawProfile?.nickname ?? ''),
        gender: rawGender as Gender,
        region: {
          sido: normalizedSido,
          sigungu: normalizedSigungu,
        },
        profileImage:
          mainPhotoUrl ||
          toAbsoluteUri(
            raw?.profileImageUrl ??
              raw?.profileImage ??
              rawProfile?.profileImageUrl ??
              rawProfile?.profileImage,
          ),
        isSubscribed: Boolean(
          raw?.isSubscribed ??
            raw?.subscribed ??
            raw?.profile?.isSubscribed ??
            raw?.profile?.subscribed,
        ),
      };

      setUserContext(nextContext);
      return nextContext;
    }

    if (requireCompleteContext) {
      setUserContext(null);
      throw new Error('사용자 프로필을 불러오지 못했습니다.');
    }
    return null;
  }, []);

  const loadRooms = useCallback(async (nextFilters: MeetingFilterSettings) => {
    setRoomsLoading(true);
    try {
      const result = await meetingApiService.searchRooms(nextFilters);
      setRooms(result.meetings);
    } catch (error) {
      if (__DEV__ && !isNoRoomListError(error)) {
        console.warn('Failed to search meeting rooms', error);
      }
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  const initializeMeetingHome = useCallback(async () => {
    setScreenLoading(true);
    setInitializationError(null);

    try {
      const context = await refreshWalletAndProfile(true);
      if (!context) {
        throw new Error('사용자 정보를 불러오지 못했습니다.');
      }

      if (!filtersInitializedRef.current) {
        const initialFilters = buildDefaultFilters(context.region);
        const initialCreateDraft = buildDefaultCreateDraft(context.region);
        filtersInitializedRef.current = true;
        setFilterSettings(initialFilters);
        filterSettingsRef.current = initialFilters;
        setCreateDraft(initialCreateDraft);
      }

      const status = await meetingApiService.getMyStatus();

      if (status.hasActiveRoom) {
        setActiveRoom(status);
        setRooms([]);
      } else {
        setActiveRoom(null);
        await loadRooms(filterSettingsRef.current);
      }
    } catch (error) {
      if (__DEV__) console.warn('Failed to initialize meeting home', error);
      setUserContext(null);
      setRooms([]);
      setActiveRoom(null);
      setInitializationError('사용자 정보 또는 미팅 정보를 불러오지 못했어요.');
    } finally {
      setScreenLoading(false);
    }
  }, [loadRooms, refreshWalletAndProfile]);

  useFocusEffect(
    useCallback(() => {
      initializeMeetingHome();
      return undefined;
    }, [initializeMeetingHome]),
  );

  const displayRooms = rooms;

  const activeRoomMembers = useMemo(
    () => (userContext ? buildDisplayTeamMembers(activeRoom, userContext) : []),
    [activeRoom, userContext],
  );

  const waitingNotice = useMemo(
    () => (userContext ? getWaitingNotice(userContext.gender) : null),
    [userContext],
  );

  const handleApplyFilters = async (nextFilters: MeetingFilterSettings) => {
    setFilterSettings(nextFilters);
    setFilterModalVisible(false);
    await loadRooms(nextFilters);
  };

  const openProfilesModal = async (room: MeetingRoomSummary) => {
    setProfileModalState({
      room,
      members: [],
      loading: true,
    });

    try {
      const roomId = room.roomId ?? room.meetingId;
      const result = await meetingApiService.getMemberProfiles(roomId);

      setProfileModalState({
        room,
        members: result.members,
        loading: false,
      });
    } catch (error) {
      if (__DEV__) console.warn('Failed to load meeting member profiles', error);
      setProfileModalState({
        room,
        members: [],
        loading: false,
        error: '프로필 정보를 불러오지 못했어요.',
      });
    }
  };

  const openJoinModal = (room: MeetingRoomSummary) => {
    setJoinContext({
      source: 'room',
      room,
      mode: isLikelyFastJoinRoom(room) ? 'fast' : 'general',
    });
  };

  const handleCodeSubmit = () => {
    const trimmedCode = roomCodeInput.trim();
    if (!trimmedCode) return;

    setRoomCodeModalVisible(false);
    setJoinContext({
      source: 'code',
      mode: 'general',
      roomCode: trimmedCode,
    });
  };

  const handleJoinError = (error: any, mode: JoinMode | 'general') => {
    if (!userContext) return;

    const required = calculateMissingTings(
      userContext.gender,
      mode,
      tingBalance,
      eventTingBalance,
    );

    if (isInsufficientTingError(error)) {
      setInsufficientModal({
        mode: 'join',
        required,
      });
      return;
    }

    if (isRoomFullError(error)) {
      setErrorModal({
        title: '입장하기',
        message: '인원이 다 차 입장할 수 없는 방입니다.',
      });
      return;
    }

    if (isRoomNotFoundError(error)) {
      setErrorModal({
        title: '입장하기',
        message: '존재하지 않는 방입니다.',
      });
      return;
    }

    Alert.alert('오류', parseApiMessage(error) || '미팅 방 입장에 실패했어요.');
  };

  const confirmJoin = async () => {
    if (!joinContext || !userContext) return;

    const missing = calculateMissingTings(
      userContext.gender,
      joinContext.mode,
      tingBalance,
      eventTingBalance,
    );

    if (missing > 0) {
      setJoinContext(null);
      setInsufficientModal({
        mode: 'join',
        required: missing,
      });
      return;
    }

    setSubmittingAction('join');

    try {
      const response =
        joinContext.source === 'room'
          ? await meetingApiService.joinRoom({
              meetingId: joinContext.room.meetingId,
            })
          : await meetingApiService.joinRoomByCode({
              roomCode: joinContext.roomCode,
            });

      setJoinContext(null);
      setRoomCodeInput('');
      setActiveRoom(toMyMeetingStatus(response.meetingChatRoomInfo));
      await refreshWalletAndProfile();
    } catch (error) {
      if (__DEV__) console.warn('Failed to join meeting room', error);
      setJoinContext(null);
      handleJoinError(error, joinContext.mode);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleCreateError = (error: any) => {
    if (!userContext) return;

    const required = calculateMissingTings(
      userContext.gender,
      'create',
      tingBalance,
      eventTingBalance,
    );

    if (isInsufficientTingError(error)) {
      setInsufficientModal({
        mode: 'create',
        required,
      });
      return;
    }

    Alert.alert('오류', parseApiMessage(error) || '미팅 방 생성에 실패했어요.');
  };

  const confirmCreateRoom = async (draft: CreateDraft) => {
    if (!userContext) return;

    setCreateDraft(draft);
    const missing = calculateMissingTings(
      userContext.gender,
      'create',
      tingBalance,
      eventTingBalance,
    );

    if (missing > 0) {
      setCreateModalVisible(false);
      setInsufficientModal({
        mode: 'create',
        required: missing,
      });
      return;
    }

    setSubmittingAction('create');

    try {
      const response = await meetingApiService.createRoom({
        roomName: createRoomName(draft),
        region: draft.region,
        ageRange: draft.ageRange,
        maxMembers: draft.maxMembers,
        meetingType: 'GENERAL',
      });

      setCreateModalVisible(false);
      setActiveRoom(toMyMeetingStatus(response.meetingChatRoomInfo));
      await refreshWalletAndProfile();
    } catch (error) {
      if (__DEV__) console.warn('Failed to create meeting room', error);
      setCreateModalVisible(false);
      handleCreateError(error);
    } finally {
      setSubmittingAction(null);
    }
  };

  const leaveActiveRoom = async () => {
    const roomId = activeRoom?.roomId ?? activeRoom?.meetingId;
    if (!roomId || leavingRoom) return;

    if (activeRoom?.matchingStatus === 'MATCHING' || activeRoom?.matchingStatus === 'MATCHED') {
      Alert.alert(
        '안내',
        '현재 매칭 중인 상태여서 나가실 수 없습니다.\n매칭 취소 후에 다시 시도해 주세요.',
      );
      return;
    }

    setLeavingRoom(true);

    try {
      await meetingApiService.leaveRoom({ roomId });
      setActiveRoom(null);
      await refreshWalletAndProfile();
      await loadRooms(filterSettingsRef.current);
    } catch (error) {
      if (__DEV__) console.warn('Failed to leave meeting room', error);
      if (isRoomNotFoundError(error)) {
        setActiveRoom(null);
        await refreshWalletAndProfile();
        await loadRooms(filterSettingsRef.current);
        Alert.alert('안내', '이미 종료되었거나 찾을 수 없는 미팅 방이라 목록으로 돌아갑니다.');
        return;
      }

      Alert.alert(
        '오류',
        parseApiMessage(error) || '미팅 방 나가기에 실패했어요.',
      );
    } finally {
      setLeavingRoom(false);
    }
  };

  const handleLeaveActiveRoom = () => {
    if (leavingRoom) return;

    Alert.alert(
      '미팅 방 나가기',
      '현재 미팅 방에서 나가시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: leaveActiveRoom },
      ],
    );
  };

  const renderRoomCard = (room: MeetingRoomSummary) => {
    const disabled = String(room.meetingStatus).toUpperCase() === 'MATCHING';
    const fastJoin = !disabled && isLikelyFastJoinRoom(room);

    return (
      <View key={`${room.meetingId}-${room.roomName}`} style={styles.roomCard}>
        <Text style={styles.roomCardTitle}>{buildRoomCardTitle(room)}</Text>
        <View style={styles.roomCardContent}>
          <View style={styles.roomAvatarsWrap}>
            {Array.from({ length: room.memberInfo.maxCount }, (_, index) => {
              const preview = room.membersPreview[index];
              return (
                <View
                  key={`${room.meetingId}-preview-${index}`}
                  style={[
                    styles.roomAvatarItem,
                    { marginLeft: index === 0 ? 0 : -10 },
                  ]}
                >
                  <AvatarCircle
                    uri={preview?.profileImage}
                    size={54}
                    fallbackLabel={preview ? String(index + 1) : ''}
                    placeholder={!preview}
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.roomCardActions}>
            <TouchableOpacity
              style={styles.profilePreviewButton}
              onPress={() => openProfilesModal(room)}
              disabled={disabled}
            >
              <Text style={[styles.profilePreviewButtonText, disabled && styles.disabledMutedText]}>
                프로필 보기
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.joinButton,
                disabled && styles.disabledJoinButton,
              ]}
              onPress={() => (disabled ? undefined : openJoinModal(room))}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.joinButtonText,
                  disabled && styles.disabledJoinButtonText,
                ]}
              >
                {disabled ? '매칭중' : '입장하기'}
              </Text>
            </TouchableOpacity>

            {fastJoin && (
              <Text style={styles.fastJoinCaption}>빠른 입장은 20팅 할인!</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderWaitingState = () => {
    if (!userContext || !waitingNotice) return null;

    const noRooms = !roomsLoading && displayRooms.length === 0;

    return (
      <ScrollView
        contentContainerStyle={styles.waitingContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>미팅 방</Text>

          <View style={styles.topRow}>
            {isVip && (
              <View style={[styles.chip, styles.vipChip]}>
                <Image source={vipBadgeImg} style={styles.chipIcon} />
                <Text style={styles.vipChipText}>VIP</Text>
              </View>
            )}
            {userContext.isSubscribed && (
              <View style={[styles.chip, styles.subChip]}>
                <Image source={subBadgeImg} style={styles.chipIcon} />
                <Text style={styles.subChipText}>SUB</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.balancePanel}
              onPress={() => setWalletTooltipVisible(prev => !prev)}
              activeOpacity={0.9}
            >
              <View style={styles.balanceLine}>
                <Image source={tingIconImg} style={styles.balanceIcon} />
                <Text style={styles.balanceNumber}>{tingBalance}</Text>
              </View>
              <View style={styles.balanceLine}>
                <Image source={eventTingIconImg} style={styles.balanceIcon} />
                <Text style={styles.balanceNumber}>{eventTingBalance}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {walletTooltipVisible && (
          <>
            <Pressable
              style={styles.tooltipDismissLayer}
              onPress={() => setWalletTooltipVisible(false)}
            />
            <View style={styles.walletTooltip}>
              <View style={styles.walletTooltipHeader}>
                <Text style={styles.walletTooltipTitle}>유의해주세요!</Text>
                <TouchableOpacity onPress={() => setWalletTooltipVisible(false)}>
                  <Text style={styles.walletTooltipClose}>×</Text>
                </TouchableOpacity>
              </View>
              {getWalletTooltipLines(userContext.gender).map(line => (
                <Text key={line} style={styles.walletTooltipLine}>
                  • {line}
                </Text>
              ))}
            </View>
          </>
        )}

        <View style={styles.roomsPanel}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setWalletTooltipVisible(false);
              setFilterModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Image source={filterImg} style={styles.filterIcon} />
          </TouchableOpacity>

          {roomsLoading ? (
            <View style={styles.roomsLoadingWrap}>
              <ActivityIndicator size="large" color="#F59BB0" />
            </View>
          ) : noRooms ? (
            <View style={styles.emptyStateWrap}>
              <Image source={benchImg} style={styles.benchImage} />
              <Text style={styles.emptyStateText}>
                죄송합니다.{'\n'}현재 생성된 방이 없습니다.{'\n'}방을 새로 생성하시거나{'\n'}조건을 다르게 설정해보세요!
              </Text>
            </View>
          ) : (
            <View style={styles.roomCardsList}>
              {displayRooms.map(renderRoomCard)}
            </View>
          )}
        </View>

        <View style={styles.bottomActionRow}>
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => {
              setWalletTooltipVisible(false);
              setRoomCodeModalVisible(true);
            }}
          >
            <Text style={styles.secondaryActionText}>코드 입력</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => {
              setWalletTooltipVisible(false);
              setCreateModalVisible(true);
            }}
          >
            <Text style={styles.secondaryActionText}>+ 방 만들기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>유의해주세요!</Text>
          <Text style={styles.noticeBody}>
            “매너 있는 만남, 함께 만들어요!” <Text style={styles.noticeStar}>★</Text>
          </Text>
          <Text style={styles.noticeBody}>{waitingNotice.intro}</Text>
          <Text style={[styles.noticeBody, styles.noticeSpacing]}>[입장 안내]</Text>
          <Text style={styles.noticeHighlight}>{waitingNotice.general}</Text>
          <Text style={styles.noticeHighlight}>{waitingNotice.fast}</Text>
          <Text style={styles.noticeFootnote}>{waitingNotice.footnote}</Text>
        </View>
      </ScrollView>
    );
  };

  const renderActiveRoomState = () => {
    if (!userContext || !waitingNotice) return null;

    const memberInfo = activeRoom?.memberInfo ?? { currentCount: 0, maxCount: 2 };
    const maxCount = Math.max(memberInfo.maxCount, 2);
    const members = activeRoomMembers.slice(0, maxCount);
    const statusText = getMatchingStatusLabel(activeRoom?.matchingStatus);

    const rows =
      maxCount === 3
        ? [[0, 1], [2]]
        : maxCount === 2
          ? [[0, 1]]
          : [[0, 1], [2, 3]];

    return (
      <ScrollView
        contentContainerStyle={styles.activeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.activeTitleRow}>
          <Text style={styles.screenTitle}>미팅</Text>
        </View>

        <View style={styles.activeCard}>
          <TouchableOpacity
            style={styles.activeLeaveButton}
            onPress={handleLeaveActiveRoom}
            disabled={leavingRoom}
            hitSlop={12}
          >
            <Text style={styles.activeLeaveButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.activeStatusText}>{statusText}</Text>
          {!!activeRoom?.roomCode && (
            <Text style={styles.activeRoomMeta}>
              {activeRoom.roomName} · 코드 {activeRoom.roomCode}
            </Text>
          )}
          <Text style={styles.activeRoomSubMeta}>
            {formatRegionLabel(activeRoom?.region)} · {formatAgeRangeLabel(activeRoom?.ageRangeDto)}
          </Text>

          <View style={styles.activeMembersWrap}>
            {rows.map((row, rowIndex) => (
              <View
                key={`row-${rowIndex}`}
                style={[
                  styles.activeMemberRow,
                  row.length === 1 && styles.activeSingleMemberRow,
                ]}
              >
                {row.map(slotIndex => {
                  const member = members[slotIndex];
                  const isSelf = isSelfTeamMember(member, userContext);
                  const imageUri =
                    isSelf && userContext.profileImage
                      ? userContext.profileImage
                      : member?.profileImage;

                  return (
                    <View key={`slot-${slotIndex}`} style={styles.activeMemberCell}>
                      <AvatarCircle
                        uri={imageUri}
                        size={96}
                        placeholder={!member || !toAbsoluteUri(imageUri)}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            navigation.navigate('MeetingTeamChat', {
              roomId: String(activeRoom?.roomId ?? activeRoom?.meetingId ?? ''),
              meetingRoomId: String(
                activeRoom?.roomId ?? activeRoom?.meetingId ?? '',
              ),
              roomType: 'TEAM',
              roomTitle: activeRoom?.roomName,
              participants: activeRoomMembers.map(member => ({
                userId: String(member.userId),
                nickname: member.nickname,
                profileImage: member.profileImage,
              })),
            })
          }
        >
          <Text style={styles.chatButtonText}>채팅방으로</Text>
        </TouchableOpacity>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>유의해주세요!</Text>
          <Text style={styles.noticeBody}>
            “매너 있는 만남, 함께 만들어요!” <Text style={styles.noticeStar}>★</Text>
          </Text>
          <Text style={styles.noticeBody}>{waitingNotice.intro}</Text>
          <Text style={[styles.noticeBody, styles.noticeSpacing]}>[입장 안내]</Text>
          <Text style={styles.noticeHighlight}>{waitingNotice.general}</Text>
          <Text style={styles.noticeHighlight}>{waitingNotice.fast}</Text>
          <Text style={styles.noticeFootnote}>{waitingNotice.footnote}</Text>
        </View>
      </ScrollView>
    );
  };

  if (screenLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centerLoadingWrap}>
          <ActivityIndicator size="large" color="#F59BB0" />
        </View>
      </SafeAreaView>
    );
  }

  if (!userContext) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.initializationErrorWrap}>
          <Text style={styles.initializationErrorTitle}>미팅을 불러올 수 없어요</Text>
          <Text style={styles.initializationErrorBody}>
            {initializationError ?? '사용자 정보를 확인하지 못했어요.'}
            {'\n'}잠시 후 다시 시도해 주세요.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButtonWide, styles.initializationRetryButton]}
            onPress={initializeMeetingHome}
          >
            <Text style={styles.primaryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const joinCopy = joinContext
    ? getJoinModalCopy(userContext.gender, joinContext.mode)
    : null;
  const joinCost = joinContext
    ? getEntryCost(userContext.gender, joinContext.mode)
    : 0;
  const createCost = getEntryCost(userContext.gender, 'create');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {activeRoom ? renderActiveRoomState() : renderWaitingState()}

        <MeetingConditionsModal
          visible={filterModalVisible}
          title="조건 설정"
          questionText="이대로 신청하시겠습니까?"
          variant="filter"
          initialFilters={filterSettings}
          defaultRegion={userContext.region}
          confirmLabel="설정 하기"
          onClose={() => setFilterModalVisible(false)}
          onApplyFilters={handleApplyFilters}
        />

        <MeetingConditionsModal
          visible={createModalVisible}
          title="방 조건 설정"
          questionText="이대로 생성하시겠습니까?"
          variant="create"
          initialCreateDraft={createDraft}
          defaultRegion={userContext.region}
          confirmLabel="생성하기"
          confirmCost={createCost}
          onClose={() => setCreateModalVisible(false)}
          onCreateRoom={confirmCreateRoom}
          submitting={submittingAction === 'create'}
        />

        <MeetingModal
          visible={roomCodeModalVisible}
          onClose={() => setRoomCodeModalVisible(false)}
          cardStyle={styles.roomCodeModalCard}
        >
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>방 코드로 입장하기</Text>
            <TouchableOpacity onPress={() => setRoomCodeModalVisible(false)} hitSlop={10}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={roomCodeInput}
            onChangeText={setRoomCodeInput}
            placeholder="방코드를 입력해주세요"
            placeholderTextColor="#B8BDC7"
            style={styles.roomCodeInput}
            autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.primaryButtonWide} onPress={handleCodeSubmit}>
            <Text style={styles.primaryButtonText}>입장하기</Text>
          </TouchableOpacity>
        </MeetingModal>

        <MeetingModal
          visible={!!joinContext}
          onClose={() => setJoinContext(null)}
          cardStyle={styles.joinModalCard}
        >
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{joinCopy?.title}</Text>
            <TouchableOpacity onPress={() => setJoinContext(null)} hitSlop={10}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.joinDescription}>{joinCopy?.description}</Text>

          <TouchableOpacity
            style={[styles.joinConfirmButton, submittingAction === 'join' && styles.disabledPrimaryButton]}
            onPress={confirmJoin}
            disabled={submittingAction === 'join'}
          >
            <Text style={styles.joinConfirmButtonText}>입장하기</Text>
            <View style={styles.joinCostChip}>
              <Image source={tingIconImg} style={styles.smallTingIcon} />
              <Text style={styles.joinCostChipText}>{joinCost}</Text>
            </View>
          </TouchableOpacity>
        </MeetingModal>

        <MeetingModal
          visible={!!insufficientModal}
          onClose={() => setInsufficientModal(null)}
          cardStyle={styles.simpleModalCard}
        >
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>재화 부족</Text>
            <TouchableOpacity onPress={() => setInsufficientModal(null)} hitSlop={10}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.simpleModalBody}>
            {insufficientModal?.mode === 'create'
              ? `죄송합니다.\n재화가 부족하여 방을 생성할 수 없습니다.\n방을 생성하시려면 ${insufficientModal.required}팅이 더 필요합니다.`
              : `입장에 필요한 팅이 조금 부족해요.\n이 방에 입장하시려면 ${insufficientModal?.required ?? 0}팅이 더 필요합니다.\n팅을 충전하고 설레는 만남을 시작해 볼까요?`}
          </Text>

          <TouchableOpacity
            style={styles.primaryButtonWide}
            onPress={() => {
              setInsufficientModal(null);
              navigation.navigate('Store');
            }}
          >
            <Text style={styles.primaryButtonText}>스토어로 이동</Text>
          </TouchableOpacity>
        </MeetingModal>

        <MeetingModal
          visible={!!errorModal}
          onClose={() => setErrorModal(null)}
          cardStyle={styles.simpleModalCard}
        >
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{errorModal?.title}</Text>
            <TouchableOpacity onPress={() => setErrorModal(null)} hitSlop={10}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.simpleModalBody}>▲ {errorModal?.message}</Text>

          <TouchableOpacity style={styles.primaryButtonWide} onPress={() => setErrorModal(null)}>
            <Text style={styles.primaryButtonText}>확인</Text>
          </TouchableOpacity>
        </MeetingModal>

        <MeetingModal
          visible={!!profileModalState}
          onClose={() => setProfileModalState(null)}
          cardStyle={styles.profileModalCard}
        >
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.profileModalTitle}>{profileModalState?.room.roomName}</Text>
              <Text style={styles.profileModalSubtitle}>
                {formatRegionLabel(profileModalState?.room.region)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setProfileModalState(null)} hitSlop={10}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          {profileModalState?.loading && (
            <ActivityIndicator style={styles.profileLoadingIndicator} size="small" color="#F59BB0" />
          )}

          <View style={styles.profileListWrap}>
            {!profileModalState?.loading && profileModalState?.error && (
              <Text style={styles.profileEmptyText}>{profileModalState.error}</Text>
            )}
            {!profileModalState?.loading &&
              !profileModalState?.error &&
              profileModalState?.members.length === 0 && (
                <Text style={styles.profileEmptyText}>표시할 프로필 정보가 없어요.</Text>
              )}
            {profileModalState?.members.map(member => (
              <View
                key={member.userId}
                style={[
                  styles.profileItemRow,
                  userContext.gender === Gender.FEMALE && styles.profileItemRowFemale,
                ]}
              >
                <AvatarCircle
                  uri={member.profileImage}
                  size={60}
                  placeholder={!toAbsoluteUri(member.profileImage)}
                />
                <View
                  style={[
                    styles.profileItemTextWrap,
                    userContext.gender === Gender.FEMALE && styles.profileItemTextWrapFemale,
                  ]}
                >
                  <Text
                    style={[
                      styles.profileItemName,
                      userContext.gender === Gender.FEMALE && styles.profileItemNameFemale,
                    ]}
                  >
                    {member.age > 0 ? `${member.age}세` : '나이 미입력'}
                  </Text>
                  <Text
                    style={[
                      styles.profileItemMeta,
                      userContext.gender === Gender.FEMALE && styles.profileItemMetaFemale,
                    ]}
                  >
                    {member.mbti || 'MBTI 미입력'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </MeetingModal>
      </View>
    </SafeAreaView>
  );
};

export default MeetingScreen;
