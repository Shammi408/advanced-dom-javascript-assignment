/* script.js -- full todo app with search/filter, debounced search, localStorage, event delegation */

/* ---------- Config ---------- */
const STORAGE_KEY = 'todo_list_v1';
const SEARCH_DEBOUNCE_MS = 400;

/* ---------- Storage helpers ---------- */
function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed reading todos from localStorage:', err);
    return [];
  }
}

function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch (err) {
    console.error('Failed saving todos to localStorage:', err);
    return false;
  }
}

/* ---------- Utilities ---------- */
function debounce(fn, wait = 300) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(isoOrEpoch) {
  const d = new Date(isoOrEpoch);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  }).replace(',', ' at');
}

/* ---------- DOM refs ---------- */
const form = document.getElementById('todo-form');
const todoInput = document.getElementById('todo');
const submitMsgEl = document.getElementById('submit-message');
const listContainer = document.getElementById('todos-list');
const searchInput = document.getElementById('search');
const counterEl = document.getElementById('todo-counter');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));

/* ---------- App state ---------- */
let todos = loadTodos(); // array of todo objects
let currentFilter = 'all'; // 'all' | 'active' | 'completed'
let currentQuery = ''; // search query (lowercased)

/* ---------- Rendering ---------- */
function updateCounter() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  counterEl.textContent = `📝 Todo List (${total} total, ${completed} completed)`;
}

function renderTodoList(items) {
  if (!items || items.length === 0) {
    listContainer.innerHTML = `<p class="empty">No todos found.</p>`;
    updateCounter();
    return;
  }

  listContainer.innerHTML = items.map(t => `
    <div class="todo-item" data-id="${t.id}">
      <label style="display:flex; align-items:center; gap:8px;">
        <input type="checkbox" class="toggle-complete" data-id="${t.id}" ${t.completed ? 'checked' : ''}>
        <div style="flex:1">
          <div class="todo-text" style="text-decoration:${t.completed ? 'line-through' : 'none'};">
            ${escapeHtml(t.text)}
          </div>
          <div style="font-size:0.85rem; color:#666;">${formatDate(t.createdAt)}</div>
        </div>
        <button class="delete-btn" data-id="${t.id}" aria-label="Delete todo">Delete</button>
      </label>
    </div>
  `).join('');

  updateCounter();
}

/* ---------- Filtering & searching ---------- */
function applyFiltersAndSearch() {
  const q = currentQuery.trim().toLowerCase();

  let results = todos.slice(); // copy

  // Filter by completion state
  if (currentFilter === 'active') results = results.filter(t => !t.completed);
  else if (currentFilter === 'completed') results = results.filter(t => t.completed);

  // Search by text
  if (q.length > 0) {
    results = results.filter(t => t.text.toLowerCase().includes(q));
  }

  // Sort newest-first (optional)
  results.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  renderTodoList(results);
}

/* ---------- Event handlers ---------- */
form.addEventListener('submit', function(e) {
  e.preventDefault();
  const v = todoInput.value.trim();
  if (!v) {
    showSubmitMessage('Please enter a todo.', { type: 'error' });
    return;
  }
  if (v.length < 3) {
    showSubmitMessage('Todo must be at least 3 characters.', { type: 'error' });
    return;
  }

  const newTodo = {
    id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
    text: v,
    completed: false,
    createdAt: new Date().toISOString()
  };

  todos.unshift(newTodo); // newest-first
  const ok = saveTodos(todos);
  if (!ok) {
    showSubmitMessage('Could not save todo locally. Check storage settings.', { type: 'error' });
    todos = loadTodos();
    applyFiltersAndSearch();
    return;
  }

  todoInput.value = '';
  showSubmitMessage('Todo added!', { type: 'success' });
  applyFiltersAndSearch();
});

/* Event delegation for checkbox toggle & delete */
listContainer.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.delete-btn');
  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (!id) return;
    if (!confirm('Delete this todo?')) return;
    todos = todos.filter(t => t.id !== id);
    const ok = saveTodos(todos);
    if (!ok) {
      showSubmitMessage('Could not delete todo (storage error).', { type: 'error' });
      todos = loadTodos();
    }
    applyFiltersAndSearch();
    return;
  }

  const toggle = e.target.closest('.toggle-complete');
  if (toggle) {
    const id = toggle.dataset.id;
    if (!id) return;
    const t = todos.find(x => x.id === id);
    if (!t) return;
    t.completed = !!toggle.checked;
    const ok = saveTodos(todos);
    if (!ok) {
      showSubmitMessage('Could not update todo (storage error).', { type: 'error' });
      todos = loadTodos();
    }
    applyFiltersAndSearch();
    return;
  }
});

/* Filter buttons */
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter || 'all';
    applyFiltersAndSearch();
  });
});

/* Debounced search */
const debouncedSearch = debounce(() => {
  currentQuery = searchInput.value;
  applyFiltersAndSearch();
}, SEARCH_DEBOUNCE_MS);

searchInput.addEventListener('input', () => {
  debouncedSearch();
});

/* ---------- Helpers ---------- */
function showSubmitMessage(text, opts = { type: 'success', autoHide: 3000 }) {
  submitMsgEl.textContent = text || '';
  submitMsgEl.className = (opts.type === 'success') ? 'success' : 'error';
  submitMsgEl.focus();
  if (opts.autoHide) {
    setTimeout(() => { submitMsgEl.textContent = ''; }, opts.autoHide);
  }
}

/* Initial render */
applyFiltersAndSearch();
