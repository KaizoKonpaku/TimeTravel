import Calendar from './calendar.js';
import CalendarInteractions from './interactions.js';
import Storage from './storage.js';

class TimeTravel {
    constructor() {
        this.initializeApp();
    }

    initializeApp() {
        // Create logo
        const header = document.createElement('header');
        const logoContainer = document.createElement('div');
        logoContainer.className = 'logo-container';

        const logoLetters = document.createElement('div');
        logoLetters.className = 'logo-letters';

        // Add letters for "TIMETRAVEL"
        'TIMETRAVEL'.split('').forEach(letter => {
            const letterDiv = document.createElement('div');
            letterDiv.className = 'logo-letter';
            letterDiv.textContent = letter;
            logoLetters.appendChild(letterDiv);
        });

        const logoSubtitle = document.createElement('div');
        logoSubtitle.className = 'logo-subtitle';
        logoSubtitle.textContent = 'COMMIT ANYWHERE IN TIME';

        logoContainer.appendChild(logoLetters);
        logoContainer.appendChild(logoSubtitle);
        header.appendChild(logoContainer);
        document.body.appendChild(header);

        // Create calendar container
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendar-container';
        document.body.appendChild(calendarContainer);

        // Initialize components
        this.storage = new Storage();
        this.calendar = new Calendar(calendarContainer);
        this.interactions = new CalendarInteractions(this.calendar, this.storage);

        // Add year selector
        this.addYearSelector();

        // Render initial calendar
        this.calendar.render();

        // Load saved commits
        this.loadSavedCommits();

        // Add buttons
        this.addButtons();

        // Initial button state update
        this.updateButtonStates();

        // Add info button
        this.addInfoButton();

        // Add keyboard controls
        this.addKeyboardControls();
    }

    addButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.bottom = '20px';
        buttonContainer.style.left = '0';
        buttonContainer.style.right = '0';
        buttonContainer.style.zIndex = '1000';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.style.padding = '0 20px';
        buttonContainer.className = 'button-container';

        // Left button group
        const leftGroup = document.createElement('div');
        leftGroup.style.display = 'flex';
        leftGroup.style.gap = '10px';

        // Undo Button
        this.undoButton = document.createElement('button');
        this.undoButton.className = 'modal-button modal-button-secondary';
        this.undoButton.innerHTML = '<span class="button-icon">↶</span><span class="button-text">Undo</span>';
        this.undoButton.title = 'Undo';
        this.undoButton.onclick = () => this.handleUndo();
        leftGroup.appendChild(this.undoButton);

        // Redo Button
        this.redoButton = document.createElement('button');
        this.redoButton.className = 'modal-button modal-button-secondary';
        this.redoButton.innerHTML = '<span class="button-icon">↷</span><span class="button-text">Redo</span>';
        this.redoButton.title = 'Redo';
        this.redoButton.onclick = () => this.handleRedo();
        leftGroup.appendChild(this.redoButton);

        // Clear Button
        const clearButton = document.createElement('button');
        clearButton.className = 'modal-button modal-button-secondary';
        clearButton.innerHTML = '<span class="button-icon">×</span><span class="button-text">Clear</span>';
        clearButton.title = 'Clear All';
        clearButton.onclick = () => this.handleClear();
        leftGroup.appendChild(clearButton);

        // Right button group
        const rightGroup = document.createElement('div');
        rightGroup.style.display = 'flex';
        rightGroup.style.gap = '10px';

        // Copy Button
        const copyButton = document.createElement('button');
        copyButton.className = 'modal-button modal-button-primary';
        copyButton.innerHTML = '<span class="button-icon">📋</span><span class="button-text">Copy</span>';
        copyButton.title = 'Copy Commands';
        copyButton.onclick = () => this.copyGitCommands();
        rightGroup.appendChild(copyButton);

        // Export Button
        const exportButton = document.createElement('button');
        exportButton.className = 'modal-button modal-button-secondary';
        exportButton.innerHTML = '<span class="button-icon">💾</span><span class="button-text">Export</span>';
        exportButton.title = 'Export Commands';
        exportButton.onclick = () => {
            if (this.storage.exportCommits(this.calendar.selectedYear)) {
                this.showMessage('Commands for ' + this.calendar.selectedYear + ' exported successfully!');
            } else {
                this.showMessage('No commits found for ' + this.calendar.selectedYear, true);
            }
        };
        rightGroup.appendChild(exportButton);

        // Load Button
        const loadButton = document.createElement('button');
        loadButton.className = 'modal-button modal-button-secondary';
        loadButton.innerHTML = '<span class="button-icon">📂</span><span class="button-text">Load</span>';
        loadButton.title = 'Load Commands';
        loadButton.onclick = () => this.handleFileLoad();
        rightGroup.appendChild(loadButton);

        buttonContainer.appendChild(leftGroup);
        buttonContainer.appendChild(rightGroup);
        document.body.appendChild(buttonContainer);
    }

    updateButtonStates() {
        const history = JSON.parse(localStorage.getItem(this.storage.historyKey)) || [];
        const currentIndex = parseInt(localStorage.getItem(this.storage.historyIndexKey)) || 0;
        
        // Disable undo if we're at the start of history
        this.undoButton.disabled = currentIndex <= 0;
        
        // Disable redo if we're at the end of history
        this.redoButton.disabled = currentIndex >= history.length - 1;
    }

    handleFileLoad() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result;
                    if (this.storage.importCommits(content)) {
                        // Reload the calendar with current year's commits
                        this.calendar.commits.clear();
                        this.calendar.render();
                        this.loadSavedCommits();
                        this.showMessage('Commands loaded successfully!');
                        this.updateButtonStates();
                    } else {
                        this.showMessage('Error loading commands. Please check the file format.', true);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    showMessage(text, isError = false) {
        const message = document.createElement('div');
        message.textContent = text;
        message.style.position = 'fixed';
        message.style.bottom = '80px';
        message.style.right = '20px';
        message.style.background = isError ? 'rgba(218, 54, 51, 0.95)' : 'rgba(22, 27, 34, 0.95)';
        message.style.color = '#c9d1d9';
        message.style.padding = '8px 16px';
        message.style.borderRadius = '6px';
        message.style.zIndex = '1001';
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 2000);
    }

    copyGitCommands() {
        const commits = this.storage.getAllCommits();
        const selectedYear = this.calendar.selectedYear;
        
        // Add initial setup commands
        let commands = [
            '# Initial setup',
            'mkdir timetravel',
            'cd timetravel',
            'git init',
            'echo "# timetravel History" > README.md',
            'git add README.md',
            '',
            '# Commit commands'
        ];
        
        // Add commit commands
        const commitCommands = Object.entries(commits)
            .filter(([date]) => {
                const commitYear = new Date(date).getFullYear();
                return commitYear === selectedYear;
            })
            .map(([date, commit]) => {
                const dateObj = new Date(date);
                const formattedDate = dateObj.toISOString().split('T')[0];
                // Escape quotes in the commit message
                const escapedMessage = commit.message.replace(/"/g, '\\"');
                return `GIT_AUTHOR_DATE="${formattedDate} 12:00:00" GIT_COMMITTER_DATE="${formattedDate} 12:00:00" git commit --allow-empty -m "${escapedMessage}"`;
            });

        if (commitCommands.length > 0) {
            commands = commands.concat(commitCommands);
            
            // Add final push command with the user's GitHub username
            commands.push('');
            commands.push('# Push to GitHub');
            if (this.githubUsername) {
                commands.push('# 1. First, create a new repository on GitHub:');
                commands.push('#    - Go to https://github.com/new');
                commands.push('#    - Name it "timetravel"');
                commands.push('#    - Make it Public');
                commands.push('#    - Don\'t initialize with README');
                commands.push('#    - Click "Create repository"');
                commands.push('');
                commands.push('# 2. Then run these commands:');
                commands.push(`git remote add origin https://github.com/${this.githubUsername}/timetravel.git`);
                commands.push('git push -u origin main');
            } else {
                commands.push('# 1. First, create a new repository on GitHub:');
                commands.push('#    - Go to https://github.com/new');
                commands.push('#    - Name it "timetravel"');
                commands.push('#    - Make it Public');
                commands.push('#    - Don\'t initialize with README');
                commands.push('#    - Click "Create repository"');
                commands.push('');
                commands.push('# 2. Then run these commands:');
                commands.push('# git remote add origin https://github.com/yourusername/timetravel.git');
                commands.push('# git push -u origin main');
            }
            
            const text = commands.join('\n');
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage('Commands for ' + selectedYear + ' copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showMessage('Failed to copy commands', true);
            });
        } else {
            this.showMessage('No commits found for ' + selectedYear, true);
        }
    }

    addYearSelector() {
        const yearSelector = document.createElement('div');
        yearSelector.className = 'year-selector';
        yearSelector.style.display = 'flex';
        yearSelector.style.alignItems = 'center';
        yearSelector.style.gap = '20px';
        yearSelector.style.width = 'fit-content';
        yearSelector.style.justifyContent = 'center';
        yearSelector.style.background = 'rgba(13, 17, 23, 0.95)';
        yearSelector.style.padding = '8px 16px';
        yearSelector.style.borderRadius = '8px';
        yearSelector.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        yearSelector.style.position = 'fixed';
        yearSelector.style.top = '20px';
        yearSelector.style.right = '20px';
        yearSelector.style.zIndex = '1000';

        // Add media query for mobile devices
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleMobileLayout = (e) => {
            if (e.matches) {
                yearSelector.style.position = 'relative';
                yearSelector.style.top = '50px';
                yearSelector.style.right = 'auto';
                yearSelector.style.margin = '40px auto';
            } else {
                yearSelector.style.position = 'fixed';
                yearSelector.style.top = '20px';
                yearSelector.style.right = '20px';
                yearSelector.style.margin = '0';
            }
        };

        // Initial check
        handleMobileLayout(mediaQuery);
        // Add listener for window resize
        mediaQuery.addListener(handleMobileLayout);

        // Year selection
        const yearGroup = document.createElement('div');
        yearGroup.style.display = 'flex';
        yearGroup.style.alignItems = 'center';
        yearGroup.style.gap = '10px';

        const yearLabel = document.createElement('label');
        yearLabel.textContent = 'Year:';
        yearGroup.appendChild(yearLabel);

        const yearSelect = document.createElement('select');
        
        // Add years from 1970 to 2100
        const currentYear = new Date().getFullYear();
        for (let year = 1970; year <= 2100; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }

        // Get saved year from localStorage or use current year
        const savedYear = localStorage.getItem('selectedYear');
        if (savedYear) {
            yearSelect.value = savedYear;
            this.calendar.setYear(parseInt(savedYear));
        } else {
            yearSelect.value = currentYear;
            this.calendar.setYear(currentYear);
        }

        yearSelect.addEventListener('change', (e) => {
            const selectedYear = parseInt(e.target.value);
            this.calendar.setYear(selectedYear);
            this.calendar.render();
            this.loadSavedCommits();
            // Save selected year to localStorage
            localStorage.setItem('selectedYear', selectedYear);
        });

        yearGroup.appendChild(yearSelect);
        yearSelector.appendChild(yearGroup);

        // GitHub username input
        const usernameGroup = document.createElement('div');
        usernameGroup.style.display = 'flex';
        usernameGroup.style.alignItems = 'center';
        usernameGroup.style.gap = '10px';

        const usernameLabel = document.createElement('label');
        usernameLabel.textContent = 'GitHub:';
        usernameGroup.appendChild(usernameLabel);

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.placeholder = 'username';
        usernameInput.value = localStorage.getItem('githubUsername') || '';
        usernameInput.style.width = '120px';
        usernameInput.style.padding = '4px 8px';
        usernameInput.style.borderRadius = '4px';
        usernameInput.style.border = '1px solid #30363d';
        usernameInput.style.background = '#0d1117';
        usernameInput.style.color = '#c9d1d9';

        usernameInput.addEventListener('change', (e) => {
            const username = e.target.value.trim();
            if (username) {
                localStorage.setItem('githubUsername', username);
                this.githubUsername = username;
                // Update the remote URL in the commands if they exist
                this.updateRemoteUrl(username);
            }
        });

        // Add input event to save on each keystroke
        usernameInput.addEventListener('input', (e) => {
            const username = e.target.value.trim();
            if (username) {
                localStorage.setItem('githubUsername', username);
                this.githubUsername = username;
                // Update the remote URL in the commands if they exist
                this.updateRemoteUrl(username);
            }
        });

        usernameGroup.appendChild(usernameInput);
        yearSelector.appendChild(usernameGroup);

        document.body.appendChild(yearSelector);
    }

    updateRemoteUrl(username) {
        // Update any existing remote URL in the commands
        const commands = document.querySelectorAll('.command-line');
        commands.forEach(cmd => {
            if (cmd.textContent.includes('git remote add origin')) {
                cmd.textContent = `git remote add origin https://github.com/${username}/timetravel.git`;
            }
        });
    }

    loadSavedCommits() {
        const commits = this.storage.getAllCommits();
        const selectedYear = this.calendar.selectedYear;
        
        Object.entries(commits)
            .filter(([date]) => {
                const commitYear = new Date(date).getFullYear();
                return commitYear === selectedYear;
            })
            .forEach(([date, commit]) => {
                this.calendar.addCommit(date, commit.message);
            });
    }

    handleUndo() {
        if (this.storage.undo()) {
            this.calendar.commits.clear();
            this.calendar.render();
            this.loadSavedCommits();
            this.showMessage('Undo successful');
            this.updateButtonStates();
        }
    }

    handleRedo() {
        if (this.storage.redo()) {
            this.calendar.commits.clear();
            this.calendar.render();
            this.loadSavedCommits();
            this.showMessage('Redo successful');
            this.updateButtonStates();
        }
    }

    handleClear() {
        if (confirm('Are you sure you want to clear all commits? This cannot be undone.')) {
            this.storage.clearAllCommits();
            this.calendar.commits.clear();
            this.calendar.render();
            this.showMessage('All commits cleared');
            this.updateButtonStates();
        }
    }

    addInfoButton() {
        const infoButton = document.createElement('button');
        infoButton.className = 'info-button';
        infoButton.innerHTML = 'i';
        infoButton.title = 'How to use TimeTravel';
        document.body.appendChild(infoButton);

        let modal = null;
        let backdrop = null;

        const showModal = () => {
            modal = document.createElement('div');
            modal.className = 'modal info-modal';
            modal.innerHTML = `
                <div class="modal-header">
                    <div class="logo-container" style="position: static; transform: none; margin-bottom: 16px;">
                        <div class="logo-letters">
                            ${'TIMETRAVEL'.split('').map(letter => `<div class="logo-letter">${letter}</div>`).join('')}
                        </div>
                        <div class="logo-subtitle">COMMIT ANYWHERE IN TIME</div>
                    </div>
                    <div class="social-icons">
                        <a href="https://github.com/KaizoKonpaku/TimeTravel" target="_blank" rel="noopener noreferrer" class="social-link">
                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                            </svg>
                            GitHub
                        </a>
                        <a href="https://x.com/KaizoKonpakuu" target="_blank" rel="noopener noreferrer" class="social-link">
                            <svg width="1200" height="1227" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="white"/>
                            </svg>
                            KaizoKonpakuu
                        </a>
                    </div>
                </div>
                <div class="modal-content">
                    <div class="info-section">
                        <h3>What is TimeTravel?</h3>
                        <p>TimeTravel helps you create a GitHub-style contribution calendar with custom commit messages. It's perfect for tracking your activities, habits, or any daily events you want to visualize.</p>
                    </div>
                    
                    <div class="info-section">
                        <h3>Getting Started</h3>
                        <ol>
                            <li>Select a year using the dropdown in the top-right corner</li>
                            <li>Click on any day in the calendar to add a commit message</li>
                            <li>Your commits will be saved automatically</li>
                        </ol>
                    </div>

                    <div class="info-section">
                        <h3>Using Your Commits with Git</h3>
                        <ol>
                            <li>From TimeTravel app:
                                <ul>
                                    <li>Select your desired year</li>
                                    <li>Click the "Copy" button to copy all Git commands</li>
                                    <li>Paste the commands into your terminal</li>
                                    <li>Each command will create a commit with your custom message and date</li>
                                </ul>
                            </li>
                        </ol>
                        <p>That's it! Your GitHub profile will now show your custom contribution history.</p>
                    </div>

                    <div class="info-section">
                        <h3>Keyboard Shortcuts</h3>
                        <ul>
                            <li><strong>Arrow Keys:</strong> Navigate through the calendar</li>
                            <li><strong>Space:</strong> Toggle commit on selected day</li>
                            <li><strong>Long Press Space:</strong> Open edit modal for selected day</li>
                            <li><strong>Cmd+Enter / Ctrl+Enter:</strong> Save changes in edit modal</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h3>Features</h3>
                        <ul>
                            <li><strong>Add Commits:</strong> Click any day to add a commit message</li>
                            <li><strong>Edit Commits:</strong> Long press on a commit to modify its message</li>
                            <li><strong>Delete Commits:</strong> Click an existing commit to delete it</li>
                            <li><strong>Copy Commands:</strong> Use the copy button to get Git commands for your commits</li>
                            <li><strong>Export/Import:</strong> Save your commits to a file or load them from a file</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h3>Tips</h3>
                        <ul>
                            <li>Hover over any day to see its date and commit message (if any)</li>
                            <li>Use the export feature to backup your commits</li>
                            <li>You can import commits from a previously exported file</li>
                            <li>The calendar shows your commit history in a GitHub-style heatmap</li>
                        </ul>
                    </div>
                </div>
            `;

            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            document.body.appendChild(backdrop);
            document.body.appendChild(modal);
            infoButton.classList.add('active');
        };

        const hideModal = () => {
            if (modal) {
                modal.remove();
                backdrop.remove();
                modal = null;
                backdrop = null;
                infoButton.classList.remove('active');
            }
        };

        infoButton.addEventListener('click', () => {
            if (modal) {
                hideModal();
            } else {
                showModal();
            }
        });

        // Close modal when clicking backdrop
        document.addEventListener('click', (event) => {
            if (modal && event.target === backdrop) {
                hideModal();
            }
        });
    }

    addKeyboardControls() {
        let selectedDate = null;
        let selectedElement = null;
        let spacePressTimer = null;
        let isModalOpen = false;
        const LONG_PRESS_DURATION = 500; // 500ms for long press

        const updateSelection = (newDate) => {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
            }
            selectedElement = this.calendar.container.querySelector(`[data-date="${newDate}"]`);
            if (selectedElement) {
                selectedElement.classList.add('selected');
                selectedDate = newDate;
            }
        };

        const moveSelection = (days) => {
            if (!selectedDate) {
                // Start with today if no selection
                const today = new Date();
                const dateStr = today.toISOString().split('T')[0];
                updateSelection(dateStr);
                return;
            }

            const currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() + days);
            const newDate = currentDate.toISOString().split('T')[0];
            
            // Check if the new date is in the current year
            if (currentDate.getFullYear() === this.calendar.selectedYear) {
                updateSelection(newDate);
            }
        };

        const toggleCommit = () => {
            if (selectedElement && !selectedElement.classList.contains('empty')) {
                const date = this.calendar.getDateFromElement(selectedElement);
                const commit = this.storage.getCommit(date);

                if (commit) {
                    // Toggle off
                    this.storage.removeCommit(date);
                    this.calendar.updateContribution(date, 0);
                    this.interactions.updateTooltip(selectedElement, null);
                } else {
                    // Toggle on with default message
                    const defaultMessage = `Commit on ${date}`;
                    this.storage.saveCommit(date, defaultMessage);
                    this.calendar.updateContribution(date, 1);
                    this.interactions.updateTooltip(selectedElement, defaultMessage);
                }
            }
        };

        const saveCommit = (modal, input, date) => {
            const message = input.value.trim();
            if (message) {
                this.storage.saveCommit(date, message);
                this.calendar.updateContribution(date, 1);
                this.interactions.updateTooltip(selectedElement, message);
            } else {
                this.storage.removeCommit(date);
                this.calendar.updateContribution(date, 0);
                this.interactions.updateTooltip(selectedElement, null);
            }
            modal.remove();
            document.querySelector('.modal-backdrop').remove();
            isModalOpen = false;
        };

        const showEditModal = () => {
            if (selectedElement && !selectedElement.classList.contains('empty') && !isModalOpen) {
                isModalOpen = true;
                const date = this.calendar.getDateFromElement(selectedElement);
                const commit = this.storage.getCommit(date);
                
                // Create and show the edit modal
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-header">
                        <h3 class="modal-title">Edit Commit</h3>
                    </div>
                    <div class="modal-content">
                        <textarea class="modal-input" placeholder="Enter commit message...">${commit ? commit.message : ''}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-button modal-button-secondary cancel-button">Cancel</button>
                        <button class="modal-button modal-button-primary save-button">Save</button>
                    </div>
                `;

                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop';
                document.body.appendChild(backdrop);
                document.body.appendChild(modal);

                // Focus the input
                const input = modal.querySelector('.modal-input');
                input.focus();

                // Handle save
                const saveButton = modal.querySelector('.save-button');
                saveButton.onclick = () => saveCommit(modal, input, date);

                // Handle cancel
                const cancelButton = modal.querySelector('.cancel-button');
                cancelButton.onclick = () => {
                    modal.remove();
                    backdrop.remove();
                    isModalOpen = false;
                };

                // Close on backdrop click
                backdrop.onclick = () => {
                    modal.remove();
                    backdrop.remove();
                    isModalOpen = false;
                };

                // Handle Cmd+Enter or Ctrl+Enter
                const handleKeyPress = (event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        event.preventDefault();
                        saveCommit(modal, input, date);
                        document.removeEventListener('keydown', handleKeyPress);
                    }
                };
                document.addEventListener('keydown', handleKeyPress);
            }
        };

        document.addEventListener('keydown', (event) => {
            if (isModalOpen) return; // Don't handle keyboard events when modal is open
            
            switch (event.key) {
                case 'ArrowLeft':
                    moveSelection(-7);
                    break;
                case 'ArrowRight':
                    moveSelection(7);
                    break;
                case 'ArrowUp':
                    moveSelection(-1);
                    break;
                case 'ArrowDown':
                    moveSelection(1);
                    break;
                case ' ':
                    event.preventDefault();
                    // Start long press timer
                    spacePressTimer = setTimeout(() => {
                        showEditModal();
                    }, LONG_PRESS_DURATION);
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === ' ') {
                // Clear the long press timer
                if (spacePressTimer) {
                    clearTimeout(spacePressTimer);
                    spacePressTimer = null;
                    // If the timer was cleared before it triggered, it was a short press
                    if (!isModalOpen) {
                        toggleCommit();
                    }
                }
            }
        });
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimeTravel();
}); 