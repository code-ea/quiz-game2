import React from 'react';

const FinalResults = ({ finalResults, playerId, isAdmin }) => {
  const playerStats = finalResults.playerStats[playerId];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-center mb-8">Quiz Completed!</h2>

        {/* All Questions Review */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-6 text-center">Question Review</h3>
          <div className="space-y-6">
            {finalResults.questions.map((questionResult, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold">
                    Question {index + 1}: {questionResult.question}
                  </h4>
                  <span className="text-sm text-gray-500">
                    Correct: <span className="font-semibold text-green-600">{questionResult.correctAnswer}</span>
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold mb-2">Options:</h5>
                    <div className="space-y-1">
                      {questionResult.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded ${
                            option === questionResult.correctAnswer
                              ? 'bg-green-100 border border-green-300'
                              : 'bg-gray-100'
                          }`}
                        >
                          {option}
                          {option === questionResult.correctAnswer && (
                            <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold mb-2">Player Answers:</h5>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {Object.entries(questionResult.answers).map(([answerPlayerId, answer]) => {
                        const isCorrect = answer === questionResult.correctAnswer;
                        const isCurrentPlayer = answerPlayerId === playerId;
                        return (
                          <div
                            key={answerPlayerId}
                            className={`p-2 rounded text-sm ${
                              isCurrentPlayer
                                ? isCorrect
                                  ? 'bg-blue-100 border border-blue-300'
                                  : 'bg-red-100 border border-red-300'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>
                                {isCurrentPlayer ? 'You' : `Player ${answerPlayerId.substring(0, 8)}`}:
                                <span className={`ml-1 font-semibold ${
                                  isCorrect ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {answer}
                                </span>
                              </span>
                              {isCorrect ? (
                                <span className="text-green-500">✓</span>
                              ) : (
                                <span className="text-red-500">✗</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard for Admin */}
        {isAdmin && (
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-center">Leaderboard</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {Object.entries(finalResults.playerStats)
                  .sort(([,a], [,b]) => b.score - a.score)
                  .map(([playerId, stats], index) => (
                    <div key={playerId} className="flex justify-between items-center p-3 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-semibold">{stats.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{stats.score} / {finalResults.totalQuestions}</div>
                        <div className="text-sm text-gray-600">{stats.percentage}%</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8 text-gray-500">
          <p>Thank you for participating in the quiz!</p>
        </div>
      </div>
    </div>
  );
};

export default FinalResults;