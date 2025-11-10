import { Routes, Route, Navigate } from "react-router-dom";
import { SYSTEM_DEFINITIONS } from "./config/systems";
import { useMockMonitoringPublisher } from "./mocks/useMockMonitoringPublisher";
import SystemsList from "./pages/SystemsList";

function App() {
  useMockMonitoringPublisher(SYSTEM_DEFINITIONS);

  return (
    <Routes>
      {/* 기본 진입은 /systems 로 */}
      <Route path="/" element={<Navigate to="/systems" replace />} />
      {/* 시스템 목록 + 상세 워크스페이스 */}
      <Route path="/systems" element={<SystemsList />} />
      <Route path="/systems/:apiKey" element={<SystemsList />} />
      {/* 없는 경로 처리 */}
      <Route path="*" element={<Navigate to="/systems" replace />} />
    </Routes>
  );
}

export default App;
