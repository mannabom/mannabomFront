import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RelationshipChoice, RelationshipChoices } from '../../types/Profile';
import { Question } from '../../constants/personalityQuestions';

interface Props {
  question: Question;
  index: number;
  selected?: RelationshipChoice;
  onSelect: (id: keyof RelationshipChoices, value: RelationshipChoice) => void;
}

const PersonalityQuestion: React.FC<Props> = ({
  question,
  index,
  selected,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      {/* 질문 */}
      <Text style={styles.questionText}>{question.question}</Text>

      {/* 옵션 2개 + vs */}
      <View style={styles.optionsRow}>
        {/* 첫 번째 옵션 */}
        <TouchableOpacity
          style={[
            styles.optionButton,
            selected === question.choiceEnum[0]
              ? styles.optionSelected
              : styles.optionDefault,
          ]}
          onPress={() => onSelect(question.id, question.choiceEnum[0])}
        >
          <Text
            style={[
              styles.optionText,
              selected === question.choiceEnum[0]
                ? styles.optionTextSelected
                : styles.optionTextDefault,
            ]}
          >
            {question.options[0]}
          </Text>
        </TouchableOpacity>

        {/* vs */}
        <Text style={styles.vsText}>vs</Text>

        {/* 두 번째 옵션 */}
        <TouchableOpacity
          style={[
            styles.optionButton,
            selected === question.choiceEnum[1]
              ? styles.optionSelected
              : styles.optionDefault,
          ]}
          onPress={() => onSelect(question.id, question.choiceEnum[1])}
        >
          <Text
            style={[
              styles.optionText,
              selected === question.choiceEnum[1]
                ? styles.optionTextSelected
                : styles.optionTextDefault,
            ]}
          >
            {question.options[1]}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  questionText: {
    fontFamily: 'Inter 18pt SemiBold',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 10,
  },
  vsText: {
    marginHorizontal: 8,
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: Math.round(16 * 1.31),
    letterSpacing: 0,
    fontStyle: 'normal',
    color: '#02113C',
  },

  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButton: {
    width: 160,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B5B5B5',
  },
  optionSelected: {
    backgroundColor: '#FFCDCD',
    borderColor: '#B5B5B5',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextDefault: {
    color: '#000000',
  },
  optionTextSelected: {
    color: '#000000',
  },
});

export default PersonalityQuestion;
