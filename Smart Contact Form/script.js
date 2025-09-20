
const STORAGE_KEY = 'contact_messages';

function loadMessages() {
try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
} catch (err) {
    console.error('Failed reading messages from localStorage:', err);
    return [];
}
}

function saveMessages(messages) {
try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    return true;
} catch (err) {
    console.error('Failed saving messages to localStorage:', err);
    return false;
}
}

function debounce(fn, wait = 300) {
let timer = null;
return function (...args) {
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

function validateName(value) {
const v = String(value ?? '').trim();
if (v.length === 0) return { valid: false, message: 'Name is required.' };
if (v.length < 2) return { valid: false, message: 'Name must have at least 2 characters.' };
return { valid: true, message: '' };
}

function validateEmail(value) {
const v = String(value ?? '').trim();
if (v.length === 0) return { valid: false, message: 'Email is required.' };
const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
return re.test(v) ? { valid: true, message: '' } : { valid: false, message: 'Enter a valid email.' };
}

function validateMessage(value) {
const v = String(value ?? '').trim();
if (v.length === 0) return { valid: false, message: 'Message is required.' };
if (v.length < 10) return { valid: false, message: 'Message must be at least 10 characters.' };
return { valid: true, message: '' };
}

/* ---------- UI helpers ---------- */
function showFieldError(inputEl, message) {
const errorEl = document.getElementById(inputEl.id + '-error') || inputEl.nextElementSibling;
if (errorEl) {
    errorEl.textContent = message || '';
    errorEl.style.display = message ? 'block' : 'none';
}
inputEl.setAttribute('aria-invalid', !!message);
}

function clearFieldError(inputEl) {
showFieldError(inputEl, '');
}

function showGlobalMessage(text, opts = { type: 'success', focus: true, autoHide: 3000 }) {
const el = document.getElementById('submit-message');
el.textContent = text || '';
el.className = opts.type === 'success' ? 'success' : '';
if (opts.focus) el.focus(); // moves screen reader focus
if (opts.autoHide) {
    setTimeout(() => { el.textContent = ''; }, opts.autoHide);
}
}

const form = document.getElementById('contact-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');
const submitBtn = document.getElementById('submit-btn');
const listContainer = document.getElementById('messages-list');


function formatDate(epochMs) {
const d = new Date(epochMs);
// "Jan 15, 2024 at 2:30 PM"
return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
}).replace(',', ' at');
}

function renderMessagesList(messages) {
if (!messages || messages.length === 0) {
    listContainer.innerHTML = '<p class="empty">No messages yet</p>';
    return;
}

// Build HTML with data-id on wrapper for easier event delegation
listContainer.innerHTML = messages.map(m => `
    <div class="msg" data-id="${m.id}">
    <div class="row">
        <div>
        <div class="from">From: ${escapeHtml(m.name)} &nbsp; <small>(${escapeHtml(m.email)})</small></div>
        <div><small>Sent: ${formatDate(m.sentAt)}</small></div>
        </div>
        <button class="delete-btn" data-id="${m.id}" aria-label="Delete message from ${escapeHtml(m.name)}">Delete</button>
    </div>
    <div style="margin-top:8px"><strong>Message:</strong></div>
    <div style="white-space:pre-wrap; margin-top:6px;">${escapeHtml(m.message)}</div>
    </div>
`).join('');
}

let messages = loadMessages();
renderMessagesList(messages);

const debouncedValidateName = debounce(() => {
const { valid, message } = validateName(nameInput.value);
showFieldError(nameInput, valid ? '' : message);
}, 300);

const debouncedValidateEmail = debounce(() => {
const { valid, message } = validateEmail(emailInput.value);
showFieldError(emailInput, valid ? '' : message);
}, 300);

const debouncedValidateMessage = debounce(() => {
const { valid, message } = validateMessage(messageInput.value);
showFieldError(messageInput, valid ? '' : message);
}, 300);

nameInput.addEventListener('input', () => {
clearFieldError(nameInput);
debouncedValidateName();
});
nameInput.addEventListener('blur', () => {
const { valid, message } = validateName(nameInput.value);
showFieldError(nameInput, valid ? '' : message);
});

emailInput.addEventListener('input', () => {
clearFieldError(emailInput);
debouncedValidateEmail();
});
emailInput.addEventListener('blur', () => {
const { valid, message } = validateEmail(emailInput.value);
showFieldError(emailInput, valid ? '' : message);
});

messageInput.addEventListener('input', () => {
clearFieldError(messageInput);
debouncedValidateMessage();
});
messageInput.addEventListener('blur', () => {
const { valid, message } = validateMessage(messageInput.value);
showFieldError(messageInput, valid ? '' : message);
});

form.addEventListener('submit', function (e) {
e.preventDefault();

const Name = validateName(nameInput.value);
const Email = validateEmail(emailInput.value);
const Message = validateMessage(messageInput.value);

showFieldError(nameInput, Name.valid ? '' : Name.message);
showFieldError(emailInput, Email.valid ? '' : Email.message);
showFieldError(messageInput, Message.valid ? '' : Message.message);

if (!Name.valid) { nameInput.focus(); return; }
if (!Email.valid) { emailInput.focus(); return; }
if (!Message.valid) { messageInput.focus(); return; }

const newMessage = {
    id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    message: messageInput.value.trim(),
    sentAt: Date.now()
};

messages.unshift(newMessage);

submitBtn.disabled = true;

const ok = saveMessages(messages);
if (!ok) {
    submitBtn.disabled = false;
    showGlobalMessage('Could not save message locally. Please check browser settings.', { type: 'error', focus: true, autoHide: 4000 });
    messages = loadMessages();
    renderMessagesList(messages);
    return;
}

renderMessagesList(messages);
form.reset();
clearFieldError(nameInput);
clearFieldError(emailInput);
clearFieldError(messageInput);
showGlobalMessage('Message submitted!', { type: 'success', focus: true, autoHide: 3000 });

submitBtn.disabled = false;
});

listContainer.addEventListener('click', (e) => {
const btn = e.target.closest('.delete-btn');
if (!btn) return;
const id = btn.dataset.id;
if (!id) return;
if (!confirm('Delete this message?')) return;

messages = messages.filter(m => m.id !== id);
const ok = saveMessages(messages);
if (!ok) {
    showGlobalMessage('Could not delete message (storage error).', { type: 'error', focus: true, autoHide: 3000 });
    messages = loadMessages(); 
}
renderMessagesList(messages);
});
