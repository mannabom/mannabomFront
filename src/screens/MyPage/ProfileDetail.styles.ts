import { StyleSheet } from 'react-native';

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
    fontSize: 17,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  profilePlaceholder: {
    width: '100%',
    height: 330,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    color: '#555',
    fontSize: 16,
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
    height: 200,
    resizeMode: 'contain',
    opacity: 0.2,
  },
});
