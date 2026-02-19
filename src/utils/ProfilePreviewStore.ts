export type StoredProfilePreviewCard = {
  profileId: number;
  nickname: string;
  name?: string;
  age: number;
  mbti?: string;
  photoUris?: string[];
};

export type ProfilePreviewState = {
  profiles: StoredProfilePreviewCard[];
  index: number;
  ratedByProfileId: Record<number, number>;
  lockedRatedProfileIds: number[];
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

