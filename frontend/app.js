const API_BASE = "http://127.0.0.1:5000/api";
let currentUser = null;
let allCoursesCache = [];

function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(API_BASE + url, { ...options, headers, credentials: 'include' });
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderLeftColor =
    type === 'success' ? 'var(--success)' :
    type === 'error'   ? 'var(--danger)'  : 'var(--accent)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('learnit_theme', next);
}

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  const errMap = {
    'resource-modal': 'resource-modal-error',
    'course-modal':   'course-modal-error',
    'subject-modal':  'subject-modal-error'
  };
  if (errMap[id]) {
    const el = document.getElementById(errMap[id]);
    if (el) el.style.display = 'none';
  }
}

function handleOverlayClick(e, id) {
  if (e.target.id === id) closeModal(id);
}

async function checkAuth() {
  try {
    const res = await apiFetch('/auth/me');
    if (res.ok) {
      currentUser = await res.json();
      setupUI();
    } else {
      document.getElementById('auth-view').classList.remove('hidden');
      document.getElementById('app-view').classList.add('hidden');
    }
  } catch (e) {
    console.error("Auth check failed:", e);
    document.getElementById('auth-view').classList.remove('hidden');
  }
}

async function login() {
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-pass').value;
  const errorEl  = document.getElementById('login-error');
  
  try {
    const r = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Login failed');
    window.location.reload();
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.style.display = 'block';
  }
}

async function register() {
  const name     = document.getElementById('reg-name').value;
  const email    = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-pass').value;
  const role     = document.getElementById('reg-role').value;
  const errorEl  = document.getElementById('reg-error');

  try {
    const r = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Registration failed');

    showToast('Account Created!', 'success');
    switchAuthTab('login');
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.style.display = 'block';
  }
}

async function logout() {
  await apiFetch('/auth/logout', { method: 'POST' });
  window.location.reload();
}

function setupUI() {
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('app-view').classList.remove('hidden');
  document.getElementById('user-info').classList.remove('hidden');

  document.getElementById('user-name-label').textContent = currentUser.name;
  document.getElementById('user-role-label').textContent = currentUser.role;
  document.getElementById('user-initials').textContent   = currentUser.name.substring(0, 2).toUpperCase();

  document.getElementById('sidebar-initials').textContent = currentUser.name.substring(0, 2).toUpperCase();
  document.getElementById('sidebar-name').textContent     = currentUser.name;
  document.getElementById('sidebar-role').textContent     = currentUser.role;

  if (currentUser.role !== 'student') {
    document.getElementById('admin-nav-label').style.display  = '';
    document.getElementById('admin-upload-nav').style.display = '';
    document.getElementById('admin-course-nav').style.display = '';
    document.getElementById('admin-subject-nav').style.display = '';
  }

  loadAllData();
}

function showSidebarView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.getElementById('nav-'  + name).classList.add('active');
  if (name === 'courses')  renderCoursesView();
  if (name === 'subjects') renderSubjectsView();
}

async function loadAllData() {
  await loadCourses();
  await loadResources();
}

async function loadCourses() {
  const r = await apiFetch('/courses');
  const courses = await r.json();
  allCoursesCache = courses;

  const opts        = courses.map(c => `<option value="${c._id}">${escHtml(c.name)}</option>`).join('');
  const optsWithAll = `<option value="">All Courses</option>` + opts;

  document.getElementById('filter-course').innerHTML         = optsWithAll;
  document.getElementById('sub-course-select').innerHTML    = opts;
  document.getElementById('subject-filter-course').innerHTML = optsWithAll;

  loadSubjects();
}

async function loadSubjects() {
  const cId = document.getElementById('filter-course').value;
  const url = cId ? `/subjects/course/${cId}` : '/subjects';
  const r   = await apiFetch(url);
  const subs = await r.json();

  const opts = subs.map(s => `<option value="${s._id}">${escHtml(s.name)}</option>`).join('');
  document.getElementById('filter-subject').innerHTML    = `<option value="">All Subjects</option>` + opts;
  document.getElementById('res-subject-select').innerHTML = opts || '<option value="">No subjects available</option>';

  loadResources();
}

async function loadResources() {
  const sId = document.getElementById('filter-subject').value;
  const key = document.getElementById('search-bar').value;
  const url = key
    ? `/resources/search?keyword=${key}`
    : sId ? `/resources/subject/${sId}` : '/resources';

  const r    = await apiFetch(url);
  const data = await r.json();
  renderResources(Array.isArray(data) ? data : data.resources);
}

function renderResources(list) {
  const container = document.getElementById('resource-container');
  if (!list || !list.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📂</div><p>No resources found.</p></div>`;
    return;
  }
  container.innerHTML = list.map(res => `
    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.9rem;">
        <span class="tag">${escHtml(res.subject?.name || 'General')}</span>
        <span style="font-size:0.72rem;color:var(--text3);font-weight:500;">By ${escHtml(res.uploadedBy?.name || 'Anonymous')}</span>
      </div>
      <h3 style="margin-bottom:0.4rem;font-size:1rem;">${escHtml(res.title)}</h3>
      <p style="color:var(--text2);font-size:0.85rem;margin-bottom:1.25rem;line-height:1.5;">${escHtml(res.description)}</p>
      <div style="display:flex; gap:0.5rem; align-items:center;">
        ${(currentUser.role === 'admin' || currentUser.role === 'teacher' || res.uploadedBy?._id === currentUser.id)
          ? `<button onclick="deleteResource('${res._id}')" class="btn btn-ghost" style="color:var(--danger);padding:6px 12px;font-size:0.75rem;">Delete</button>`
          : ''}
        <button onclick="handleFileAction('${res._id}','preview')" class="btn btn-ghost" style="padding:6px 12px;font-size:0.75rem;margin-left:auto;">Preview</button>
        <button onclick="handleFileAction('${res._id}','download')" class="btn btn-primary" style="padding:6px 12px;font-size:0.75rem;">Download</button>
      </div>
    </div>`).join('');
}

function renderCoursesView() {
  const grid   = document.getElementById('courses-grid');
  const colors = ['#e8ff47','#7c4dff','#3ef59e','#ff9f47','#ff5c5c','#47c8ff','#ff47c8'];
  if (!allCoursesCache.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><p>No courses yet.</p></div>`;
    return;
  }
  grid.innerHTML = allCoursesCache.map((c, i) => {
    const color = colors[i % colors.length];
    return `
      <div class="course-card">
        <div class="course-stripe" style="background:${color}"></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div class="course-code-badge" style="background:${color}20;color:${color}">${escHtml(c.code || '')}</div>
          ${currentUser.role !== 'student' ? `<button onclick="deleteCourse('${c._id}','${escHtml(c.name)}',event)" class="btn btn-ghost" style="color:var(--danger);padding:4px 8px;">🗑</button>` : ''}
        </div>
        <h4 onclick="showCourseSubjects('${c._id}','${escHtml(c.name)}')" style="cursor:pointer;">${escHtml(c.name)}</h4>
        <div class="course-meta" onclick="showCourseSubjects('${c._id}','${escHtml(c.name)}')" style="cursor:pointer;"><span>📝 Click to view subjects</span></div>
      </div>`;
  }).join('');
}

async function renderSubjectsView() {
  const list = document.getElementById('subjects-list');
  list.innerHTML = '<div class="spinner"></div>';
  const courseId = document.getElementById('subject-filter-course').value;

  try {
    const url = courseId ? `/subjects/course/${courseId}` : '/subjects';
    const r = await apiFetch(url);
    const subs = await r.json();

    list.innerHTML = ''; 

    if (!subs.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><p>No subjects found for this course.</p></div>`;
      return;
    }

    list.innerHTML = subs.map(s => `
      <div class="subject-item" id="subject-item-${s._id}">
        <div onclick="showSubjectResources('${s._id}','${escHtml(s.name)}')" style="flex:1;cursor:pointer;">
          <h4>${escHtml(s.name)}</h4>
          <div class="subject-course">${escHtml(s.course?.name || '')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${currentUser.role !== 'student' ? `<button onclick="deleteSubject('${s._id}','${escHtml(s.name)}',event)" class="btn btn-ghost" style="color:var(--danger);font-size:0.78rem;">🗑 Delete</button>` : ''}
          <span class="arrow" onclick="showSubjectResources('${s._id}','${escHtml(s.name)}')" style="cursor:pointer;">→</span>
        </div>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><p>Failed to load subjects.</p></div>`;
  }
}

async function showCourseSubjects(courseId, courseName) {
  showSidebarView('subjects');
  const dropdown = document.getElementById('subject-filter-course');
  if (dropdown) dropdown.value = courseId;
  renderSubjectsView();
}

async function showSubjectResources(subjectId, subjectName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-subject-resources').classList.add('active');
  document.getElementById('subject-res-title').textContent = subjectName;
  document.getElementById('subject-res-breadcrumb').innerHTML = `<a onclick="showSidebarView('subjects')">Subjects</a> <span class="sep">/</span> ${escHtml(subjectName)}`;

  const filterSub = document.getElementById('filter-subject');
  if (filterSub) filterSub.value = subjectId;

  const grid = document.getElementById('subject-resource-grid');
  grid.innerHTML = '<div class="spinner"></div>';
  try {
    const r = await apiFetch(`/resources/subject/${subjectId}`);
    const resources = await r.json();
    grid.innerHTML = '';
    if (!resources.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📂</div><p>No resources for this subject yet.</p></div>`;
      return;
    }
    grid.innerHTML = resources.map(res => renderResourceCard(res)).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><p>Failed to load resources.</p></div>`;
  }
}

function renderResourceCard(res) {
  const ext = (res.fileUrl || '').split('.').pop().toLowerCase().split('?')[0];
  const icon = ({pdf:'📕', doc:'📘', docx:'📘', ppt:'📙', pptx:'📙', png:'🖼️', jpg:'🖼️', jpeg:'🖼️'}[ext]) || '📄';
  const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.role === 'teacher' || res.uploadedBy?._id === currentUser.id);

  return `
    <div class="resource-card">
      <div style="display:flex; gap:0.4rem; margin-bottom:1rem;">
         <span style="font-size:0.65rem; padding:2px 6px; background:var(--accent)20; color:var(--accent); border-radius:4px;">${escHtml(res.subject?.course?.name || '')}</span>
         <span style="font-size:0.65rem; padding:2px 6px; background:var(--bg3); color:var(--text2); border-radius:4px;">${escHtml(res.subject?.name || '')}</span>
      </div>
      <div class="file-icon-wrap">${icon}</div>
      <div class="res-title">${escHtml(res.title)}</div>
      <div class="res-desc">${escHtml(res.description || 'No description')}</div>
      <div class="res-meta"><span>👤 ${escHtml(res.uploadedBy?.name || 'Unknown')}</span></div>
      <div class="res-actions">
        <button onclick="handleFileAction('${res._id}','preview')" class="btn btn-ghost">👁 Preview</button>
        <button onclick="handleFileAction('${res._id}','download')"
          class="btn btn-primary" style="background:var(--accent);color:#000;">⬇ Download</button>
        ${canDelete ? `<button onclick="deleteResource('${res._id}')" class="btn btn-ghost" style="color:var(--danger);flex:0;padding:7px 10px;">🗑</button>` : ''}
      </div>
    </div>`;
}

async function handleFileAction(id, mode) {
  try {
    const r = await apiFetch(`/resources/${id}`);
    const res = await r.json();
    if (mode === 'preview') {
        const ext = res.fileUrl.split('.').pop().toLowerCase();
        if (['ppt','pptx','doc','docx'].includes(ext)) {
            window.open(`https://docs.google.com/gview?url=${encodeURIComponent(res.fileUrl)}&embedded=true`, '_blank');
        } else {
            window.open(res.fileUrl, '_blank');
        }
    } else {
      window.open(res.fileUrl, '_blank');
      showToast('Download started', 'success');
    }
  } catch (e) { showToast('Error accessing file', 'error'); }
}

async function uploadResource() {
  const title = document.getElementById('res-title').value.trim();
  const file  = document.getElementById('res-file').files[0];
  const errEl = document.getElementById('resource-modal-error');
  if (!title || !file) { errEl.textContent = '⚠️ Title and File are required'; errEl.style.display = 'block'; return; }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', document.getElementById('res-desc').value);
  formData.append('subjectId', document.getElementById('res-subject-select').value);
  formData.append('file', file);

  try {
    const r = await apiFetch('/resources/upload', { method: 'POST', body: formData });
    if (r.ok) {
      showToast('Uploaded!', 'success');
      closeModal('resource-modal');
      loadResources();
    } else { showToast('Upload failed', 'error'); }
  } catch (e) { showToast('Upload failed', 'error'); }
}

async function createCourse() {
  const name  = document.getElementById('course-name').value.trim();
  const code  = document.getElementById('course-code').value.trim();
  const errEl = document.getElementById('course-modal-error');
  errEl.style.display = 'none';
  if (!name && !code) {
    errEl.textContent = '⚠️ Course name and course code are required.';
    errEl.style.display = 'block'; return;
  }
  if (!name) {
    errEl.textContent = '⚠️ Course name is required.';
    errEl.style.display = 'block'; return;
  }
  if (!code) {
    errEl.textContent = '⚠️ Course code is required.';
    errEl.style.display = 'block'; return;
  }
  const r = await apiFetch('/courses', { method: 'POST', body: JSON.stringify({ name, code }) });
  if (r.ok) { closeModal('course-modal'); loadCourses(); showToast('Course created!', 'success'); }
  else { const d = await r.json(); errEl.textContent = '⚠️ ' + (d.message || 'Failed to create course.'); errEl.style.display = 'block'; }
}

async function createSubject() {
  const name     = document.getElementById('sub-name').value.trim();
  const courseId = document.getElementById('sub-course-select').value;
  const errEl    = document.getElementById('subject-modal-error');
  errEl.style.display = 'none';
  if (!name && !courseId) {
    errEl.textContent = '⚠️ Subject name and course selection are required.';
    errEl.style.display = 'block'; return;
  }
  if (!name) {
    errEl.textContent = '⚠️ Subject name is required.';
    errEl.style.display = 'block'; return;
  }
  if (!courseId) {
    errEl.textContent = '⚠️ Please select a course for this subject.';
    errEl.style.display = 'block'; return;
  }
  const r = await apiFetch('/subjects', { method: 'POST', body: JSON.stringify({ name, courseId }) });
  if (r.ok) { closeModal('subject-modal'); loadSubjects(); showToast('Subject added!', 'success'); }
  else { const d = await r.json(); errEl.textContent = '⚠️ ' + (d.message || 'Failed to add subject.'); errEl.style.display = 'block'; }
}

//async function deleteResource(id) { if (confirm('Delete permanently?')) { await apiFetch(`/resources/${id}`, { method: 'DELETE' }); loadResources(); } }
//async function deleteCourse(id, name, e) { e.stopPropagation(); if (confirm(`Delete ${name}?`)) { await apiFetch(`/courses/${id}`, { method: 'DELETE' }); loadCourses(); } }
//async function deleteSubject(id, name, e) { e.stopPropagation(); if (confirm(`Delete ${name}?`)) { await apiFetch(`/subjects/${id}`, { method: 'DELETE' }); loadSubjects(); } }

async function deleteResource(id) {
  if (!confirm('Delete permanently?')) return;

  try {
    const res = await apiFetch(`/resources/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "⚠️ You cannot delete this resource.");
      return;
    }

    alert("✅ Resource deleted successfully");
    loadResources();

  } catch (err) {
    alert("⚠️ Failed to delete resource.");
  }
}

async function deleteCourse(id, name, e) {
  e.stopPropagation();

  if (!confirm(`Delete ${name}?`)) return;

  try {
    const res = await apiFetch(`/courses/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "⚠️ You cannot delete this course.");
      return;
    }

    alert("✅ Course deleted successfully");
    loadCourses();

  } catch (err) {
    alert("⚠️ Failed to delete course.");
  }
}

async function deleteSubject(id, name, e) {
  e.stopPropagation();

  if (!confirm(`Delete ${name}?`)) return;

  try {
    const res = await apiFetch(`/subjects/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "⚠️ You cannot delete this subject.");
      return;
    }

    alert("✅ Subject deleted successfully");
    loadSubjects();

  } catch (err) {
    alert("⚠️ Failed to delete subject.");
  }
}

function escHtml(s) { return s ? String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : ''; }

(function init() {
  document.documentElement.setAttribute('data-theme', localStorage.getItem('learnit_theme') || 'dark');
  checkAuth();
})();