// GoalPath API Client with Dynamic User Identification
const API_BASE = '/api';

function getAuthHeaders() {
  const userId = localStorage.getItem('goalpath_user_id') || '1';
  return {
    'Content-Type': 'application/json',
    'X-User-Id': String(userId)
  };
}

async function safeRequest(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok && !data.error) {
        data.error = `HTTP Error ${res.status}: ${res.statusText}`;
      }
      return data;
    } else {
      const text = await res.text();
      console.warn(`Non-JSON response from ${url} (${res.status}):`, text.substring(0, 150));
      return {
        error: `استجابة غير متوقعة من الخادم (${res.status})`,
        status: res.status,
        raw: text
      };
    }
  } catch (err) {
    console.error(`Fetch failure for ${url}:`, err);
    return {
      error: err.message || 'فشل الاتصال بالخادم',
      networkError: true
    };
  }
}

const GoalPathAPI = {
  async getHealth() {
    return await safeRequest(`${API_BASE}/health`);
  },

  async getUserProfile() {
    return await safeRequest(`${API_BASE}/auth/user`, {
      headers: getAuthHeaders()
    });
  },

  async updateUserProfile(data) {
    return await safeRequest(`${API_BASE}/auth/user`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },

  async login(name, email, password) {
    const data = await safeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (data && data.user && data.user.id) {
      localStorage.setItem('goalpath_user_id', data.user.id);
      localStorage.setItem('goalpath_user_name', data.user.name);
      localStorage.setItem('goalpath_user_email', data.user.email);
    }
    return data;
  },

  async register(name, email, password) {
    const data = await safeRequest(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (data && data.user && data.user.id) {
      localStorage.setItem('goalpath_user_id', data.user.id);
      localStorage.setItem('goalpath_user_name', data.user.name);
      localStorage.setItem('goalpath_user_email', data.user.email);
    }
    return data;
  },

  async getDashboard() {
    return await safeRequest(`${API_BASE}/dashboard`, {
      headers: getAuthHeaders()
    });
  },

  async getGoals() {
    return await safeRequest(`${API_BASE}/goals`, {
      headers: getAuthHeaders()
    });
  },

  async getGoalDetails(id) {
    return await safeRequest(`${API_BASE}/goals/${id}`, {
      headers: getAuthHeaders()
    });
  },

  async createGoal(goalData) {
    return await safeRequest(`${API_BASE}/goals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(goalData)
    });
  },

  async deleteGoal(id) {
    return await safeRequest(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async completeGoal(id) {
    return await safeRequest(`${API_BASE}/goals/${id}/complete`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },

  async getTasks(todayOnly = false, goalId = null) {
    let url = `${API_BASE}/tasks?today=${todayOnly}`;
    if (goalId) url += `&goal_id=${goalId}`;
    return await safeRequest(url, {
      headers: getAuthHeaders()
    });
  },

  async createTask(taskData) {
    return await safeRequest(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
  },

  async toggleTask(taskId) {
    return await safeRequest(`${API_BASE}/tasks/${taskId}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },

  async deleteTask(taskId) {
    return await safeRequest(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async getNextStep() {
    return await safeRequest(`${API_BASE}/next-step`, {
      headers: getAuthHeaders()
    });
  },

  async generateAIPlan(title, description, category, priority, duration_weeks) {
    return await safeRequest(`${API_BASE}/ai/generate-plan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, description, category, priority, duration_weeks })
    });
  },

  async diagnoseStumble(reason, goalId) {
    return await safeRequest(`${API_BASE}/ai/diagnose-stumble`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, goal_id: goalId })
    });
  },

  async applyStumbleSolution(reason, goalId) {
    return await safeRequest(`${API_BASE}/ai/apply-solution`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, goal_id: goalId })
    });
  },

  async getReports() {
    return await safeRequest(`${API_BASE}/reports`, {
      headers: getAuthHeaders()
    });
  },

  async getAchievements() {
    return await safeRequest(`${API_BASE}/achievements`, {
      headers: getAuthHeaders()
    });
  }
};

