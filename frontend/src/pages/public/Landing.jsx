// src/pages/public/Landing.jsx
// Public Landing page featuring the TrustLens Hero and Quick Threat Scanner.

import React from 'react';
import Home from '../Home';

const Landing = ({ language, seniorMode, onSaveReportToHistory }) => {
  return (
    <div>
      <Home
        language={language}
        seniorMode={seniorMode}
        onSaveReportToHistory={onSaveReportToHistory}
      />
    </div>
  );
};

export default Landing;
