import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AdminPanel from './components/AdminPanel';
import PlayerPanel from './components/PlayerPanel';
import QuizQuestion from './components/QuizQuestion';
import QuizResults from './components/QuizResults';
import FinalResults from './components/FinalResults';

const socket = io('http://localhost:3000');

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [sessionId, setSessionId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [timer, setTimer] = useState(10);
  const [error, setError] = useState('');
  const [finalResults, setFinalResults] = useState(null);

  useEffect(() => {
    socket.on('joined_session', (data) => {
      setSessionId(data.sessionId);
      setPlayerId(data.playerId);
      setIsAdmin(data.isAdmin);
      setCurrentView(data.isAdmin ? 'admin' : 'player');
      setError('');
    });

    socket.on('player_joined', (data) => {
      setPlayers(prev => [...prev, { id: data.playerId, name: data.name, isAdmin: data.isAdmin }]);
    });

    socket.on('players_update', (data) => {
      setPlayers(data.players);
    });

    socket.on('quiz_starting', () => {
      setCurrentView('waiting');
    });

    socket.on('question', (data) => {
      setCurrentQuestion(data);
      setQuizResults(null);
      setFinalResults(null);
      setTimer(10);
      setCurrentView('question');
      
      // Start countdown
      const countdown = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('quiz_result', (data) => {
      setQuizResults(data);
      setCurrentQuestion(null);
      setCurrentView('results');
    });

    socket.on('quiz_complete', (data) => {
      setFinalResults(data);
      setCurrentQuestion(null);
      setQuizResults(null);
      setCurrentView('final-results');
      console.log('Final results received:', data);
    });

    socket.on('error', (data) => {
      setError(data.message);
    });

    return () => {
      socket.off('joined_session');
      socket.off('player_joined');
      socket.off('players_update');
      socket.off('quiz_starting');
      socket.off('question');
      socket.off('quiz_result');
      socket.off('quiz_complete');
      socket.off('error');
    };
  }, []);

  const createSession = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      setSessionId(data.sessionId);
      setPlayerId(data.adminId);
      
      socket.emit('join_session', {
        sessionId: data.sessionId,
        playerId: data.adminId,
        name: 'Admin'
      });
    } catch (err) {
      setError('Failed to create session');
    }
  };

  const joinSession = () => {
    if (!sessionId || !playerName) {
      setError('Please enter session ID and your name');
      return;
    }
    
    const newPlayerId = `player_${Date.now()}`;
    socket.emit('join_session', {
      sessionId: sessionId,
      playerId: newPlayerId,
      name: playerName
    });
  };

  const startQuiz = () => {
    socket.emit('start_quiz', {
      sessionId: sessionId,
      adminId: playerId
    });
  };

  const submitAnswer = (answer) => {
    socket.emit('submit_answer', {
      sessionId: sessionId,
      playerId: playerId,
      answer: answer
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl text-red-600 mb-4">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => setError('')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {currentView === 'home' && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-center mb-8">Quiz Session</h1>
            
            <div className="space-y-6">
              <div>
                <button
                  onClick={createSession}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create New Session
                </button>
              </div>
              
              <div className="text-center text-gray-500">OR</div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Session ID"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Your Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={joinSession}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Join Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'admin' && (
        <AdminPanel 
          sessionId={sessionId}
          players={players}
          onStartQuiz={startQuiz}
          socket={socket}
        />
      )}

      {currentView === 'player' && (
        <PlayerPanel 
          sessionId={sessionId}
          playerName={playerName}
        />
      )}

      {currentView === 'waiting' && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Quiz Starting Soon!</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                Get ready for the quiz...
              </p>
            </div>
          </div>
        </div>
      )}

      {currentView === 'question' && currentQuestion && (
        <QuizQuestion 
          question={currentQuestion}
          timer={timer}
          onSubmitAnswer={submitAnswer}
        />
      )}

      {currentView === 'results' && quizResults && (
        <QuizResults 
          results={quizResults}
          playerId={playerId}
          isAdmin={isAdmin}
        />
      )}

      {currentView === 'final-results' && finalResults && (
        <FinalResults 
          finalResults={finalResults}
          playerId={playerId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

export default App;