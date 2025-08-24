import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },

  // 프로필 + 닉네임
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#AFB1B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  nickname: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 20,
  },

  // 보유 팅 + 구독 카드
  cardBox: {
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF9595',
    borderRadius: 5,
    backgroundColor: '#fff',

    // 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,

    marginTop: -3,
  },
  lastCardRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#FF9595',
    marginBottom: 16,
  },

  cardText: {
    fontFamily: 'WorkSans',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: '#19191B',
  },
  cta: {
    width: 56,
    height: 23,
    backgroundColor: '#EB5757',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.23,
    color: '#FFFFFF',
  },

  // 메뉴 리스트
  menuWrapper: {
    marginTop: 16,
  },

  menuItem: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF9595',
    borderRadius: 5,
    backgroundColor: '#fff',

    // 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,

    marginTop: -3,
  },
  lastMenuItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#FF9595',
    marginBottom: 16,
  },

  menuText: {
    fontFamily: 'WorkSans',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 24,
    color: '#19191B',
  },
});
