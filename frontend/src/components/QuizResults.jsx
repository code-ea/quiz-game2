import React from 'react';

const QuizResults = ({ results, playerId, isAdmin }) => {
  const playerAnswer = results.answers[playerId];
  const isCorrect = playerAnswer === results.correctAnswer;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Question Results</h2>
        
        {!isAdmin && (
          <div className={`p-4 rounded-lg mb-6 ${
            isCorrect ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
          }`}>
            <p className="font-semibold text-lg">
              Your answer: <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                {playerAnswer || 'No answer'}
              </span>
            </p>
            <p className="font-semibold text-green-700 mt-2">
              Correct answer: {results.correctAnswer}
            </p>
            {playerAnswer && (
              <p className={`mt-2 font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </p>
            )}
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-3">All Answers:</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(results.answers).map(([answerPlayerId, answer]) => (
              <div key={answerPlayerId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">
                  Player {answerPlayerId === playerId ? 'You' : answerPlayerId.substring(0, 8)}
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${
                    answer === results.correctAnswer ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {answer}
                  </span>
                  {answer === results.correctAnswer ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500">
          Next question starting soon...
        </div>
      </div>
    </div>
  );
};

export default QuizResults;