export const calculatePlayerStats = (session) => {
  const stats = {};
  const nonAdminPlayers = session.getNonAdminPlayers();

  nonAdminPlayers.forEach(player => {
    let correctAnswers = 0;
    
    session.quizResults.forEach(questionResult => {
      const playerAnswer = questionResult.answers[player.id];
      if (playerAnswer === questionResult.correctAnswer) {
        correctAnswers++;
      }
    });

    stats[player.id] = {
      name: player.name,
      totalAnswered: session.quizResults.filter(q => q.answers[player.id]).length,
      correctAnswers: correctAnswers,
      score: correctAnswers,
      percentage: session.quizResults.length > 0 ? 
        Math.round((correctAnswers / session.quizResults.length) * 100) : 0
    };
  });

  return stats;
};