import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import SummaryDetail from './pages/SummaryDetails';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import EditPatient from './pages/EditPatient';
import Login from './pages/Login';
import ProtectedRoute from "./components/ProtectedRoute";
import Register from './pages/Register';
import Account from './pages/Account';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute><PatientDetails /></ProtectedRoute>} />
          <Route path="/patients/:id/edit" element={<ProtectedRoute><EditPatient /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/:id" element={<ProtectedRoute><SummaryDetail /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
