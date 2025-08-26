import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  titleBar: {
    paddingTop: 20,
    paddingLeft: 16,
  },
  title: {
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.1,
    color: '#02113C',
    fontFamily: 'Roboto SemiBold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },

  profileImageWrapper: {
    width: '100%',
    height: 330,
    marginBottom: 16,
  },

  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoSection: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  subInfo: {
    fontSize: 15,
    color: '#555',
  },

  rightInfo: {
    fontSize: 15,
    color: '#555',
    marginRight: 80,
  },

  rightInfo2: {
    fontSize: 15,
    color: '#555',
    marginRight: 85,
  },

  reportInfo: {
    fontSize: 10,
    color: '#555',
    marginLeft: 'auto',
  },
  nickName: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionBigTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 16,
    width: '100%',
  },
  benchBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    opacity: 0.2,
  },
});
