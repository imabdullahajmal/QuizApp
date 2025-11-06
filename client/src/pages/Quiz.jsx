import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api.js';
import Loader from '../components/Loader.jsx';

const Quiz = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get(`/api/quizzes/${id}`)
      .then(res => { if (mounted) setQuiz(res.data); })
      .catch(() => { if (mounted) setQuiz(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  function handleChange(qIndex, value) {
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!quiz) return;
    const userAnswers = quiz.questions.map((_, i) => answers[i] ?? null);
    try {
      const res = await api.post('/api/attempts', { quizId: quiz._id, userAnswers });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to submit answers');
    }
  }

  if (loading) return <div style={{ padding: 24 }}><Loader /></div>;
  if (!quiz) return <div style={{ padding: 24 }}>Quiz not found</div>;

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', padding: 12 }}>
      <h2>{quiz.title}</h2>
      <div style={{ color: '#666', marginBottom: 12 }}>
        {quiz.difficulty ? `Difficulty: ${quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}` : null}
        {quiz.numQuestions ? ` • ${quiz.numQuestions} questions` : null}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        {quiz.questions.map((q, idx) => (
          <div key={idx} style={{ padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
            <div style={{ fontWeight: '600' }}>{idx + 1}. {q.question}</div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {q.options.map((opt, oi) => (
                <label key={oi} style={{ cursor: 'pointer' }}>
                  <input type="radio" name={`q-${idx}`} value={opt} checked={answers[idx] === opt} onChange={() => handleChange(idx, opt)} /> {opt}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div>
          <button type="submit" style={{ padding: '8px 12px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6 }}>Submit Answers</button>
        </div>
      </form>

      {result && (
        <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', border: '1px solid #e6f4d9' }}>
          <strong>Score: {result.score}</strong> / {quiz.questions.length}
        </div>
      )}
    </div>
  );
};

export default Quiz;
