// GoalPath Application Controller - 100% Dynamic Per-User Data
let AppState = {
  currentView: 'dashboard',
  user: null,
  dashboardData: null,
  currentGoalId: null,
  selectedGoalForRecovery: null,
  activeAIPlan: null,
  nextStepTimer: null,
  timerSecondsRemaining: 0,
  timerRunning: false
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupGlobalEvents();
  await loadUserData();
  
  // Start on the Welcome / Splash screen as the first step
  await navigateTo('welcome');
});

// Toast notification helper
function showToast(message, icon = 'check_circle') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-msg flex items-center gap-2';
  toast.innerHTML = `<span class="material-symbols-outlined text-[20px] text-[#0D9488]">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// User Profile & Settings Sync
async function loadUserData() {
  try {
    const user = await GoalPathAPI.getUserProfile();
    AppState.user = user;
    if (user && user.id) {
      localStorage.setItem('goalpath_user_id', user.id);
    }
    updateUserDisplays(user);
    if (user && user.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (err) {
    console.error('Error loading user data:', err);
  }
}

function updateUserDisplays(user) {
  const name = user ? user.name : 'مستخدم جديد';
  const email = user ? user.email : '';
  const points = user ? (user.points || 0) : 0;
  const streak = user ? (user.streak || 0) : 0;

  document.querySelectorAll('.user-name-display').forEach(el => el.textContent = name);
  document.querySelectorAll('.user-email-display').forEach(el => el.textContent = email);
  document.querySelectorAll('.user-points-display').forEach(el => el.textContent = points.toLocaleString('ar-EG'));
  document.querySelectorAll('.user-streak-display').forEach(el => el.textContent = streak);
}

// View Navigation System
async function navigateTo(viewName, params = {}) {
  AppState.currentView = viewName;
  
  // Toggle Header, Sidebar and Bottom Nav visibility (Hide completely on Welcome, Register, Login)
  const topHeader = document.getElementById('global-top-header');
  const sidebar = document.getElementById('global-sidebar');
  const bottomNav = document.getElementById('global-bottom-nav');
  const mainShell = document.getElementById('main-app-shell');

  const isAuthOrWelcome = (viewName === 'welcome' || viewName === 'auth' || viewName === 'login' || viewName === 'register');

  if (isAuthOrWelcome) {
    document.body.classList.add('auth-mode');
    if (topHeader) topHeader.style.setProperty('display', 'none', 'important');
    if (sidebar) sidebar.style.setProperty('display', 'none', 'important');
    if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');
  } else {
    document.body.classList.remove('auth-mode');
    if (topHeader) topHeader.style.removeProperty('display');
    if (sidebar) sidebar.style.removeProperty('display');
    if (bottomNav) bottomNav.style.removeProperty('display');
  }

  // Hide all screens
  document.querySelectorAll('.app-screen').forEach(screen => {
    screen.classList.add('hidden');
    screen.classList.remove('animate-fade-in');
  });

  // Highlight active navigation items
  document.querySelectorAll('[data-nav-target]').forEach(btn => {
    const target = btn.getAttribute('data-nav-target');
    const isMatched = (target === viewName) || 
                      (target === 'dashboard' && viewName === 'welcome') ||
                      (target === 'goals' && (viewName === 'goal-details' || viewName === 'create-goal' || viewName === 'ai-plan'));
    
    if (isMatched) {
      btn.classList.add('bg-action-purple-primary/20', 'text-action-purple-primary', 'font-bold', 'border-r-4', 'border-action-purple-primary');
      btn.classList.remove('text-on-surface-variant');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.add('filled');
    } else {
      btn.classList.remove('bg-action-purple-primary/20', 'text-action-purple-primary', 'font-bold', 'border-r-4', 'border-action-purple-primary');
      btn.classList.add('text-on-surface-variant');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.remove('filled');
    }
  });

  // Render Target Screen
  const targetScreen = document.getElementById(`screen-${viewName}`);
  if (targetScreen) {
    targetScreen.classList.remove('hidden');
    targetScreen.classList.add('animate-fade-in');
  }

  // Load dynamic per-user data for specific screens
  switch (viewName) {
    case 'welcome':
      break;
    case 'dashboard':
      await loadDashboardScreen();
      break;
    case 'auth':
      initAuthScreen(params);
      break;
    case 'create-goal':
      initCreateGoalScreen();
      break;
    case 'ai-plan':
      renderAIPlanScreen();
      break;
    case 'goal-details':
      if (params.goalId) AppState.currentGoalId = params.goalId;
      if (AppState.currentGoalId) {
        await loadGoalDetailsScreen(AppState.currentGoalId);
      } else {
        await navigateTo('dashboard');
      }
      break;
    case 'ai-recovery':
      initAIRecoveryScreen();
      break;
    case 'next-step':
      await loadNextStepScreen();
      break;
    case 'reports':
      await loadReportsScreen();
      break;
    case 'tasks':
      await loadTasksScreen();
      break;
    case 'profile':
      loadProfileScreen();
      break;
    case 'achievements':
      await loadAchievementsScreen();
      break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 1. Dashboard Screen (100% Dynamic Calculations)
async function loadDashboardScreen() {
  try {
    const data = await GoalPathAPI.getDashboard();
    AppState.dashboardData = data;
    
    // User points & streak
    if (data.user) {
      AppState.user = data.user;
      updateUserDisplays(data.user);
    }

    // Dynamic Metrics from Backend
    const activeGoals = data.metrics.active_goals || 0;
    const completedGoals = data.metrics.completed_goals || 0;
    const pendingTasks = data.metrics.pending_tasks || 0;
    const completionRate = data.metrics.completion_rate || 0;

    document.getElementById('dash-active-goals').textContent = activeGoals;
    document.getElementById('dash-completed-goals').textContent = completedGoals;
    document.getElementById('dash-pending-tasks').textContent = pendingTasks;
    document.getElementById('dash-completion-rate').textContent = completionRate;

    // Render Goals List
    const goalsContainer = document.getElementById('dash-goals-list');
    if (goalsContainer) {
      goalsContainer.innerHTML = '';
      if (!data.goals || data.goals.length === 0) {
        goalsContainer.innerHTML = `
          <div class="col-span-full bg-surface-container-lowest rounded-2xl p-8 text-center border-2 border-dashed border-surface-lavender-deep space-y-3">
            <div class="w-14 h-14 bg-surface-lavender-deep/40 text-action-purple-primary rounded-full flex items-center justify-center mx-auto">
              <span class="material-symbols-outlined text-3xl">flag</span>
            </div>
            <h4 class="font-bold text-base text-on-surface">لا توجد أهداف نشطة بعد</h4>
            <p class="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              ابدأ رحلة الإنجاز بإنشاء أول أهدافك وسيقوم المساعد الذكي بتقسيمه إلى خطوات عملية تلقائياً.
            </p>
            <button onclick="navigateTo('create-goal')" class="bg-action-purple-primary hover:bg-action-purple-dark text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5 mt-2">
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span>إنشاء هدف جديد</span>
            </button>
          </div>`;
      } else {
        data.goals.forEach(goal => {
          const card = document.createElement('article');
          const isComplete = goal.progress >= 100 || goal.status === 'completed';
          card.className = 'bg-surface-container-lowest rounded-2xl p-5 shadow-[0px_4px_20px_rgba(15,23,42,0.04)] border border-surface-lavender-deep flex flex-col gap-3 hover:shadow-[0px_10px_32px_rgba(15,23,42,0.08)] transition-all cursor-pointer';
          
          let icon = 'flag';
          if (goal.category === 'تعليمي') icon = 'school';
          else if (goal.category === 'مهني') icon = 'work';
          else if (goal.category === 'شخصي') icon = 'fitness_center';
          else if (goal.category === 'مشروع') icon = 'code';

          card.innerHTML = `
            <div class="flex justify-between items-start">
              <div class="flex gap-3 items-center">
                <div class="w-11 h-11 bg-surface-lavender-deep/30 rounded-xl flex items-center justify-center text-action-purple-primary shrink-0">
                  <span class="material-symbols-outlined text-[24px]">${icon}</span>
                </div>
                <div class="flex flex-col">
                  <h4 class="font-title-md text-base text-action-purple-primary font-bold ${isComplete ? 'line-through text-outline' : ''}">${escapeHtml(goal.title)}</h4>
                  <p class="text-xs text-on-surface-variant line-clamp-1">${escapeHtml(goal.description || '')}</p>
                </div>
              </div>
              <div class="${isComplete ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-surface-lavender-deep/40 text-action-purple-primary'} px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 text-xs font-bold">
                <span class="material-symbols-outlined text-[14px] filled">${isComplete ? 'check_circle' : 'auto_awesome'}</span>
                <span>${isComplete ? 'مكتمل 100%' : 'مسار ذكي'}</span>
              </div>
            </div>
            
            <div class="flex items-center gap-4 text-xs text-outline">
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">flag</span>
                <span>البداية: ${formatDateArabic(goal.start_date)}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">sports_score</span>
                <span>النهاية: ${formatDateArabic(goal.end_date)}</span>
              </div>
            </div>

            <div class="space-y-1 mt-1">
              <div class="flex justify-between text-xs font-bold">
                <span class="text-on-surface">التقدم</span>
                <span class="text-action-purple-primary font-bold">${goal.progress}%</span>
              </div>
              <div class="w-full h-2 bg-surface-lavender-deep/40 rounded-full overflow-hidden">
                <div class="h-full ${isComplete ? 'bg-[#0D9488]' : 'bg-action-purple-primary'} rounded-full transition-all duration-500" style="width: ${goal.progress}%;"></div>
              </div>
              <div class="text-[11px] text-outline text-left">
                ${goal.completed_tasks || 0} من ${goal.total_tasks || 0} مهام مكتملة
              </div>
            </div>

            <div class="flex justify-between items-center pt-2 border-t border-surface-lavender-deep/50 text-xs">
              <button onclick="event.stopPropagation(); quickDeleteGoal(${goal.id})" class="text-error flex items-center gap-1 hover:underline">
                <span class="material-symbols-outlined text-[16px]">delete</span>
                <span>حذف</span>
              </button>
              <button onclick="navigateTo('goal-details', { goalId: ${goal.id} })" class="border border-action-purple-primary text-action-purple-primary hover:bg-surface-lavender-deep/30 font-bold px-4 py-1.5 rounded-lg transition-colors">
                عرض التفاصيل
              </button>
            </div>
          `;
          card.onclick = () => navigateTo('goal-details', { goalId: goal.id });
          goalsContainer.appendChild(card);
        });
      }
    }
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

// 2. Auth Screen Management & Distinct Forms Handling (Register & Login)
function switchAuthMode(mode) {
  const regCard = document.getElementById('auth-register-card');
  const loginCard = document.getElementById('auth-login-card');
  
  if (mode === 'login') {
    if (regCard) regCard.classList.add('hidden');
    if (loginCard) {
      loginCard.classList.remove('hidden');
      loginCard.classList.add('animate-fade-in');
    }
  } else {
    if (loginCard) loginCard.classList.add('hidden');
    if (regCard) {
      regCard.classList.remove('hidden');
      regCard.classList.add('animate-fade-in');
    }
  }
}

function initAuthScreen(params = {}) {
  const mode = (params && params.mode) ? params.mode : 'register';
  switchAuthMode(mode);
}

async function handleRegisterSubmit(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('reg-name-input')?.value.trim();
  const email = document.getElementById('reg-email-input')?.value.trim();
  const pass = document.getElementById('reg-pass-input')?.value || '';
  const confirmPass = document.getElementById('reg-confirm-pass-input')?.value || '';

  if (!name || !email) {
    showToast('يرجى كتابة الاسم والبريد الإلكتروني', 'warning');
    return;
  }

  if (pass && confirmPass && pass !== confirmPass) {
    showToast('كلمة المرور وتأكيد كلمة المرور غير متطابقين', 'error');
    return;
  }

  const submitBtn = document.getElementById('reg-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>جاري إنشاء الحساب...</span>`;
  }

  try {
    const res = await GoalPathAPI.register(name, email, pass || 'pass123');
    if (res.user) {
      AppState.user = res.user;
      localStorage.setItem('goalpath_user_id', res.user.id);
      localStorage.setItem('goalpath_user_name', res.user.name);
      localStorage.setItem('goalpath_user_email', res.user.email);
      
      updateUserDisplays(res.user);
      showToast(`أهلاً بك يا ${res.user.name}! تم إنشاء حسابك بنجاح 🚀`);
      
      // Navigate straight to dashboard!
      await navigateTo('dashboard');
    }
  } catch (err) {
    console.error('Registration error:', err);
    showToast('حدث خطأ أثناء إنشاء الحساب', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>إنشاء حساب</span><span class="material-symbols-outlined text-[20px]">arrow_forward</span>`;
    }
  }
}

async function handleLoginSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('login-email-input')?.value.trim();
  const pass = document.getElementById('login-pass-input')?.value || '';

  if (!email) {
    showToast('يرجى إدخال البريد الإلكتروني', 'warning');
    return;
  }

  const submitBtn = document.getElementById('login-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>جاري تسجيل الدخول...</span>`;
  }

  try {
    const res = await GoalPathAPI.login('', email, pass || 'pass123');
    if (res.user) {
      AppState.user = res.user;
      localStorage.setItem('goalpath_user_id', res.user.id);
      localStorage.setItem('goalpath_user_name', res.user.name);
      localStorage.setItem('goalpath_user_email', res.user.email);
      
      updateUserDisplays(res.user);
      showToast(res.is_new ? `أهلاً بك يا ${res.user.name}! تم إنشاء حسابك بنجاح 🚀` : `مرحباً بعودتك يا ${res.user.name}! 👋`);
      
      // Navigate straight to dashboard!
      await navigateTo('dashboard');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('حدث خطأ أثناء تسجيل الدخول', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>تسجيل الدخول</span><span class="material-symbols-outlined text-[20px]">arrow_forward</span>`;
    }
  }
}

function handleLogout() {
  localStorage.removeItem('goalpath_user_id');
  localStorage.removeItem('goalpath_user_name');
  localStorage.removeItem('goalpath_user_email');
  AppState.user = null;
  AppState.currentGoalId = null;
  updateUserDisplays({ name: 'مستخدم جديد', email: '', points: 0, streak: 0 });
  showToast('تم تسجيل الخروج. يمكنك الآن تسجيل الدخول أو إنشاء حساب جديد.', 'logout');
  navigateTo('auth', { mode: 'login' });
}

// 3. Goal Creation & AI Plan
let newGoalDraft = {
  title: '',
  description: '',
  category: 'تعليمي',
  startDate: '',
  endDate: '',
  priority: 'متوسط'
};

function initCreateGoalScreen() {
  const form = document.getElementById('create-goal-form');
  if (form) form.reset();
  
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const startInput = document.getElementById('goal-start-date');
  const endInput = document.getElementById('goal-end-date');
  if (startInput) startInput.value = today;
  if (endInput) endInput.value = nextMonth;

  // Category selection chips
  document.querySelectorAll('.category-chip').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      document.querySelectorAll('.category-chip').forEach(c => {
        c.className = 'category-chip px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant font-label-md text-sm hover:bg-surface-container transition-colors';
      });
      btn.className = 'category-chip px-4 py-2 rounded-full border border-primary text-primary font-label-md text-sm bg-primary/10 hover:bg-primary/20 transition-colors font-bold';
      newGoalDraft.category = btn.getAttribute('data-cat');
    };
  });

  // Priority selection buttons
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      document.querySelectorAll('.priority-btn').forEach(p => {
        p.className = 'priority-btn flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-label-md text-sm flex flex-col items-center justify-center gap-1 hover:bg-surface-container transition-colors';
      });
      btn.className = 'priority-btn flex-1 py-2.5 rounded-xl border-2 border-primary bg-primary/5 text-primary font-label-md text-sm flex flex-col items-center justify-center gap-1 transition-colors font-bold';
      newGoalDraft.priority = btn.getAttribute('data-priority');
    };
  });
}

async function proceedToAIGeneration() {
  const nameInput = document.getElementById('goal-name-input');
  const descInput = document.getElementById('goal-desc-input');
  const startInput = document.getElementById('goal-start-date');
  const endInput = document.getElementById('goal-end-date');

  if (!nameInput || !nameInput.value.trim()) {
    showToast('يرجى إدخال اسم الهدف أولاً', 'warning');
    nameInput?.focus();
    return;
  }

  newGoalDraft.title = nameInput.value.trim();
  newGoalDraft.description = descInput?.value.trim() || '';
  newGoalDraft.startDate = startInput?.value || new Date().toISOString().split('T')[0];
  newGoalDraft.endDate = endInput?.value || '';

  await navigateTo('ai-plan');
  await triggerAIGeneration();
}

async function triggerAIGeneration() {
  const container = document.getElementById('ai-plan-phases-list');
  const promptDisplay = document.getElementById('ai-plan-prompt-display');
  const durationDisplay = document.getElementById('ai-plan-duration-display');

  if (promptDisplay) promptDisplay.textContent = newGoalDraft.title;
  if (container) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center p-8 gap-4 text-center">
        <div class="w-12 h-12 rounded-full border-4 border-action-purple-primary border-t-transparent animate-spin"></div>
        <p class="font-title-md text-action-purple-dark font-bold">جاري تحليل الهدف وتوليد المراحل والمهام بالذكاء الاصطناعي...</p>
      </div>`;
  }

  try {
    const plan = await GoalPathAPI.generateAIPlan(
      newGoalDraft.title, 
      newGoalDraft.description, 
      newGoalDraft.category, 
      newGoalDraft.priority, 
      12
    );
    AppState.activeAIPlan = plan;
    
    if (durationDisplay) {
      durationDisplay.textContent = `المدة المقترحة: ${plan.suggested_duration_weeks} أسبوعًا`;
    }

    renderAIPlanScreen();
  } catch (err) {
    console.error('Error generating AI plan:', err);
    showToast('حدث خطأ أثناء توليد الخطة، جاري المحاولة مرة أخرى', 'error');
  }
}

function renderAIPlanScreen() {
  const plan = AppState.activeAIPlan;
  if (!plan) return;

  const container = document.getElementById('ai-plan-phases-list');
  if (!container) return;

  container.innerHTML = '';
  plan.phases.forEach((phase, index) => {
    const isFirst = index === 0;
    const card = document.createElement('div');
    card.className = `glass-card rounded-xl p-4 flex items-center gap-3 shadow-sm relative z-10 hover:shadow-md transition-all ${index % 2 === 1 ? 'sm:mt-2' : ''}`;
    
    card.innerHTML = `
      <div class="w-8 h-8 rounded-full ${isFirst ? 'bg-action-purple-primary text-white' : 'bg-surface-lavender-light text-action-purple-dark'} flex items-center justify-center shrink-0 font-bold text-sm">
        ${phase.phase_number}
      </div>
      <div class="flex flex-col">
        <span class="font-bold text-sm text-on-surface">${escapeHtml(phase.title)}</span>
        <span class="text-xs text-on-surface-variant line-clamp-1">${escapeHtml(phase.description)}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

async function saveAndConfirmAIPlan() {
  if (!AppState.activeAIPlan) return;
  const saveBtn = document.getElementById('confirm-ai-plan-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>جاري حفظ الهدف ومراحله...</span>`;
  }

  try {
    const payload = {
      title: newGoalDraft.title,
      description: newGoalDraft.description,
      category: newGoalDraft.category,
      priority: newGoalDraft.priority,
      start_date: newGoalDraft.startDate,
      end_date: newGoalDraft.endDate,
      phases: AppState.activeAIPlan.phases
    };

    const res = await GoalPathAPI.createGoal(payload);
    showToast('تم اعتماد الخطة الذكية وحفظ الهدف بنجاح! 🎯', 'auto_awesome');
    
    await loadUserData();
    navigateTo('goal-details', { goalId: res.goal_id });
  } catch (err) {
    console.error('Error saving goal plan:', err);
    showToast('فشل حفظ الهدف، يرجى المحاولة ثانية', 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <span class="material-symbols-outlined filled">check_circle</span>
        <span>اعتماد الخطة وحفظ الهدف</span>
        <span class="material-symbols-outlined">arrow_back</span>
      `;
    }
  }
}

// 4. Goal Details & Timeline Screen
async function loadGoalDetailsScreen(goalId) {
  try {
    const goal = await GoalPathAPI.getGoalDetails(goalId);
    AppState.currentGoalId = goal.id;

    // Header & Meta
    document.getElementById('goal-detail-title').textContent = goal.title;
    document.getElementById('goal-detail-desc').textContent = goal.description || 'لا يوجد وصف إضافي.';
    document.getElementById('goal-detail-category').textContent = goal.category;
    document.getElementById('goal-detail-start-date').textContent = formatDateArabic(goal.start_date);
    document.getElementById('goal-detail-end-date').textContent = formatDateArabic(goal.end_date);
    
    // Progress Ring (Radius 42 -> 2 * PI * 42 = 263.89)
    const progress = goal.progress || 0;
    const circle = document.getElementById('goal-detail-ring');
    const progressText = document.getElementById('goal-detail-progress-val');
    if (circle) {
      const circumference = 263.89;
      const offset = circumference - (progress / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }
    if (progressText) progressText.textContent = progress;

    // Timeline steps
    const timelineContainer = document.getElementById('goal-detail-timeline');
    if (timelineContainer) {
      timelineContainer.innerHTML = '';
      if (!goal.phases || goal.phases.length === 0) {
        timelineContainer.innerHTML = `<p class="text-on-surface-variant text-center py-4">لا توجد مراحل مسجلة لهذا الهدف.</p>`;
      } else {
        goal.phases.forEach((phase) => {
          const isDone = phase.status === 'completed';
          const isInProgress = phase.status === 'in_progress';
          
          const phaseEl = document.createElement('div');
          phaseEl.className = 'flex flex-col gap-2 mb-4';
          
          let statusBadge = isDone ? '<span class="text-xs font-bold text-action-purple-primary bg-surface-lavender-deep/50 px-2 py-0.5 rounded-full">مكتملة</span>' :
                            (isInProgress ? '<span class="text-xs font-bold text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded-full">قيد التنفيذ</span>' :
                            '<span class="text-xs font-semibold text-outline bg-surface-container px-2 py-0.5 rounded-full">قادمة</span>');

          let tasksHtml = '';
          if (phase.tasks && phase.tasks.length > 0) {
            tasksHtml = phase.tasks.map(task => `
              <div class="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-lavender-deep/20 transition-colors">
                <label class="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" ${task.is_completed ? 'checked' : ''} onchange="handleTaskToggle(${task.id})" class="rounded text-action-purple-primary focus:ring-action-purple-primary w-4 h-4 cursor-pointer" />
                  <span class="text-sm ${task.is_completed ? 'line-through text-outline' : 'text-on-surface font-medium'}">${escapeHtml(task.title)}</span>
                </label>
                <span class="text-xs text-on-surface-variant bg-surface-lavender-deep/30 px-2 py-0.5 rounded">${task.estimated_minutes} دقيقة</span>
              </div>
            `).join('');
          }

          phaseEl.innerHTML = `
            <div class="flex items-start gap-3 group">
              <div class="relative z-10 w-9 h-9 rounded-full ${isDone ? 'bg-action-purple-primary text-white' : (isInProgress ? 'border-2 border-action-purple-primary bg-white text-action-purple-primary' : 'bg-surface-container text-outline')} flex items-center justify-center shadow-sm shrink-0">
                <span class="material-symbols-outlined ${isDone ? 'icon-fill' : ''} text-[18px]">${isDone ? 'check_circle' : (isInProgress ? 'radio_button_checked' : 'schedule')}</span>
              </div>
              <div class="flex-grow pt-0.5">
                <div class="flex justify-between items-start mb-1">
                  <h4 class="font-title-md text-base text-on-surface ${isDone ? 'line-through opacity-70' : 'font-bold'}">${escapeHtml(phase.title)}</h4>
                  ${statusBadge}
                </div>
                <p class="font-body-md text-outline text-xs mb-2">${escapeHtml(phase.description || '')}</p>
                <div class="bg-surface-container-lowest rounded-xl border border-surface-lavender-deep/40 p-2 space-y-1">
                  ${tasksHtml || '<p class="text-xs text-outline py-1">لا توجد مهام تفصيلية</p>'}
                </div>
              </div>
            </div>
          `;
          timelineContainer.appendChild(phaseEl);
        });
      }
    }
  } catch (err) {
    console.error('Error loading goal details:', err);
  }
}

// 5. AI Recovery Screen
let selectedRecoveryReason = 'لم يكن لدي وقت';

function initAIRecoveryScreen() {
  document.querySelectorAll('input[name="recovery-reason"]').forEach(radio => {
    radio.onchange = async (e) => {
      selectedRecoveryReason = e.target.value;
      await fetchAndDisplayRecoverySolution(selectedRecoveryReason);
    };
  });
  fetchAndDisplayRecoverySolution(selectedRecoveryReason);
}

async function fetchAndDisplayRecoverySolution(reason) {
  try {
    const res = await GoalPathAPI.diagnoseStumble(reason, AppState.currentGoalId);
    const sol = res.solution;
    
    const card = document.getElementById('ai-recovery-solution-card');
    if (card) {
      card.innerHTML = `
        <div class="bg-action-purple-primary/10 border-2 border-action-purple-primary/30 rounded-2xl p-5 mb-2">
          <div class="flex items-center gap-2 text-action-purple-primary font-bold text-base mb-2">
            <span class="material-symbols-outlined filled">tips_and_updates</span>
            <h4>${escapeHtml(sol.title)}</h4>
          </div>
          <p class="text-on-surface-variant text-xs mb-3 leading-relaxed">${escapeHtml(sol.summary)}</p>
          <div class="bg-white/80 p-3 rounded-xl border border-surface-lavender-deep mb-4">
            <h5 class="text-xs font-bold text-action-purple-dark mb-1.5">💡 نصائح المساعد الذكي:</h5>
            <ul class="text-xs text-on-surface space-y-1 pr-4 list-disc">
              ${sol.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
            </ul>
          </div>
          <button onclick="applyRecoveryPlan('${escapeHtml(reason)}')" class="w-full bg-action-purple-primary hover:bg-action-purple-dark text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
            <span class="material-symbols-outlined filled">auto_fix_high</span>
            <span>تطبيق الحل الذكي وإعادة الجدولة</span>
          </button>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error getting stumble solution:', err);
  }
}

async function applyRecoveryPlan(reason) {
  try {
    const res = await GoalPathAPI.applyStumbleSolution(reason, AppState.currentGoalId);
    showToast(res.message, 'task_alt');
    await loadUserData();
    setTimeout(() => navigateTo('dashboard'), 800);
  } catch (err) {
    console.error('Error applying recovery solution:', err);
    showToast('حدث خطأ أثناء تطبيق الحل', 'error');
  }
}

// 6. Smart Next Step Screen
async function loadNextStepScreen() {
  try {
    const res = await GoalPathAPI.getNextStep();
    const task = res.task;
    
    const taskTitleEl = document.getElementById('next-step-title');
    const taskGoalEl = document.getElementById('next-step-goal');
    const taskDurationEl = document.getElementById('next-step-duration');
    const taskActionBtn = document.getElementById('next-step-action-btn');

    if (task) {
      if (taskTitleEl) taskTitleEl.textContent = task.title;
      if (taskGoalEl) taskGoalEl.textContent = task.goal_title || 'مهمة عامة';
      if (taskDurationEl) taskDurationEl.textContent = `مدة مقترحة: ${task.estimated_minutes} دقيقة`;
      AppState.timerSecondsRemaining = (task.estimated_minutes || 45) * 60;
      
      if (taskActionBtn) {
        taskActionBtn.onclick = () => startFocusSession(task);
      }
    } else {
      if (taskTitleEl) taskTitleEl.textContent = '🎉 أحسنت! كل المهام مكتملة';
      if (taskGoalEl) taskGoalEl.textContent = 'يمكنك إضافة هدف جديد من لوحة التحكم';
      if (taskDurationEl) taskDurationEl.textContent = 'استمتع بوقتك أو حدد هدفاً جديداً';
      if (taskActionBtn) {
        taskActionBtn.onclick = () => navigateTo('create-goal');
        taskActionBtn.innerHTML = `
          <span class="material-symbols-outlined">add</span>
          <span>إنشاء هدف جديد</span>
        `;
      }
    }
  } catch (err) {
    console.error('Error loading next step:', err);
  }
}

function startFocusSession(task) {
  if (AppState.timerRunning) {
    clearInterval(AppState.nextStepTimer);
    AppState.timerRunning = false;
    document.getElementById('next-step-action-btn').innerHTML = `
      <span class="material-symbols-outlined filled">play_circle</span>
      <span>متابعة الجلسة</span>
    `;
    showToast('تم إيقاف المؤقت مؤقتاً', 'pause');
  } else {
    AppState.timerRunning = true;
    document.getElementById('next-step-action-btn').innerHTML = `
      <span class="material-symbols-outlined filled">check_circle</span>
      <span>إكمال المهمة الآن</span>
    `;
    showToast(`بدأت جلسة التركيز لمهمة: ${task.title}`, 'timer');

    AppState.nextStepTimer = setInterval(() => {
      if (AppState.timerSecondsRemaining > 0) {
        AppState.timerSecondsRemaining--;
        const mins = Math.floor(AppState.timerSecondsRemaining / 60);
        const secs = AppState.timerSecondsRemaining % 60;
        const timerDisplay = document.getElementById('next-step-duration');
        if (timerDisplay) {
          timerDisplay.textContent = `⏱️ الوقت المتبقي: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
      } else {
        clearInterval(AppState.nextStepTimer);
        AppState.timerRunning = false;
        handleTaskToggle(task.id);
        showToast('انتهى الوقت! تم إكمال المهمة بنجاح 🌟', 'celebration');
      }
    }, 1000);
  }
}

// 7. Reports Screen (Per User)
async function loadReportsScreen() {
  try {
    const data = await GoalPathAPI.getReports();
    
    document.getElementById('rep-weekly-rate').textContent = `${data.weekly_completion_rate}%`;
    document.getElementById('rep-weekly-bar').style.width = `${data.weekly_completion_rate}%`;
    document.getElementById('rep-weekly-pct-text').textContent = `${data.weekly_completion_rate}%`;
    document.getElementById('rep-completed-tasks').textContent = data.completed_tasks_count;
    document.getElementById('rep-total-tasks').textContent = data.total_tasks_count;

    const daysContainer = document.getElementById('rep-days-chart');
    if (daysContainer && data.days) {
      daysContainer.innerHTML = '';
      data.days.forEach(d => {
        const pct = d.total > 0 ? (d.completed / d.total) * 100 : 0;
        const col = document.createElement('div');
        col.className = 'flex flex-col items-center gap-2 flex-1';
        col.innerHTML = `
          <span class="text-[11px] text-on-surface-variant font-medium">${d.completed}/${d.total}</span>
          <div class="w-full bg-surface-lavender-deep/40 rounded-t-lg h-28 flex flex-col justify-end p-1">
            <div class="bg-action-purple-primary rounded-md w-full transition-all duration-700 hover:bg-action-purple-dark" style="height: ${pct}%;"></div>
          </div>
          <span class="text-xs text-on-surface font-semibold">${d.day}</span>
        `;
        daysContainer.appendChild(col);
      });
    }
  } catch (err) {
    console.error('Error loading reports:', err);
  }
}

// 8. Daily Tasks Screen
async function loadTasksScreen(filter = 'all') {
  try {
    const data = await GoalPathAPI.getTasks(false);
    
    const progressEl = document.getElementById('tasks-main-progress');
    const progressTextEl = document.getElementById('tasks-progress-text');
    if (progressEl) progressEl.style.width = `${data.progress}%`;
    if (progressTextEl) progressTextEl.textContent = `${data.progress}%`;

    const tasksContainer = document.getElementById('daily-tasks-list');
    if (tasksContainer) {
      tasksContainer.innerHTML = '';
      let tasks = data.tasks;
      if (filter === 'completed') tasks = tasks.filter(t => t.is_completed === 1);
      else if (filter === 'pending') tasks = tasks.filter(t => t.is_completed === 0);

      if (tasks.length === 0) {
        tasksContainer.innerHTML = `
          <div class="bg-surface-container-lowest rounded-2xl p-8 text-center border border-dashed border-surface-lavender-deep space-y-2">
            <p class="text-on-surface-variant text-sm">لا توجد مهام مسجلة حالياً.</p>
            <p class="text-xs text-outline">أضف مهمة سريعة باستخدام الحقل أعلاه أو أنشئ هدفاً جديداً.</p>
          </div>`;
      } else {
        tasks.forEach(t => {
          const item = document.createElement('div');
          item.className = 'bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-lavender-deep flex items-center justify-between gap-4 hover:shadow-md transition-all';
          item.innerHTML = `
            <label class="flex items-center gap-3 cursor-pointer flex-1">
              <input type="checkbox" ${t.is_completed ? 'checked' : ''} onchange="handleTaskToggle(${t.id})" class="task-checkbox rounded-md text-action-purple-primary focus:ring-action-purple-primary w-5 h-5 cursor-pointer" />
              <div class="flex flex-col">
                <span class="font-label-md text-sm ${t.is_completed ? 'line-through text-outline' : 'text-on-surface font-bold'}">${escapeHtml(t.title)}</span>
                <span class="text-xs text-on-surface-variant">${escapeHtml(t.goal_title || 'مهمة مستقلة')} • ${t.estimated_minutes} دقيقة</span>
              </div>
            </label>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2.5 py-0.5 rounded-full ${t.priority === 'مرتفع' ? 'bg-error/10 text-error' : 'bg-surface-lavender-deep/40 text-action-purple-primary'}">${t.priority}</span>
              <button onclick="quickDeleteTask(${t.id})" class="text-outline hover:text-error transition-colors p-1">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          `;
          tasksContainer.appendChild(item);
        });
      }
    }
  } catch (err) {
    console.error('Error loading tasks:', err);
  }
}

// 9. Achievements Screen
async function loadAchievementsScreen() {
  try {
    const data = await GoalPathAPI.getAchievements();
    
    document.getElementById('ach-points-val').textContent = (data.points || 0).toLocaleString('ar-EG');
    document.getElementById('ach-badges-val').textContent = data.unlocked_count;
    document.getElementById('ach-streak-val').textContent = data.streak;

    const listContainer = document.getElementById('achievements-grid');
    if (listContainer) {
      listContainer.innerHTML = '';
      data.achievements.forEach(ach => {
        const isUnlocked = ach.is_unlocked === 1;
        const card = document.createElement('div');
        card.className = `p-4 rounded-2xl shadow-sm border flex items-center gap-4 transition-all ${
          isUnlocked 
            ? 'bg-surface-container-lowest border-surface-lavender-deep hover:shadow-md' 
            : 'bg-surface-container-high/30 border-dashed border-outline-variant opacity-60'
        }`;
        
        card.innerHTML = `
          <div class="w-12 h-12 rounded-full ${isUnlocked ? 'bg-action-purple-primary text-white shadow-md' : 'bg-surface-lavender-deep text-outline'} flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-2xl ${isUnlocked ? 'filled' : ''}">${ach.icon}</span>
          </div>
          <div class="flex flex-col flex-1">
            <div class="flex items-center justify-between">
              <h4 class="font-title-md text-sm ${isUnlocked ? 'text-action-purple-primary font-bold' : 'text-on-surface-variant font-semibold'}">${escapeHtml(ach.title)}</h4>
              <span class="text-xs font-bold ${isUnlocked ? 'text-[#0D9488]' : 'text-outline'}">${isUnlocked ? 'مكتسبة ✓' : `+${ach.points_reward} نقطة`}</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-0.5">${escapeHtml(ach.description)}</p>
          </div>
        `;
        listContainer.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Error loading achievements:', err);
  }
}

// 10. Profile Screen
function loadProfileScreen() {
  const user = AppState.user;
  if (!user) return;
  
  const darkToggle = document.getElementById('profile-dark-toggle');
  const notifToggle = document.getElementById('profile-notif-toggle');
  
  if (darkToggle) darkToggle.checked = Boolean(user.dark_mode);
  if (notifToggle) notifToggle.checked = Boolean(user.notifications_enabled);
}

async function toggleDarkMode(enabled) {
  if (enabled) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  await GoalPathAPI.updateUserProfile({ dark_mode: enabled });
  showToast(enabled ? 'تم تفعيل الوضع الليلي 🌙' : 'تم تفعيل الوضع النهاري ☀️');
}

async function toggleNotifications(enabled) {
  await GoalPathAPI.updateUserProfile({ notifications_enabled: enabled });
  showToast(enabled ? 'تم تفعيل الإشعارات 🔔' : 'تم كتم الإشعارات 🔕');
}

// ==========================================
// Fireworks & Confetti Celebration Engine
// ==========================================
class ConfettiCelebration {
  constructor() {
    this.canvas = document.getElementById('celebration-confetti-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationId = null;
    this.isActive = false;
    this.colors = ['#6D428F', '#9333EA', '#F59E0B', '#0D9488', '#EC4899', '#3B82F6', '#EF4444', '#10B981', '#EAB308'];
    
    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticle(x, y, isFirework = false) {
    const angle = isFirework ? (Math.random() * Math.PI * 2) : (Math.random() * Math.PI - Math.PI / 2);
    const speed = isFirework ? (Math.random() * 9 + 4) : (Math.random() * 8 + 3);
    const size = Math.random() * 8 + 6;
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    const shape = Math.random() > 0.4 ? 'rect' : 'circle';

    return {
      x: x || Math.random() * this.canvas.width,
      y: y || (Math.random() * -50),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isFirework ? 2 : 0),
      size: size,
      color: color,
      shape: shape,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 10,
      alpha: 1,
      decay: Math.random() * 0.01 + 0.005,
      gravity: 0.25,
      wobble: Math.random() * 10,
      wobbleSpeed: Math.random() * 0.1 + 0.05
    };
  }

  fireworkBurst(x, y, count = 60) {
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(x, y, true));
    }
  }

  start(durationMs = 6500) {
    if (!this.canvas) return;
    this.resize();
    this.canvas.classList.remove('hidden');
    this.isActive = true;
    this.particles = [];

    // Initial blast
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.fireworkBurst(w * 0.2, h * 0.4, 70);
    this.fireworkBurst(w * 0.8, h * 0.4, 70);
    this.fireworkBurst(w * 0.5, h * 0.3, 90);

    // Continuous burst intervals
    const burstInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(burstInterval);
        return;
      }
      const rx = Math.random() * (w * 0.8) + (w * 0.1);
      const ry = Math.random() * (h * 0.5) + (h * 0.2);
      this.fireworkBurst(rx, ry, 45);
    }, 450);

    // Stream particles from top
    const streamInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(streamInterval);
        return;
      }
      for (let i = 0; i < 8; i++) {
        this.particles.push(this.createParticle(Math.random() * w, -10, false));
      }
    }, 100);

    this.animate();

    setTimeout(() => {
      this.stop();
    }, durationMs);
  }

  animate() {
    if (!this.isActive && this.particles.length === 0) {
      if (this.canvas) this.canvas.classList.add('hidden');
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx + Math.sin(p.wobble) * 0.5;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.wobble += p.wobbleSpeed;
      p.rotation += p.vRotation;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > this.canvas.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      this.ctx.restore();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  stop() {
    this.isActive = false;
  }
}

let confettiEngine = null;

function triggerGoalCelebration(goalTitle = 'إنجاز المسار') {
  if (!confettiEngine) {
    confettiEngine = new ConfettiCelebration();
  }
  
  // Set title in modal
  const titleEl = document.getElementById('celebration-goal-title');
  if (titleEl) titleEl.textContent = goalTitle || 'هدف جديد مكتمل';

  // Show celebration modal
  const modal = document.getElementById('goal-celebration-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }

  // Launch confetti fireworks
  confettiEngine.start(7000);
}

function closeGoalCelebrationAndGo(targetView = 'dashboard') {
  const modal = document.getElementById('goal-celebration-modal');
  if (modal) modal.classList.add('hidden');
  if (confettiEngine) confettiEngine.stop();
  navigateTo(targetView);
}

async function completeCurrentGoal() {
  if (!AppState.currentGoalId) return;
  try {
    const res = await GoalPathAPI.completeGoal(AppState.currentGoalId);
    if (res.status === 'success') {
      await loadUserData();
      await loadGoalDetailsScreen(AppState.currentGoalId);
      triggerGoalCelebration(res.goal_title || 'هدفك الرائع');
    }
  } catch (err) {
    console.error('Error completing goal:', err);
    showToast('حدث خطأ أثناء إتمام الهدف', 'error');
  }
}

// Task Toggle Handler
async function handleTaskToggle(taskId) {
  try {
    const res = await GoalPathAPI.toggleTask(taskId);
    if (res.status === 'success') {
      showToast(res.is_completed ? 'أحسنت! +25 نقطة تم إضافتها لرصيدك 🎯' : 'تم تحديث حالة المهمة');
      
      if (res.unlocked_achievements && res.unlocked_achievements.length > 0) {
        showToast('مبروك! تم فتح شارة إنجاز جديدة 🏆', 'military_tech');
      }

      await loadUserData();

      if (AppState.currentView === 'dashboard') await loadDashboardScreen();
      else if (AppState.currentView === 'tasks') await loadTasksScreen();
      else if (AppState.currentView === 'goal-details') await loadGoalDetailsScreen(AppState.currentGoalId);
      else if (AppState.currentView === 'next-step') await loadNextStepScreen();

      // If this task completed the entire goal (100%), trigger fireworks celebration!
      if (res.is_goal_completed) {
        triggerGoalCelebration(res.goal_title || 'هدفك المكتمل');
      }
    }
  } catch (err) {
    console.error('Error toggling task:', err);
  }
}

async function quickDeleteGoal(goalId) {
  if (confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
    await GoalPathAPI.deleteGoal(goalId);
    showToast('تم حذف الهدف بنجاح', 'delete');
    await loadDashboardScreen();
  }
}

async function quickDeleteTask(taskId) {
  await GoalPathAPI.deleteTask(taskId);
  showToast('تم حذف المهمة', 'delete');
  await loadTasksScreen();
}

function setupNavigation() {
  document.querySelectorAll('[data-nav-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-nav-target');
      if (target) navigateTo(target);
    });
  });
}

function setupGlobalEvents() {
  const quickTaskForm = document.getElementById('quick-add-task-form');
  if (quickTaskForm) {
    quickTaskForm.onsubmit = async (e) => {
      e.preventDefault();
      const input = document.getElementById('quick-task-title');
      if (!input || !input.value.trim()) return;
      
      await GoalPathAPI.createTask({
        title: input.value.trim(),
        is_today: true,
        priority: 'متوسط'
      });
      input.value = '';
      showToast('تمت إضافة المهمة بنجاح!', 'add_task');
      await loadTasksScreen();
    };
  }

  const authForm = document.getElementById('auth-submit-form');
  if (authForm) {
    authForm.onsubmit = handleAuthSubmit;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDateArabic(dateStr) {
  if (!dateStr) return 'غير محدد';
  try {
    const d = new Date(dateStr);
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}
