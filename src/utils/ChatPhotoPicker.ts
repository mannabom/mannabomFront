import { Alert } from 'react-native';
import {
  ImagePickerResponse,
  MediaType,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

export type PickedChatPhoto = {
  uri: string;
  content: string;
  fileName?: string;
  type?: string;
};

const pickerOptions = {
  mediaType: 'photo' as MediaType,
  quality: 0.72 as any,
  selectionLimit: 1,
  includeBase64: true,
};

const handlePhotoResponse = (
  response: ImagePickerResponse,
  onPick: (photo: PickedChatPhoto) => void,
) => {
  if (response.didCancel) return;

  if (response.errorCode) {
    Alert.alert('오류', '사진을 불러오지 못했어요.');
    return;
  }

  const asset = response.assets?.find(item => !!item.uri);
  if (!asset?.uri) {
    Alert.alert('오류', '선택한 사진을 사용할 수 없어요.');
    return;
  }

  const content =
    asset.base64 && asset.type
      ? `data:${asset.type};base64,${asset.base64}`
      : asset.uri;

  onPick({
    uri: asset.uri,
    content,
    fileName: asset.fileName,
    type: asset.type,
  });
};

export const showChatPhotoPicker = (onPick: (photo: PickedChatPhoto) => void) => {
  Alert.alert(
    '사진 보내기',
    '사진을 어떻게 보낼까요?',
    [
      { text: '취소', style: 'cancel' },
      {
        text: '사진 보관함에서 선택',
        onPress: () => {
          launchImageLibrary(pickerOptions, response => handlePhotoResponse(response, onPick));
        },
      },
      {
        text: '카메라로 촬영',
        onPress: () => {
          launchCamera(pickerOptions, response => handlePhotoResponse(response, onPick));
        },
      },
    ],
    { cancelable: true },
  );
};
