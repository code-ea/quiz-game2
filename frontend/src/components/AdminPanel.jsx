import React, { useState, useEffect } from 'react';

const AdminPanel = ({ sessionId, players, onStartQuiz, socket }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerStats, setAnswerStats] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (!socket) return;

    const handleQuestionAdmin = (data) => {
      setCurrentQuestion(data);
      setAnswerStats({ current: 0, total: data.totalPlayers });
    };

    const handleAnswerSubmitted = (data) => {
      setAnswerStats(prev => ({
        ...prev,
        current: data.answersCount
      }));
    };

    const handleQuizResult = (results) => {
      setCurrentQuestion(null);
      setAnswerStats({ current: 0, total: 0 });
    };

    socket.on('question_admin', handleQuestionAdmin);
    socket.on('answer_submitted', handleAnswerSubmitted);
    socket.on('quiz_result', handleQuizResult);

    return () => {
      socket.off('question_admin', handleQuestionAdmin);
      socket.off('answer_submitted', handleAnswerSubmitted);
      socket.off('quiz_result', handleQuizResult);
    };
  }, [socket]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <div className="text-sm text-gray-600">
            Session ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{sessionId}</span>
          </div>
        </div>

        {!currentQuestion ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Players Joined ({players.filter(p => !p.isAdmin).length})
              </h3>
              {players.filter(p => !p.isAdmin).length === 0 ? (
                <p className="text-gray-500">Waiting for players to join...</p>
              ) : (
                <div className="space-y-2">
                  {players.filter(p => !p.isAdmin).map((player, index) => (
                    <div key={player.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <span>{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onStartQuiz}
              disabled={players.filter(p => !p.isAdmin).length === 0}
              className={`w-full py-3 px-4 rounded-lg font-semibold ${
                players.filter(p => !p.isAdmin).length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white transition-colors`}
            >
              Start Quiz
            </button>
          </>
        ) : (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">
              Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
              <p className="text-lg mb-4">Question is active for players...</p>
              <div className="flex justify-center items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{answerStats.current}</div>
                  <div className="text-sm text-gray-600">Answers Submitted</div>
                </div>
                <div className="text-gray-400">/</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{answerStats.total}</div>
                  <div className="text-sm text-gray-600">Total Players</div>
                </div>
              </div>
            </div>
            <p className="text-gray-500">Waiting for players to answer...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;