// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const showCompletedCheckbox = document.getElementById('show-completed');
const clearAllBtn = document.getElementById('clear-all');
const themeToggle = document.getElementById('theme-toggle');
const startTimerBtn = document.getElementById('start-timer');
const resetTimerBtn = document.getElementById('reset-timer');
const timerDisplay = document.getElementById('timer-display');
const notification = document.getElementById('notification');
const closeNotificationBtn = document.getElementById('close-notification');

// Stats Elements
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const progressBarEl = document.getElementById('progress-bar');
const progressPercentEl = document.getElementById('progress-percent');
const highBarEl = document.getElementById('high-bar');
const mediumBarEl = document.getElementById('medium-bar');
const lowBarEl = document.getElementById('low-bar');
const highCountEl = document.getElementById('high-count');
const mediumCountEl = document.getElementById('medium-count');
const lowCountEl = document.getElementById('low-count');
const pomodoroCountEl = document.getElementById('pomodoro-count');

// App State
let tasks = [];
let pomodoroTime = 25 * 60; // 25 minutes in seconds
let pomodoroActive = false;
let pomodoroInterval;
let pomodoroCount = 0;

// Priority Icons
const priorityIcons = {
    'High': '🔴',
    'Medium': '🟡',
    'Low': '🟢'
};

// Load data from localStorage
function loadFromLocalStorage() {
    const savedTasks = localStorage.getItem('tasks');
    const savedTheme = localStorage.getItem('darkMode');
    const savedPomodoroCount = localStorage.getItem('pomodoroCount');
    
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (e) {
            console.error('Error parsing saved tasks:', e);
            tasks = [];
        }
    }
    
    if (savedTheme === 'true') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
    
    if (savedPomodoroCount) {
        pomodoroCount = parseInt(savedPomodoroCount);
        pomodoroCountEl.textContent = pomodoroCount;
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    localStorage.setItem('pomodoroCount', pomodoroCount);
}

// Add a new task
function addTask(title, category, priority) {
    const newTask = {
        id: Date.now(),
        title,
        category,
        priority,
        completed: false,
        createdAt: new Date().toString() // Convert to string for better serialization
    };
    
    tasks.unshift(newTask); // Add to the beginning of the array
    saveToLocalStorage();
    renderTasks();
    updateAnalytics();
}

// Mark task as completed/uncompleted
function toggleTaskCompletion(id) {
    tasks = tasks.map(task => {
        if (task.id === parseInt(id)) { // Convert id to number for comparison
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveToLocalStorage();
    renderTasks();
    updateAnalytics();
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== parseInt(id)); // Convert id to number
    saveToLocalStorage();
    renderTasks();
    updateAnalytics();
}

// Clear all tasks
function clearAllTasks() {
    if (confirm('Are you sure you want to clear all tasks?')) {
        tasks = [];
        saveToLocalStorage();
        renderTasks();
        updateAnalytics();
    }
}

// Filter tasks based on search term
function filterTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const showCompleted = showCompletedCheckbox.checked;
    
    return tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                              task.category.toLowerCase().includes(searchTerm);
        const matchesCompletedFilter = showCompleted ? true : !task.completed;
        
        return matchesSearch && matchesCompletedFilter;
    });
}

// Create task element
function createTaskElement(task) {
    const taskItem = document.createElement('li');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskItem.dataset.id = task.id;
    
    // Add fade-in animation
    taskItem.style.animationDelay = `${Math.random() * 0.3}s`;
    
    taskItem.innerHTML = `
        <div class="task-content">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                <span class="task-category">${task.category}</span>
                <span class="task-priority">
                    <span class="priority-icon ${task.priority.toLowerCase()}-priority">${priorityIcons[task.priority]}</span>
                    ${task.priority}
                </span>
            </div>
        </div>
        <div class="task-actions">
            <button class="action-btn toggle-btn" title="${task.completed ? 'Mark as not completed' : 'Mark as completed'}">
                ${task.completed ? '↩️' : '✓'}
            </button>
            <button class="action-btn delete-btn" title="Delete task">🗑️</button>
        </div>
    `;
    
    // Add event listeners
    const toggleBtn = taskItem.querySelector('.toggle-btn');
    const deleteBtn = taskItem.querySelector('.delete-btn');
    
    toggleBtn.addEventListener('click', () => {
        toggleTaskCompletion(task.id);
    });
    
    deleteBtn.addEventListener('click', () => {
        deleteTask(task.id);
    });
    
    return taskItem;
}

// Render all tasks
function renderTasks() {
    const filteredTasks = filterTasks();
    taskList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<li class="empty-message">No tasks to display.</li>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        fragment.appendChild(taskElement);
    });
    
    taskList.appendChild(fragment);
}

// Update analytics
function updateAnalytics() {
    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    // Priority counts
    const highPriorityTasks = tasks.filter(task => task.priority === 'High').length;
    const mediumPriorityTasks = tasks.filter(task => task.priority === 'Medium').length;
    const lowPriorityTasks = tasks.filter(task => task.priority === 'Low').length;
    
    // Update text counters
    totalTasksEl.textContent = totalTasks;
    completedTasksEl.textContent = completedTasks;
    pendingTasksEl.textContent = pendingTasks;
    
    // Update progress bar
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    progressBarEl.style.width = `${completionRate}%`;
    progressPercentEl.textContent = `${completionRate}%`;
    
    // Update priority chart
    const maxPriorityCount = Math.max(highPriorityTasks, mediumPriorityTasks, lowPriorityTasks, 1);
    
    highBarEl.style.width = `${(highPriorityTasks / maxPriorityCount) * 100}%`;
    mediumBarEl.style.width = `${(mediumPriorityTasks / maxPriorityCount) * 100}%`;
    lowBarEl.style.width = `${(lowPriorityTasks / maxPriorityCount) * 100}%`;
    
    highCountEl.textContent = highPriorityTasks;
    mediumCountEl.textContent = mediumPriorityTasks;
    lowCountEl.textContent = lowPriorityTasks;
}

// Format time (seconds) to MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Start pomodoro timer
function startPomodoro() {
    if (pomodoroActive) {
        clearInterval(pomodoroInterval);
        startTimerBtn.textContent = 'Start';
        pomodoroActive = false;
        return;
    }
    
    pomodoroActive = true;
    startTimerBtn.textContent = 'Pause';
    
    pomodoroInterval = setInterval(() => {
        pomodoroTime--;
        timerDisplay.textContent = formatTime(pomodoroTime);
        
        if (pomodoroTime <= 0) {
            clearInterval(pomodoroInterval);
            pomodoroCount++;
            pomodoroCountEl.textContent = pomodoroCount;
            saveToLocalStorage();
            
            // Show notification
            notification.classList.add('show');
            
            // Reset timer but don't restart
            pomodoroTime = 25 * 60;
            pomodoroActive = false;
            startTimerBtn.textContent = 'Start';
            timerDisplay.textContent = formatTime(pomodoroTime);
        }
    }, 1000);
}

// Reset pomodoro timer
function resetPomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroTime = 25 * 60;
    timerDisplay.textContent = formatTime(pomodoroTime);
    pomodoroActive = false;
    startTimerBtn.textContent = 'Start';
}

// Toggle dark/light mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    saveToLocalStorage();
}

// Initialize the app
function initApp() {
    loadFromLocalStorage();
    renderTasks();
    updateAnalytics();
    timerDisplay.textContent = formatTime(pomodoroTime);
    pomodoroCountEl.textContent = pomodoroCount;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);

// Make sure form submission is properly handled
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = taskInput.value.trim();
    const category = categorySelect.value;
    const priority = prioritySelect.value;
    
    if (title) {
        addTask(title, category, priority);
        taskInput.value = '';
    }
});

searchInput.addEventListener('input', renderTasks);
searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    renderTasks();
});
showCompletedCheckbox.addEventListener('change', renderTasks);
clearAllBtn.addEventListener('click', clearAllTasks);
themeToggle.addEventListener('change', toggleTheme);
startTimerBtn.addEventListener('click', startPomodoro);
resetTimerBtn.addEventListener('click', resetPomodoro);

closeNotificationBtn.addEventListener('click', () => {
    notification.classList.remove('show');
});