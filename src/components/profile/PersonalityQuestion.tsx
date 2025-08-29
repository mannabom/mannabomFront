// src/components/common/PersonalityQuestion.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RelationshipChoice, RelationshipChoices } from '../../types/Profile';
import { Question } from '../../constants/personalityQuestions';

interface PersonalityQuestionProps {
  question: Question;
  selected: RelationshipChoice | undefined;
  onSelect: (
    questionId: keyof RelationshipChoices,
    value: RelationshipChoice,
  ) => void;
}

const PersonalityQuestion: React.FC<PersonalityQuestionProps> = ({
  question,
  selected,
  onSelect,
}) => {
  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>
        {question.question}
        <Text style={styles.subText}> (선택시 5포인트 팅)</Text>
      </Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selected === question.choiceEnum[0] && styles.optionButtonSelected,
          ]}
          onPress={() => onSelect(question.id, question.choiceEnum[0])}
        >
          <Text
            style={[
              styles.optionText,
              selected === question.choiceEnum[0] && styles.optionTextSelected,
            ]}
          >
            {question.options[0]}
          </Text>
        </TouchableOpacity>
        <Text style={styles.vsText}>vs</Text>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selected === question.choiceEnum[1] && styles.optionButtonSelected,
          ]}
          onPress={() => onSelect(question.id, question.choiceEnum[1])}
        >
          <Text
            style={[
              styles.optionText,
              selected === question.choiceEnum[1] && styles.optionTextSelected,
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
  questionContainer: {
    marginBottom: 20,
    paddingVertical: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#FF6B6B',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  optionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
<<<<<<< HEAD:src/components/common/PersonalityQuestion.tsx
  vsText: {
    fontSize: 16,
    color: '#999999',
    marginHorizontal: 10,
  },
=======
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8:src/components/profile/PersonalityQuestion.tsx
});

export default PersonalityQuestion;
