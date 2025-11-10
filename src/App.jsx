import { Routes, Route, Navigate, useParams } from "react-router-dom";
import SystemsList from "./pages/SystemsList";

function LegacySystemRedirect() {
  const { apiKey } = useParams();
  const target = apiKey
    ? `/systems?apiKey=${encodeURIComponent(apiKey)}`
    : "/systems";
  return <Navigate to={target} replace />;
}

function App() {
  return (
    <Routes>
      {/* 기본 진입은 /systems 로 */}
      <Route path="/" element={<Navigate to="/systems" replace />} />
      {/* 시스템 목록 + 상세 워크스페이스 */}
      <Route path="/systems" element={<SystemsList />} />
      <Route path="/systems/:apiKey" element={<LegacySystemRedirect />} />
      {/* 없는 경로 처리 */}
      <Route path="*" element={<Navigate to="/systems" replace />} />
    </Routes>
  );
}

export default App;
