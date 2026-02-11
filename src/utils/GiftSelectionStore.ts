export type SelectedGift = {
  giftId: string;
  title: string;
  price: number;
};

let selectedGift: SelectedGift | null = null;

export const setSelectedGift = (gift: SelectedGift | null) => {
  selectedGift = gift;
};

export const getSelectedGift = (): SelectedGift | null => selectedGift;

export const clearSelectedGift = () => {
  selectedGift = null;
};
