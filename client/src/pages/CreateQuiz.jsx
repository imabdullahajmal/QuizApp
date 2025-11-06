import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import Loader from '../components/Loader.jsx';

const CreateQuiz = () => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(3);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleCreate(e) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/quizzes', { topic, numQuestions, difficulty });
      const saved = res.data;
      navigate(`/quiz/${saved._id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '24px auto', padding: 12 }}>
      <h2>Create Quiz</h2>
      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 8 }}>
        <label>
          Topic
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. JavaScript basics" style={{ width: '100%', padding: 8, marginTop: 6 }} />
        </label>

        <label>
          Number of questions
          <input type="number" min={1} max={50} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
        </label>

        <label>
          Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <div>
          <button type="submit" disabled={loading} style={{ padding: '8px 12px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6 }}>
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      </form>

      {loading && <div style={{ marginTop: 12 }}><Loader message="Generating quiz, this may take a moment..." /></div>}
    </div>
  );
};

export default CreateQuiz;
