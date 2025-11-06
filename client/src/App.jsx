import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import CreateQuiz from './pages/CreateQuiz.jsx';
import Quiz from './pages/Quiz.jsx';
import Attempts from './pages/Attempts.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        <nav style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 12 }}>
          <Link to="/">Home</Link>
          <Link to="/create">Create</Link>
          <Link to="/attempts">Attempts</Link>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateQuiz />} />
            <Route path="/quiz/:id" element={<Quiz />} />
            <Route path="/attempts" element={<Attempts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;