import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Register from "./components/register";
import Login from "./components/login";
import Unauthorized from "./components/Unauthorized";
import ForgotPassword from "./components/forgotpassword";
import Home from "./components/home";
import Dashboard from "./components/admin/dashboard";
import CreateUser from "./components/admin/createUser";
import UserList from "./components/admin/userlist";
import IncidentManagement from "./components/admin/incidents";
import KnowledgeBase from "./components/admin/knowledgebase";
import IncidentsList from "./components/engineer/IncidentsList";
import CreateIncident from "./components/support/createincident";
import MyIncident from "./components/support/myincidents";
import SupKnowledgeBase from "./components/support/knowledgebase";

import EngineerDashboard from "./components/engineer/dashboard";
import AssignedIncidents from "./components/engineer/assignedincident";
import EngineerKnowledgeBase from "./components/engineer/knowledgebase";
import IncidentDetail from "./components/engineer/incidentdetail";
import SupportDashboard from "./components/support/dashboard";
import SupIncidentDetail from "./components/support/incidentdetail";
import SupIncidentsList from "./components/support/IncidentsList";


function App() {
  return (
    <Routes>


<Route path="/" element={<Home />} />
      {/* Public Routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/create-user"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <CreateUser />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/user-list"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UserList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/incidents"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <IncidentManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/knowledgebase"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <KnowledgeBase />
          </ProtectedRoute>
        }
      />

      {/* SUPPORT ROUTES */}
                  <Route
        path="/support/dashboard"
        element={
          <ProtectedRoute allowedRoles={["support"]}>
            <SupportDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support/create-incident"
        element={
          <ProtectedRoute allowedRoles={["support"]}>
            <CreateIncident />
          </ProtectedRoute>
        }
      />

      <Route
        path="/support/my-incident"
        element={
          <ProtectedRoute allowedRoles={["support"]}>
            <MyIncident />
          </ProtectedRoute>
        }
      />
<Route path="/support/incidents" element={<SupIncidentsList />} />
<Route path="/support/incidents/:id" element={<SupIncidentDetail />} />
      <Route
        path="/support/knowledgebase"
        element={
          <ProtectedRoute allowedRoles={["support"]}>
            <SupKnowledgeBase />
          </ProtectedRoute>
        }
      />

      {/* Engineer Routes */}
            <Route
        path="/engineer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["engineer"]}>
            <EngineerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/engineer/assigned-incidents"
        element={
          <ProtectedRoute allowedRoles={["engineer"]}>
            <AssignedIncidents />
          </ProtectedRoute>
        }
      />
      <Route path="/engineer/incidents" element={<IncidentsList />} />
<Route path="/engineer/incidents/:id" element={<IncidentDetail />} />
      <Route
        path="/engineer/knowledgebase"
        element={
          <ProtectedRoute allowedRoles={["engineer"]}>
            <EngineerKnowledgeBase />
          </ProtectedRoute>
        }
      />



    </Routes>
  );
}

export default App;