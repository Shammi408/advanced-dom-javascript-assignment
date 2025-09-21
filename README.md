# Web Projects — Contact Form & Todo List

This repository contains two JavaScript projects built to practice DOM manipulation, form handling, and localStorage persistence.  
Both projects are fully client-side, using HTML, CSS, and JavaScript.

---
 Project 1: Contact Form

 Features
- Form validation
  - Name (required, min 2 chars)
  - Email (required, valid format)
  - Message (required, min 10 chars)
  - Real-time validation with error messages as the user types
  - Debounced validation (300ms delay)
- Submission
  - Prevents page reload
  - Shows a temporary success message
- Message History
  - Displays all submitted messages below the form
  - Persists messages in localStorage as JSON
  - Delete functionality for individual messages (with event delegation)
  - Shows “No messages yet” when empty

Technical Details
- Uses addEventListener for all interactions
- Debounce utility prevents noisy validation
- localStorage operations wrapped in try/catch 
- Data shape for each message:
{
  id: "uuid-or-timestamp",
  name: "John Doe",
  email: "john@email.com",
  message: "Hello, this is a test message...",
  sentAt: 1711234567890 // epoch timestamp
}
---
Project 2: Dynamic Todo List with Search & Filter

-Todo Management
  -Add new todos with an input + button
  -Display todos with checkboxes
  -Mark complete / toggle status
  -Delete individual todos
  -Todo counter: shows total and completed
  -Data persists in localStorage

-Search & Filters
  -Debounced search (400ms delay) across todo text
  -Filter buttons: All | Active | Completed
  -Live results update as you type
  -No results state if nothing matches

-Technical Details
  -Event delegation handles toggle & delete with a single listener
  -Debounce function improves search performance
  -Local storage uses unique IDs + timestamps
  -Data shape for each todo:
{
  id: uuid,
  text: "Learn JavaScript DOM",
  completed: false,
  createdAt: "2024-01-15T10:30:00.000Z"
}

Folder Structure
/contact-form
  ├── index.html
  ├── style.css
  └── script.js
/todo-list
  ├── index.html
  ├── style.css
  └── script.js
README.md

How to Run
1. Clone/download the project.
2. Open index.html of either project in your browser.
3. All data is stored in your browser’s localStorage — no server required.
4. 
