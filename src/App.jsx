import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AgentList from './pages/AgentList'
import AgentDetail from './pages/AgentDetail'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<PrivateRoute><AgentList /></PrivateRoute>} />
      <Route path="/agent/:agentId" element={<PrivateRoute><AgentDetail /></PrivateRoute>} />
    </Routes>
  )
}

export default App
