import React from 'react';

const PlayerPanel = ({ sessionId, playerName }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Welcome, {playerName}!</h2>
        <p className="text-gray-600 mb-4">
          Session ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{sessionId}</span>
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Waiting for the admin to start the quiz...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerPanel;