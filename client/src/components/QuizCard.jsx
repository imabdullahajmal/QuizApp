import React from 'react';
import { Link } from 'react-router-dom';

const QuizCard = ({ quiz }) => {
  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 8px 0' }}>{quiz.title}</h3>
      <p style={{ margin: '0 0 12px 0', color: '#555' }}>
        {quiz.questions?.length || quiz.numQuestions || 0} questions
        {quiz.difficulty ? ` • ${quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}` : ''}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link to={`/quiz/${quiz._id}`} style={{ textDecoration: 'none', color: '#0366d6' }}>Open</Link>
      </div>
    </div>
  );
};

export default QuizCard;
