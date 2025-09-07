import React from 'react';
<<<<<<< HEAD
import ReactDOM from 'react-dom/client';
=======
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
>>>>>>> c129a8780512417f34c98b60f05e1a8274a6d248
import App from './App';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
<<<<<<< HEAD
  <React.StrictMode>
    <App />
  </React.StrictMode>
=======
  <Router>
    <App />
  </Router>
>>>>>>> c129a8780512417f34c98b60f05e1a8274a6d248
);