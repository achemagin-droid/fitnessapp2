import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Widget from './components/widget/Widget';
import AdminAuth from './components/admin/AdminAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Widget />} />
        <Route path="/admin/*" element={<AdminAuth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
