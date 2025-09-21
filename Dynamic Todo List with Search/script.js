const STORAGE_KEY = 'todo_list_v1';
const SEARCH_DEBOUNCE_MS = 400;

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

const form = document.getElementById('todo-form');
const todoInput = document.getElementById('todo');
const submitMsgEl = document.getElementById('submit-message');
const listContainer = document.getElementById('todos-list');
const searchInput = document.getElementById('search');
const counterEl = document.getElementById('todo-counter');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));

let todos = loadTodos(); 
let currentFilter = 'all'; 
let currentQuery = ''; 

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

function applyFiltersAndSearch() {
  const q = currentQuery.trim().toLowerCase();

  let results = todos.slice(); // copy the rsult array

  if (currentFilter === 'active') results = results.filter(t => !t.completed);
  else if (currentFilter === 'completed') results = results.filter(t => t.completed);

  if (q.length > 0) {
    results = results.filter(t => t.text.toLowerCase().includes(q));
  }
  renderTodoList(results);
}

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

  todos.unshift(newTodo);
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

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter || 'all';
    applyFiltersAndSearch();
  });
});

const debouncedSearch = debounce(() => {
  currentQuery = searchInput.value;
  applyFiltersAndSearch();
}, SEARCH_DEBOUNCE_MS);

searchInput.addEventListener('input', () => {
  debouncedSearch();
});

function showSubmitMessage(text, opts = { type: 'success', autoHide: 3000 }) {
  submitMsgEl.textContent = text || '';
  submitMsgEl.className = (opts.type === 'success') ? 'success' : 'error';
  submitMsgEl.focus();
  if (opts.autoHide) {
    setTimeout(() => { submitMsgEl.textContent = ''; }, opts.autoHide);
  }
}

applyFiltersAndSearch();
