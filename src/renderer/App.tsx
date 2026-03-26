import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigPage } from './pages/ConfigPage';
import { ViewerPage } from './pages/ViewerPage';

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/config" replace />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="*" element={<Navigate to="/config" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
