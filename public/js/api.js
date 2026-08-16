// GoalPath API Client with Dynamic User Identification
const API_BASE = '/api';

function getAuthHeaders() {
  const userId = localStorage.getItem('goalpath_user_id') || '1';
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId
  };
}

const GoalPathAPI = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  },

  async getUserProfile() {
    const res = await fetch(`${API_BASE}/auth/user`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateUserProfile(data) {
    const res = await fetch(`${API_BASE}/auth/user`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async login(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.user && data.user.id) {
      localStorage.setItem('goalpath_user_id', data.user.id);
      localStorage.setItem('goalpath_user_name', data.user.name);
      localStorage.setItem('goalpath_user_email', data.user.email);
    }
    return data;
  },

  async register(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.user && data.user.id) {
      localStorage.setItem('goalpath_user_id', data.user.id);
      localStorage.setItem('goalpath_user_name', data.user.name);
      localStorage.setItem('goalpath_user_email', data.user.email);
    }
    return data;
  },

  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getGoals() {
    const res = await fetch(`${API_BASE}/goals`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getGoalDetails(id) {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async createGoal(goalData) {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(goalData)
    });
    return await res.json();
  },

  async deleteGoal(id) {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async completeGoal(id) {
    const res = await fetch(`${API_BASE}/goals/${id}/complete`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getTasks(todayOnly = false, goalId = null) {
    let url = `${API_BASE}/tasks?today=${todayOnly}`;
    if (goalId) url += `&goal_id=${goalId}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async createTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return await res.json();
  },

  async toggleTask(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async deleteTask(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getNextStep() {
    const res = await fetch(`${API_BASE}/next-step`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async generateAIPlan(title, description, category, priority, duration_weeks) {
    const res = await fetch(`${API_BASE}/ai/generate-plan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, description, category, priority, duration_weeks })
    });
    return await res.json();
  },

  async diagnoseStumble(reason, goalId) {
    const res = await fetch(`${API_BASE}/ai/diagnose-stumble`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, goal_id: goalId })
    });
    return await res.json();
  },

  async applyStumbleSolution(reason, goalId) {
    const res = await fetch(`${API_BASE}/ai/apply-solution`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, goal_id: goalId })
    });
    return await res.json();
  },

  async getReports() {
    const res = await fetch(`${API_BASE}/reports`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getAchievements() {
    const res = await fetch(`${API_BASE}/achievements`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  }
};
