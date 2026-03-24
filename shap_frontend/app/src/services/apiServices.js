import axios from "axios";

const API = axios.create({
  baseURL: "https://incident-iq.onrender.com/api",
});

API.interceptors.request.use((req) => {

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {

      const publicRoutes = ["/login", "/register", "/forgotpassword"];

      const currentPath = window.location.pathname;

      if (!publicRoutes.includes(currentPath)) {

        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");

        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const loginUser = (data) => {
  return API.post("/login/", data);
};

export const sendOTP = (emailData) => {

  return API.post("/forgot-password/", emailData);
};

export const updateUserStatus = (id, status) => {
  return API.patch(`/users/${id}/status/`, { status });
};

export const verifyOTP = (otpData) => {
  return API.post("/verify-otp/", otpData);
};

export const getIncidents = () => {
  return API.get("/incidents/");
};

export const getIncident = (incidentId) => {
  return API.get(`/incidents/${incidentId}/`);
};

export const assignEngineer = (incidentId, engineerId) => {
  return API.post(`/incidents/${incidentId}/assign/`, { engineer_id: engineerId });
};

export const resolveIncident = (incidentId) => {
  return API.post(`/incidents/${incidentId}/resolve/`);
};

// Update the deleteNotification function
export const deleteNotification = (notificationId) => {
  return API.delete(`/notifications/${notificationId}/delete/`);
};

export const deleteIncidentAPI = (incidentId) => {
  return API.delete(`/incidents/${incidentId}/delete/`);
};
export const closeIncident = (incidentId) => {
  return API.post(`/incidents/${incidentId}/close/`);
};

export const resetPassword = (passwordData) => {
  return API.post("/reset-password/", passwordData);
};

export const createAdmin = (userData) => {
  return API.post("/admin/create/", userData);
};

export const createUser = (userData) => {
  return API.post("/users/create/", userData);
};

export const getUsers = () => {
  return API.get("/users/");
};

export const getUser = (userId) => {
  return API.get(`/users/${userId}/`);
};

export const getEngineers = () => {
  return API.get("/users/engineers/");
};

export const getMyIncidents = () => {
  return API.get("/incidents/my-incidents/");
};

export const assignEngineerAPI = (incidentId, data) => {
  return API.patch(`/incidents/${incidentId}/assign/`, data);
};

export const resolveIncidentAPI = (incidentId, data) => {
  return API.patch(`/incidents/${incidentId}/resolve/`, data);
};

export const closeIncidentAPI = (incidentId) => {
  return API.patch(`/incidents/${incidentId}/close/`);
};

export const getIncidentDetail = (incidentId) => {
  return API.get(`/incidents/${incidentId}/`);
};

export const reopenIncidentAPI = (id) => {
  return API.patch(`/incidents/${id}/reopen/`);
};

export const createIncident = (data) => {
  return API.post("/incidents/create/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateUser = (userId, userData, isPartialUpdate = true) => {
  const method = isPartialUpdate ? API.patch : API.put;
  return method(`/users/update/${userId}/`, userData);
};

export const deleteUser = (userId) => {
  return API.delete(`/users/delete/${userId}/`);
};

export const getKnowledgeBase = () => {
  return API.get("/knowledgebase/");
};

export const createKnowledgeBase = (data) => {
  return API.post("/knowledge-base/create/", data);
};

export const startWorkAPI = async (incidentId) => {
  try {
    const response = await API.post(`engineer/incidents/${incidentId}/start/`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getRelatedIncidents = (pattern) => {
  return API.get(`/knowledge-base/related-incidents/?pattern=${pattern}`);
};

export const getAssignedIncidents = async () => {
  return await API.get("/engineer/incidents/");
};

export const getKnowledgeArticle = (id) => {
  return API.get(`/knowledge-base/${id}/`);
};

export const submitForApproval = (id) => {
  return API.post(`/knowledge/${id}/submit/`);
};

export const approveArticle = (id) => {
  return API.post(`/knowledge/${id}/approve/`);
};

export const rejectArticle = (id) => {
  return API.post(`/knowledge/${id}/reject/`);
};

export const getNotifications = () => {
  return API.get("/notifications/"); 
};

export const markNotificationRead = (id) => {
  return API.post(`/notifications/${id}/read/`);
};

export const updateUserProfile = (file) => {
  const formData = new FormData();
  formData.append("profile_image", file); 

  console.log("File being sent:", file);
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }
  const token = localStorage.getItem("token");
  return API.put("/profile/update/", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data", // usually correct
    },
  });
};

export const logoutUser = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) return Promise.resolve(); // Already logged out

  return API.post(
    "/logout/",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`, // Use Bearer for JWT
      },
    }
  );
};

export const updateKnowledgeBase = (id, data) => {
  return API.put(`/knowledge-base/update/${id}/`, data);
};

export const deleteKnowledgeBase = (id) => {
  return API.delete(`/knowledge-base/delete/${id}/`);
};


export default API;