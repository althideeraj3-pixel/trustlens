// src/services/api.js
// Centralized API client with JWT token authentication and complete endpoint mapping.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getAuthHeaders = (includeJsonContentType = true) => {
  const token = localStorage.getItem('trustlens_token');
  const headers = includeJsonContentType ? { 'Content-Type': 'application/json' } : {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// ==========================================
// Authentication APIs
// ==========================================
export const apiLogin = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
};

export const apiRegister = async (name, email, password, language = 'en', seniorMode = false) => {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, language, seniorMode })
  });
  return handleResponse(res);
};

export const apiGetMe = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const apiUpdateProfile = async (profileData) => {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  });
  return handleResponse(res);
};

export const apiForgotPassword = async (email) => {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return handleResponse(res);
};

// ==========================================
// Threat Analysis APIs (All Input Types)
// ==========================================
export const analyzeText = async (text, language = 'en', seniorMode = false) => {
  const res = await fetch(`${API_BASE_URL}/analyze/text`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text, language, seniorMode })
  });
  const json = await handleResponse(res);
  return json.data;
};

export const analyzeUrl = async (url, language = 'en', seniorMode = false) => {
  const res = await fetch(`${API_BASE_URL}/analyze/url`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url, language, seniorMode })
  });
  const json = await handleResponse(res);
  return json.data;
};

const readImageAsBase64 = async (imageFile) => {
  if (!imageFile) return null;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read screenshot image.'));
    reader.readAsDataURL(imageFile);
  });
  if (typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
    throw new Error('Could not encode screenshot image.');
  }
  return dataUrl.split(',', 2)[1];
};

export const analyzeScreenshot = async (extractedText, language = 'en', seniorMode = false, imageFile = null) => {
  const imageData = await readImageAsBase64(imageFile);
  const res = await fetch(`${API_BASE_URL}/analyze/screenshot`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      extractedText,
      language,
      seniorMode,
      imageData,
      imageMimeType: imageFile?.type || ''
    })
  });
  const json = await handleResponse(res);
  return json.data;
};

export const analyzeVideo = async (url, caption = '', platformHint = 'auto', language = 'en', seniorMode = false, videoFile = null) => {
  let body;
  let headers;
  if (videoFile) {
    body = new FormData();
    body.append('video', videoFile);
    body.append('url', url);
    body.append('caption', caption);
    body.append('platformHint', platformHint);
    body.append('language', language);
    body.append('seniorMode', String(seniorMode));
    headers = getAuthHeaders(false);
  } else {
    body = JSON.stringify({ url, caption, platformHint, language, seniorMode });
    headers = getAuthHeaders();
  }
  const res = await fetch(`${API_BASE_URL}/analyze/video`, {
    method: 'POST',
    headers,
    body
  });
  const json = await handleResponse(res);
  return json.data;
};

export const analyzeNews = async (url, title = '', articleBody = '', language = 'en', seniorMode = false) => {
  const res = await fetch(`${API_BASE_URL}/analyze/news`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url, title, articleBody, language, seniorMode })
  });
  const json = await handleResponse(res);
  return json.data;
};

// ==========================================
// Report & History APIs
// ==========================================
export const apiGetUserReports = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/reports?${query}`, {
    headers: getAuthHeaders()
  });
  const json = await handleResponse(res);
  return json.data;
};

export const apiGetReportById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
    headers: getAuthHeaders()
  });
  const json = await handleResponse(res);
  return json.data;
};

export const apiDeleteReport = async (id) => {
  const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const apiSubmitFeedback = async (reportId, rating, comment = '') => {
  const res = await fetch(`${API_BASE_URL}/reports/${reportId}/feedback`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ rating, comment })
  });
  return handleResponse(res);
};

// ==========================================
// Admin APIs (Protected by Admin Role)
// ==========================================
export const apiGetAdminMetrics = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/metrics`, {
    headers: getAuthHeaders()
  });
  const json = await handleResponse(res);
  return json.data;
};

export const apiGetAdminUsers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/users?${query}`, {
    headers: getAuthHeaders()
  });
  const json = await handleResponse(res);
  return json.data;
};

export const apiUpdateUserStatus = async (id, status, role) => {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, role })
  });
  return handleResponse(res);
};

export const apiGetAdminAnalyses = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/analyses?${query}`, {
    headers: getAuthHeaders()
  });
  const json = await handleResponse(res);
  return json.data;
};

export const apiGetAdminRules = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/rules`, {
    headers: getAuthHeaders()
  });
  const json = await handleResponse(res);
  return json.data;
};

export const apiUpdateAdminRule = async (id, ruleData) => {
  const res = await fetch(`${API_BASE_URL}/admin/rules/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(ruleData)
  });
  return handleResponse(res);
};

export const apiGetAdminAuditLogs = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
    headers: getAuthHeaders()
  });
  const json = await handleResponse(res);
  return json.data;
};

export const apiGetAdminFeedback = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/feedback`, {
    headers: getAuthHeaders()
  });
  const json = await handleResponse(res);
  return json.data;
};
