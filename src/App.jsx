import { Routes, Route, Navigate } from "react-router-dom";
import SystemsPage from "./pages/SystemsPage";

function App() {
  return (
    <Routes>
      {/* 기본 진입은 /systems 로 */}
      <Route path="/" element={<Navigate to="/systems" replace />} />
      {/* 시스템 목록 페이지 */}
      <Route path="/systems" element={<SystemsPage />} />
      {/* 없는 경로 처리 */}
      <Route path="*" element={<Navigate to="/systems" replace />} />
    </Routes>
  );
}

export default App;
