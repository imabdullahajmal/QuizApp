import React, { useEffect, useState } from 'react';
import api from '../api/api.js';
import Loader from '../components/Loader.jsx';

const Attempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/api/attempts')
      .then(res => {
        if (!mounted) return;
        const data = res.data;
        if (Array.isArray(data)) setAttempts(data);
        else if (data && Array.isArray(data.attempts)) setAttempts(data.attempts);
        else setAttempts([]);
      })
      .catch(() => { if (mounted) setAttempts([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ padding: 24 }}><Loader /></div>;

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: 12 }}>
      <h2>Attempts</h2>
      {attempts.length === 0 ? <div>No attempts yet.</div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {attempts.map(a => (
            <div key={a._id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
              <div style={{ fontWeight: 600 }}>{a.quizId?.title || 'Unknown Quiz'}</div>
              <div>Score: {a.score}</div>
              <div>Answers: {Array.isArray(a.userAnswers) ? a.userAnswers.join(', ') : ''}</div>
              <div style={{ color: '#666', fontSize: 12 }}>{new Date(a.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Attempts;
