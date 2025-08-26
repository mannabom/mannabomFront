import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { styles } from './ProfileDetail.styles';
import { mockUser } from '../../data/mockUser';

export default function ProfileDetail() {
  const { profile } = mockUser;
  const [benchTop, setBenchTop] = useState(400);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;

    if (y > 200) {
      setBenchTop(250);
    } else {
      setBenchTop(400 - y);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleBar}>
        <Text style={styles.title}>프로필</Text>
      </View>

      {/* 벤치 배경 (고정) */}
      <Image
        source={require('../../assets/images/bench.png')}
        style={[styles.benchBackground, { top: benchTop }]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* 프로필 사진 들어갈 영역 (330px 높이) */}
        <View style={styles.profileImageWrapper}>
          <Image
            source={{ uri: 'https://via.placeholder.com/600x330' }} // 실제 프로필 사진
            style={styles.profileImage}
          />
        </View>

        {/* 기본 정보 */}
        <View style={styles.infoSection}>
          {/* 닉네임 + MBTI */}
          <Text style={styles.nickName}>
            {profile.nickName}(
            {2025 - parseInt(profile.birthDate.split('-')[0])}
            ), {profile.mbti}
          </Text>

          {/* 대학교 */}
          <Text style={styles.subInfo}>{profile.university}</Text>

          {/* 주소 + 키 */}
          <View style={styles.infoRow}>
            <Text style={styles.subInfo}>
              {profile.regionSido} {profile.regionSigungu}
            </Text>
            <Text style={styles.rightInfo}>키 {profile.height}cm</Text>
          </View>

          {/* 흡연 + 체형 */}
          <View style={styles.infoRow}>
            <Text style={styles.subInfo}>비흡연</Text>
            <Text style={styles.rightInfo2}>체형 보통</Text>
          </View>

          {/* 음주 + 신고횟수 */}
          <View style={styles.infoRow}>
            <Text style={styles.subInfo}>가끔 음주</Text>
            <Text style={styles.reportInfo}>신고 횟수: 0</Text>
          </View>
        </View>

        {/* 자기소개 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>자기소개</Text>
          <Text style={styles.sectionText}>
            요즘은 주말마다 카페 탐방하거나 산책하는 걸 즐깁니다.{'\n'}
            대화를 좋아하는 편이고,{'\n'}
            서로의 일상을 함께 나눌 수 있는 분이면 좋겠어요.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* 연인에게 바라는 가치 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연인에게 바라는 한 가지는?</Text>
          <Text style={styles.sectionText}>
            서로의 이야기에 진심으로 공감해주고,{'\n'}
            말하지 않아도 마음이 전해지는 그런{'\n'}
            따뜻한 사람이면 좋겠어요.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* 나를 설레게 하는 이성의 매력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>나를 설레게 하는 이성의 매력</Text>
          <Text style={styles.sectionText}>
            눈을 보며 다정하게 인사할 때,{'\n'}
            작은 배려 속에서 상대의 따뜻한 마음을 느낄 때 설레요.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* 나를 좀 더 알아보자면~ */}
        <View style={styles.section}>
          <Text style={styles.sectionBigTitle}>나를 좀 더 알아보자면~</Text>

          <Text style={styles.sectionTitle}>
            나에게 연애란 어떤 의미인가요?
          </Text>
          <Text style={styles.sectionText}>
            내용을 입력해주세요 (첫 입력 시 5 포인트팅 지급)
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>나의 소울 푸드?</Text>
          <Text style={styles.sectionText}>
            스트레스 받을 땐 무조건 얼큰한 라면이나 떡볶이!{'\n'}
            속이 풀리는 그 맛이 저한텐 진정제예요.{'\n'}
            특히 야식으로 최고!
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>나의 하루 그리고 나의 휴일은?</Text>
          <Text style={styles.sectionText}>
            평일엔 바쁘게 일하다가도{'\n'}
            퇴근 후엔 꼭 좋아하는 음악이나 드라마로 힐링해요.{'\n'}
            주말엔 친구 만나거나 혼자 전시 보러 가는 걸 즐겨요.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>하고 싶은 데이트는?</Text>
          <Text style={styles.sectionText}>
            내용을 입력해주세요 (첫 입력 시 5 포인트팅 지급)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
