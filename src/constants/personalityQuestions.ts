import { RelationshipChoice, RelationshipChoices } from '../types/Profile';

export interface Question {
  id: keyof RelationshipChoices;
  question: string;
  options: [string, string];
  choiceEnum: [RelationshipChoice, RelationshipChoice];
}

export const personalityQuestions: Question[] = [
  {
    id: 'conflictResolution',
    question: '연인과 싸웠을 때 (선택 시 1 포인트팅 지급!)',
    options: ['바로 풀고 싶다', '시간을 좀 가지고 싶다'],
    choiceEnum: [
      RelationshipChoice.IMMEDIATE_RESOLVE,
      RelationshipChoice.TAKE_TIME,
    ],
  },
  {
    id: 'photoSharing',
    question: '연인과 함께한 사진',
    options: ['SNS에 공유해도 된다', 'SNS에 공유하긴 싫다'],
    choiceEnum: [
      RelationshipChoice.SNS_SHARE_OK,
      RelationshipChoice.PRIVATE_MEMORY,
    ],
  },
  {
    id: 'relationshipPriority',
    question: '연애에서 더 중요한 것은',
    options: ['편안함', '설렘'],
    choiceEnum: [RelationshipChoice.COMFORT, RelationshipChoice.EXCITEMENT],
  },
  {
    id: 'datePlace',
    question: '연인과의 데이트에서',
    options: ['실내에서 데이트하기', '실외에서 데이트하기'],
    choiceEnum: [RelationshipChoice.INDOOR, RelationshipChoice.OUTDOOR],
  },
  {
    id: 'jealousyAttitude',
    question: '연애에서 적당한 질투가',
    options: ['있어야 재미있다', '쿨한 게 편하다'],
    choiceEnum: [
      RelationshipChoice.MODERATE_JEALOUSY,
      RelationshipChoice.COOL_ATTITUDE,
    ],
  },
  {
    id: 'idealDay',
    question: '연인과의 이상적인 하루는',
    options: ['편안한 일상 즐기기', '새로운 경험 해보기'],
    choiceEnum: [
      RelationshipChoice.COMFORTABLE_DAILY,
      RelationshipChoice.NEW_EXPERIENCE,
    ],
  },
  {
    id: 'attraction',
    question: '연인에게 주로 끌리는 모습은',
    options: ['배려심 넘치는 모습', '주도적인 모습'],
    choiceEnum: [
      RelationshipChoice.CONSIDERATION,
      RelationshipChoice.STRONG_OPINION,
    ],
  },
  {
    id: 'friendInteraction',
    question: '연인이 내 친구들과',
    options: ['어울리며 놀기', '따로 놀기'],
    choiceEnum: [
      RelationshipChoice.MIX_WELL,
      RelationshipChoice.SEPARATE_CIRCLE,
    ],
  },
];
