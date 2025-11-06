import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api.js';
import QuizCard from '../components/QuizCard.jsx';
import Loader from '../components/Loader.jsx';

const Home = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/api/quizzes')
      .then(res => {
        if (!mounted) return;
        const data = res.data;
        // normalize: API may return an array or an object with a quizzes property
        if (Array.isArray(data)) setQuizzes(data);
        else if (data && Array.isArray(data.quizzes)) setQuizzes(data.quizzes);
        else setQuizzes([]);
      })
      .catch(() => { if (mounted) setQuizzes([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', padding: 12 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Quizzes</h1>
        <Link to="/create" style={{ padding: '8px 12px', background: '#0366d6', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Create New Quiz</Link>
      </header>

      {loading ? (
        <Loader />
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {quizzes.length === 0 ? <div>No quizzes yet.</div> : quizzes.map(q => <QuizCard key={q._id} quiz={q} />)}
        </div>
      )}
    </div>
  );
};

export default Home;
