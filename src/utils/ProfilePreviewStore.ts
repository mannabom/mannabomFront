export type StoredProfilePreviewCard = {
  profileId: string;
  nickname: string;
  name?: string;
  age: number;
  mbti?: string;
  photoUris?: string[];
};

export type ProfilePreviewState = {
  profiles: StoredProfilePreviewCard[];
  index: number;
  ratedByProfileId: Record<string, number>;
  lockedRatedProfileIds: string[];
  freeProfileNum?: number;
  additionalProfileNum?: number;
};

let profilePreviewState: ProfilePreviewState | null = null;

export const getProfilePreviewState = (): ProfilePreviewState | null =>
  profilePreviewState;

export const setProfilePreviewState = (next: ProfilePreviewState | null) => {
  profilePreviewState = next;
};

export const clearProfilePreviewState = () => {
  profilePreviewState = null;
};
