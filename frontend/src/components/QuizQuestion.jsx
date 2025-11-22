import React from 'react';

const QuizQuestion = ({ question, timer, onSubmitAnswer }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Question {question.questionNumber} of {question.totalQuestions}
          </h2>
          <div className={`text-lg font-bold ${timer <= 3 ? 'text-red-500' : 'text-blue-500'}`}>
            Time: {timer}s
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-4">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onSubmitAnswer(option)}
                className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;