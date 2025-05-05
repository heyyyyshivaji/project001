// Global app state
const appState = {
    // Files, images and PDFs storage
    files: [],
    images: [],
    pdfs: [],
    
    // Todo list
    todos: [],
    
    // Pomodoro timer settings and state
    pomodoro: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        timeLeft: 25 * 60,
        timerState: 'inactive', // 'inactive', 'work', 'shortBreak', 'longBreak'
        isRunning: false,
        cycles: 0,
        timerInterval: null
    }
};

// Helper function to generate unique IDs
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// DOM ready function
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initFilesSection();
    initImagesSection();
    initPdfsSection();
    initTodoSection();
    initPomodoroSection();
    initSettingsSection();
});

// Navigation and section display
function initNavigation() {
    const links = document.querySelectorAll('.sidebar-menu a');
    const sections = document.querySelectorAll('.content-section');
    const dashboardCards = document.querySelectorAll('.dashboard-cards .card');
    
    // Sidebar toggle for mobile and desktop
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    // Make sidebar togglable on all screen sizes
    function toggleSidebar() {
        console.log('Sidebar toggle clicked!');
        sidebar.classList.toggle('open');
        sidebar.classList.toggle('closed');
    }
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (mobileSidebarToggle) mobileSidebarToggle.addEventListener('click', toggleSidebar);
    
    // Navigation links
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(`${targetId}-section`);
            
            // Remove active class from all links and sections
            links.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link and target section
            link.classList.add('active');
            targetSection.classList.add('active');
            
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                sidebar.classList.remove('open');
                sidebar.classList.add('closed');
            }
        });
    });
    
    // Dashboard card navigation
    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetId = card.dataset.target;
            const targetSection = document.getElementById(targetId);
            const targetLink = document.querySelector(`.sidebar-menu a[href="#${targetId.replace('-section', '')}"]`);
            
            // Remove active class from all links and sections
            links.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to corresponding link and target section
            targetLink.classList.add('active');
            targetSection.classList.add('active');
        });
    });
}

// File management functions
function initFilesSection() {
    const uploadZone = document.getElementById('file-upload-zone');
    const fileInput = document.getElementById('file-upload');
    const browseBtn = document.getElementById('browse-files-btn');
    const filesContainer = document.getElementById('files-container');
    const searchInput = document.getElementById('files-search');
    
    setupFileUpload(uploadZone, fileInput, browseBtn, filesContainer, appState.files, searchInput, 'file');
}

function initImagesSection() {
    const uploadZone = document.getElementById('image-upload-zone');
    const fileInput = document.getElementById('image-upload');
    const browseBtn = document.getElementById('browse-images-btn');
    const imagesContainer = document.getElementById('images-container');
    const searchInput = document.getElementById('images-search');
    
    setupFileUpload(uploadZone, fileInput, browseBtn, imagesContainer, appState.images, searchInput, 'image');
}

function initPdfsSection() {
    const uploadZone = document.getElementById('pdf-upload-zone');
    const fileInput = document.getElementById('pdf-upload');
    const browseBtn = document.getElementById('browse-pdfs-btn');
    const pdfsContainer = document.getElementById('pdfs-container');
    const searchInput = document.getElementById('pdfs-search');
    
    setupFileUpload(uploadZone, fileInput, browseBtn, pdfsContainer, appState.pdfs, searchInput, 'pdf');
}

function setupFileUpload(dropZone, fileInput, browseBtn, container, filesArray, searchInput, fileType) {
    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files, filesArray, container, fileType);
    });
    
    // Handle click upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files, filesArray, container, fileType);
    });
    
    // Handle search
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        renderFiles(filesArray, container, fileType, query);
    });
}

function handleFiles(fileList, filesArray, container, fileType) {
    // Check file type constraints
    const validFiles = Array.from(fileList).filter(file => {
        if (fileType === 'image') {
            if (!file.type.startsWith('image/')) {
                showToast('Please select only image files', 'error');
                return false;
            }
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showToast('Image size should be less than 10MB', 'error');
                return false;
            }
        } else if (fileType === 'pdf' && file.type !== 'application/pdf') {
            showToast('Please select only PDF files', 'error');
            return false;
        }
        return true;
    });
    
    // Add valid files to the array
    for (const file of validFiles) {
        try {
            const fileURL = URL.createObjectURL(file);
            const newFile = {
                id: generateId(),
                name: file.name,
                type: file.type,
                url: fileURL,
                size: file.size,
                date: new Date()
            };
            
            filesArray.push(newFile);
        } catch (error) {
            console.error('Error processing file:', error);
            showToast(`Error processing ${file.name}`, 'error');
        }
    }
    
    if (validFiles.length > 0) {
        showToast(`${validFiles.length} file(s) uploaded successfully!`, 'success');
        renderFiles(filesArray, container, fileType);
    }
}

function renderFiles(filesArray, container, fileType, searchQuery = '') {
    container.innerHTML = '';
    
    // Filter files by search query if provided
    const filteredFiles = searchQuery ? 
        filesArray.filter(file => file.name.toLowerCase().includes(searchQuery)) : 
        filesArray;
    
    if (filteredFiles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No ${fileType}s found. Upload some ${fileType}s to get started.</p>
            </div>
        `;
        return;
    }
    
    filteredFiles.forEach(file => {
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        
        let fileContent;
        if (fileType === 'image') {
            fileContent = `
                <div class="file-content">
                    <img src="${file.url}" alt="${file.name}" class="file-image">
                </div>
                <div class="file-name" id="name-${file.id}">
                    ${file.name}
                </div>
                <div class="file-actions">
                    <span>${formatDate(file.date)}</span>
                    <div class="action-buttons">
                        <button class="view-button" onclick="window.open('${file.url}', '_blank')">
                            <span class="icon">👁️</span>
                            View
                        </button>
                        <button class="btn primary rename-btn" data-id="${file.id}">Rename</button>
                        <button class="btn destructive delete-btn" data-id="${file.id}">Delete</button>
                    </div>
                </div>
            `;
        } else if (fileType === 'pdf') {
            fileContent = `
                <div class="file-content">
                    <div class="file-icon">📑</div>
                </div>
                <div class="file-name" id="name-${file.id}">
                    ${file.name}
                </div>
                <div class="file-actions">
                    <span>${formatDate(file.date)}</span>
                    <div class="action-buttons">
                        <button class="view-button" onclick="window.open('${file.url}', '_blank')">
                            <span class="icon">👁️</span>
                            View
                        </button>
                        <button class="btn primary rename-btn" data-id="${file.id}">Rename</button>
                        <button class="btn destructive delete-btn" data-id="${file.id}">Delete</button>
                    </div>
                </div>
            `;
        } else {
            fileContent = `
                <div class="file-content">
                    <div class="file-icon">📄</div>
                </div>
                <div class="file-name" id="name-${file.id}">
                    ${file.name}
                </div>
                <div class="file-actions">
                    <span>${formatDate(file.date)}</span>
                    <div class="action-buttons">
                        <button class="view-button" onclick="window.open('${file.url}', '_blank')">
                            <span class="icon">👁️</span>
                            View
                        </button>
                        <button class="btn primary rename-btn" data-id="${file.id}">Rename</button>
                        <button class="btn destructive delete-btn" data-id="${file.id}">Delete</button>
                    </div>
                </div>
            `;
        }
        
        fileCard.innerHTML = fileContent;
        container.appendChild(fileCard);
        
        // Add event listeners for rename and delete buttons
        const renameBtn = fileCard.querySelector('.rename-btn');
        const deleteBtn = fileCard.querySelector('.delete-btn');
        
        renameBtn.addEventListener('click', () => {
            renameFile(file.id, filesArray, container, fileType);
        });
        
        deleteBtn.addEventListener('click', () => {
            deleteFile(file.id, filesArray, container, fileType);
        });
    });
}

function renameFile(id, filesArray, container, fileType) {
    const fileIndex = filesArray.findIndex(file => file.id === id);
    const file = filesArray[fileIndex];
    const nameElement = document.getElementById(`name-${id}`);
    
    // Replace element with input
    const currentName = nameElement.textContent.trim();
    nameElement.innerHTML = `
        <input type="text" class="rename-input" value="${currentName}">
        <button class="btn primary save-btn">Save</button>
        <button class="btn secondary cancel-btn">Cancel</button>
    `;
    
    const input = nameElement.querySelector('input');
    const saveBtn = nameElement.querySelector('.save-btn');
    const cancelBtn = nameElement.querySelector('.cancel-btn');
    
    input.focus();
    input.select();
    
    saveBtn.addEventListener('click', () => {
        const newName = input.value.trim();
        if (newName === '') {
            showToast('File name cannot be empty', 'error');
            return;
        }
        
        filesArray[fileIndex].name = newName;
        nameElement.textContent = newName;
        showToast(`File renamed to "${newName}"`, 'success');
    });
    
    cancelBtn.addEventListener('click', () => {
        nameElement.textContent = currentName;
    });
}

function deleteFile(id, filesArray, container, fileType) {
    const fileIndex = filesArray.findIndex(file => file.id === id);
    const file = filesArray[fileIndex];
    
    // Remove file from array
    filesArray.splice(fileIndex, 1);
    
    // Revoke object URL to free up memory
    URL.revokeObjectURL(file.url);
    
    // Re-render files
    renderFiles(filesArray, container, fileType);
    
    showToast(`File "${file.name}" deleted`, 'success');
}

// Todo list functions
function initTodoSection() {
    const newTodoInput = document.getElementById('new-todo');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');
    
    addTodoBtn.addEventListener('click', () => {
        const todoText = newTodoInput.value.trim();
        if (todoText === '') return;
        
        const newTodo = {
            id: generateId(),
            title: todoText,
            completed: false,
            createdAt: new Date()
        };
        
        appState.todos.push(newTodo);
        renderTodos();
        newTodoInput.value = '';
        showToast('Task added', 'success');
    });
    
    newTodoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addTodoBtn.click();
        }
    });
    
    function renderTodos() {
        todoList.innerHTML = '';
        
        if (appState.todos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <p>No tasks yet. Add some tasks to get started.</p>
                </div>
            `;
            return;
        }
        
        appState.todos.forEach(todo => {
            const todoItem = document.createElement('div');
            todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            todoItem.innerHTML = `
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-id="${todo.id}">
                    ${todo.completed ? '✓' : ''}
                </div>
                <div class="todo-text" id="todo-text-${todo.id}">${todo.title}</div>
                <div class="todo-actions">
                    <button class="btn secondary edit-btn" data-id="${todo.id}">Edit</button>
                    <button class="btn destructive delete-todo-btn" data-id="${todo.id}">Delete</button>
                </div>
            `;
            
            todoList.appendChild(todoItem);
            
            // Add event listeners
            const checkbox = todoItem.querySelector('.todo-checkbox');
            const editBtn = todoItem.querySelector('.edit-btn');
            const deleteBtn = todoItem.querySelector('.delete-todo-btn');
            
            checkbox.addEventListener('click', () => {
                toggleTodo(todo.id);
            });
            
            editBtn.addEventListener('click', () => {
                editTodo(todo.id);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteTodo(todo.id);
            });
        });
    }
    
    function toggleTodo(id) {
        const todo = appState.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            renderTodos();
        }
    }
    
    function editTodo(id) {
        const todoTextElement = document.getElementById(`todo-text-${id}`);
        const currentText = todoTextElement.textContent;
        
        todoTextElement.innerHTML = `
            <input type="text" class="rename-input" value="${currentText}">
            <button class="btn primary save-todo-btn">Save</button>
            <button class="btn secondary cancel-todo-btn">Cancel</button>
        `;
        
        const input = todoTextElement.querySelector('input');
        const saveBtn = todoTextElement.querySelector('.save-todo-btn');
        const cancelBtn = todoTextElement.querySelector('.cancel-todo-btn');
        
        input.focus();
        input.select();
        
        saveBtn.addEventListener('click', () => {
            const newText = input.value.trim();
            if (newText === '') {
                showToast('Task text cannot be empty', 'error');
                return;
            }
            
            const todo = appState.todos.find(todo => todo.id === id);
            if (todo) {
                todo.title = newText;
                renderTodos();
                showToast('Task updated', 'success');
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            renderTodos();
        });
    }
    
    function deleteTodo(id) {
        const todoIndex = appState.todos.findIndex(todo => todo.id === id);
        if (todoIndex !== -1) {
            appState.todos.splice(todoIndex, 1);
            renderTodos();
            showToast('Task deleted', 'success');
        }
    }
    
    // Initial render
    renderTodos();
}

// Pomodoro timer functions
function initPomodoroSection() {
    const timerDisplay = document.getElementById('timer');
    const timerToggle = document.getElementById('timer-toggle');
    const timerSkip = document.getElementById('timer-skip');
    const workDurationInput = document.getElementById('work-duration');
    const shortBreakDurationInput = document.getElementById('short-break-duration');
    const longBreakDurationInput = document.getElementById('long-break-duration');
    const workValue = document.getElementById('work-value');
    const shortBreakValue = document.getElementById('short-break-value');
    const longBreakValue = document.getElementById('long-break-value');
    const cycleCount = document.getElementById('cycle-count');
    const timerState = appState.pomodoro;
    
    // Initialize timer display
    updateTimerDisplay();
    
    // Timer toggle button
    timerToggle.addEventListener('click', () => {
        if (timerState.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });
    
    // Skip button
    timerSkip.addEventListener('click', () => {
        skipToNext();
    });
    
    // Duration settings
    workDurationInput.addEventListener('input', () => {
        const value = parseInt(workDurationInput.value);
        timerState.workDuration = value;
        workValue.textContent = value;
        if (!timerState.isRunning && (timerState.timerState === 'inactive' || timerState.timerState === 'work')) {
            timerState.timeLeft = value * 60;
            updateTimerDisplay();
        }
    });
    
    shortBreakDurationInput.addEventListener('input', () => {
        const value = parseInt(shortBreakDurationInput.value);
        timerState.shortBreakDuration = value;
        shortBreakValue.textContent = value;
        if (!timerState.isRunning && timerState.timerState === 'shortBreak') {
            timerState.timeLeft = value * 60;
            updateTimerDisplay();
        }
    });
    
    longBreakDurationInput.addEventListener('input', () => {
        const value = parseInt(longBreakDurationInput.value);
        timerState.longBreakDuration = value;
        longBreakValue.textContent = value;
        if (!timerState.isRunning && timerState.timerState === 'longBreak') {
            timerState.timeLeft = value * 60;
            updateTimerDisplay();
        }
    });
    
    function startTimer() {
        if (timerState.timerState === 'inactive') {
            timerState.timerState = 'work';
            timerState.timeLeft = timerState.workDuration * 60;
            document.querySelector('.timer-state').textContent = 'Work Time';
        }
        
        timerState.isRunning = true;
        timerToggle.textContent = 'Pause';
        
        if (timerState.timerInterval) {
            clearInterval(timerState.timerInterval);
        }
        
        timerState.timerInterval = setInterval(() => {
            timerState.timeLeft--;
            updateTimerDisplay();
            
            if (timerState.timeLeft <= 0) {
                clearInterval(timerState.timerInterval);
                showToast(`${timerState.timerState === 'work' ? 'Work' : 'Break'} time is up!`, 'info');
                skipToNext();
            }
        }, 1000);
    }
    
    function pauseTimer() {
        timerState.isRunning = false;
        timerToggle.textContent = 'Start';
        clearInterval(timerState.timerInterval);
    }
    
    function skipToNext() {
        clearInterval(timerState.timerInterval);
        
        if (timerState.timerState === 'work') {
            // After work session, determine if we should take a long break
            timerState.cycles++;
            cycleCount.textContent = timerState.cycles;
            
            if (timerState.cycles % 4 === 0) {
                timerState.timerState = 'longBreak';
                timerState.timeLeft = timerState.longBreakDuration * 60;
                document.querySelector('.timer-state').textContent = 'Long Break';
            } else {
                timerState.timerState = 'shortBreak';
                timerState.timeLeft = timerState.shortBreakDuration * 60;
                document.querySelector('.timer-state').textContent = 'Short Break';
            }
        } else {
            // After any break, go back to work
            timerState.timerState = 'work';
            timerState.timeLeft = timerState.workDuration * 60;
            document.querySelector('.timer-state').textContent = 'Work Time';
        }
        
        updateTimerDisplay();
        
        if (timerState.isRunning) {
            startTimer();
        }
        
        showToast(`Switched to ${timerState.timerState === 'work' ? 'Work' : timerState.timerState === 'shortBreak' ? 'Short Break' : 'Long Break'} time`, 'info');
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timerState.timeLeft / 60);
        const seconds = timerState.timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Pomodoro Music Player
const pomodoroAudio = document.getElementById('pomodoro-audio');
const pomodoroPlaylist = document.getElementById('pomodoro-playlist');
const addMusicBtn = document.getElementById('add-music-btn');

// Initialize music player
let currentSongIndex = 0;
let isPlaying = false;

// Function to play a song
function playSong(index) {
    const songs = pomodoroPlaylist.querySelectorAll('.playlist-item');
    if (songs.length === 0) return;

    // Remove active class from all songs
    songs.forEach(song => song.classList.remove('active'));
    
    // Add active class to current song
    songs[index].classList.add('active');
    
    // Set audio source and play
    const songUrl = songs[index].dataset.url;
    pomodoroAudio.src = songUrl;
    pomodoroAudio.play();
    isPlaying = true;
}

// Function to play next song
function playNextSong() {
    const songs = pomodoroPlaylist.querySelectorAll('.playlist-item');
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(currentSongIndex);
}

// Function to play previous song
function playPreviousSong() {
    const songs = pomodoroPlaylist.querySelectorAll('.playlist-item');
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(currentSongIndex);
}

// Add click event listeners to playlist items
pomodoroPlaylist.addEventListener('click', (e) => {
    const playlistItem = e.target.closest('.playlist-item');
    if (!playlistItem) return;

    if (e.target.classList.contains('remove-song')) {
        playlistItem.remove();
        return;
    }

    const songs = Array.from(pomodoroPlaylist.querySelectorAll('.playlist-item'));
    currentSongIndex = songs.indexOf(playlistItem);
    playSong(currentSongIndex);
});

// Add music button click handler
addMusicBtn.addEventListener('click', () => {
    const url = prompt('Enter the URL of the music file (MP3, WAV, etc.):');
    if (!url) return;

    const title = prompt('Enter the title of the song:');
    if (!title) return;

    const playlistItem = document.createElement('div');
    playlistItem.className = 'playlist-item';
    playlistItem.dataset.url = url;
    playlistItem.innerHTML = `
        <span class="song-title">${title}</span>
        <button class="remove-song">×</button>
    `;

    pomodoroPlaylist.appendChild(playlistItem);
});

// Audio ended event handler
pomodoroAudio.addEventListener('ended', () => {
    playNextSong();
});

// Add keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return; // Don't trigger when typing in inputs
    
    switch(e.key) {
        case ' ': // Space bar
            e.preventDefault();
            if (isPlaying) {
                pomodoroAudio.pause();
                isPlaying = false;
            } else {
                pomodoroAudio.play();
                isPlaying = true;
            }
            break;
        case 'ArrowRight':
            playNextSong();
            break;
        case 'ArrowLeft':
            playPreviousSong();
            break;
    }
});

// Settings functions
function initSettingsSection() {
    const themeSelect = document.getElementById('theme-select');
    const notificationToggle = document.getElementById('notification-toggle');
    
    themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        applyTheme(theme);
        showToast(`Theme changed to ${theme}`, 'info');
    });
    
    notificationToggle.addEventListener('change', () => {
        const enabled = notificationToggle.checked;
        showToast(`Notifications ${enabled ? 'enabled' : 'disabled'}`, 'info');
    });
    
    function applyTheme(theme) {
        // This is a simplified theme implementation
        if (theme === 'dark') {
            document.documentElement.style.setProperty('--background', '#111827');
            document.documentElement.style.setProperty('--text', '#f9fafb');
            document.documentElement.style.setProperty('--text-light', '#9ca3af');
            document.documentElement.style.setProperty('--card', '#1f2937');
            document.documentElement.style.setProperty('--border', '#374151');
            document.documentElement.style.setProperty('--sidebar-bg', '#1f2937');
            document.documentElement.style.setProperty('--sidebar-border', '#374151');
            document.documentElement.style.setProperty('--secondary', '#1f2937');
        } else {
            document.documentElement.style.setProperty('--background', '#ffffff');
            document.documentElement.style.setProperty('--text', '#0f172a');
            document.documentElement.style.setProperty('--text-light', '#64748b');
            document.documentElement.style.setProperty('--card', '#ffffff');
            document.documentElement.style.setProperty('--border', '#e2e8f0');
            document.documentElement.style.setProperty('--sidebar-bg', '#f8fafc');
            document.documentElement.style.setProperty('--sidebar-border', '#e2e8f0');
            document.documentElement.style.setProperty('--secondary', '#f1f5f9');
        }
    }
}

// Utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}