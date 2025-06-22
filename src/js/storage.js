class Storage {
    constructor() {
        this.storageKey = 'timetravel_commits';
        this.historyKey = 'timetravel_history';
        this.historyIndexKey = 'timetravel_history_index';
        this.initializeHistory();
    }

    initializeHistory() {
        if (!localStorage.getItem(this.historyKey)) {
            localStorage.setItem(this.historyKey, JSON.stringify([{}]));
            localStorage.setItem(this.historyIndexKey, '0');
        }
    }

    saveCommit(date, message) {
        const commits = this.getAllCommits();
        commits[date] = { message };
        this.saveToHistory(commits);
        localStorage.setItem(this.storageKey, JSON.stringify(commits));
    }

    getCommit(date) {
        const commits = this.getAllCommits();
        return commits[date] || null;
    }

    removeCommit(date) {
        const commits = this.getAllCommits();
        delete commits[date];
        this.saveToHistory(commits);
        localStorage.setItem(this.storageKey, JSON.stringify(commits));
    }

    getAllCommits() {
        const commits = localStorage.getItem(this.storageKey);
        return commits ? JSON.parse(commits) : {};
    }

    clearAllCommits() {
        const emptyState = {};
        this.saveToHistory(emptyState);
        localStorage.setItem(this.storageKey, JSON.stringify(emptyState));
    }

    saveToHistory(commits) {
        const history = JSON.parse(localStorage.getItem(this.historyKey)) || [{}];
        const currentIndex = parseInt(localStorage.getItem(this.historyIndexKey)) || 0;
        
        // Remove any future states if we're not at the end
        history.splice(currentIndex + 1);
        
        // Add new state
        history.push(JSON.parse(JSON.stringify(commits)));
        
        // Keep only last 50 states
        if (history.length > 50) {
            history.shift();
        }
        
        localStorage.setItem(this.historyKey, JSON.stringify(history));
        localStorage.setItem(this.historyIndexKey, (currentIndex + 1).toString());
    }

    undo() {
        const history = JSON.parse(localStorage.getItem(this.historyKey)) || [{}];
        let currentIndex = parseInt(localStorage.getItem(this.historyIndexKey)) || 0;
        
        if (currentIndex > 0) {
            currentIndex--;
            const previousState = history[currentIndex];
            localStorage.setItem(this.storageKey, JSON.stringify(previousState));
            localStorage.setItem(this.historyIndexKey, currentIndex.toString());
            return true;
        }
        return false;
    }

    redo() {
        const history = JSON.parse(localStorage.getItem(this.historyKey)) || [{}];
        let currentIndex = parseInt(localStorage.getItem(this.historyIndexKey)) || 0;
        
        if (currentIndex < history.length - 1) {
            currentIndex++;
            const nextState = history[currentIndex];
            localStorage.setItem(this.storageKey, JSON.stringify(nextState));
            localStorage.setItem(this.historyIndexKey, currentIndex.toString());
            return true;
        }
        return false;
    }

    exportCommits(selectedYear) {
        const commits = this.getAllCommits();
        const githubUsername = localStorage.getItem('githubUsername') || '';
        
        // Add initial setup commands
        let commands = [
            '# Initial setup',
            'mkdir timewarp',
            'cd timewarp',
            'git init',
            'echo "# TimeWarp History" > README.md',
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
                return `GIT_AUTHOR_DATE="${date} 12:00:00" GIT_COMMITTER_DATE="${date} 12:00:00" git commit --allow-empty -m "${commit.message}"`;
            });

        if (commitCommands.length > 0) {
            commands = commands.concat(commitCommands);
            
            // Add final push command with the user's GitHub username
            commands.push('');
            commands.push('# Push to GitHub');
            if (githubUsername) {
                commands.push('# 1. First, create a new repository on GitHub:');
                commands.push('#    - Go to https://github.com/new');
                commands.push('#    - Name it "timewarp"');
                commands.push('#    - Make it Public');
                commands.push('#    - Don\'t initialize with README');
                commands.push('#    - Click "Create repository"');
                commands.push('');
                commands.push('# 2. Then run these commands:');
                commands.push(`git remote add origin https://github.com/${githubUsername}/timewarp.git`);
                commands.push('git push -u origin main');
            } else {
                commands.push('# 1. First, create a new repository on GitHub:');
                commands.push('#    - Go to https://github.com/new');
                commands.push('#    - Name it "timewarp"');
                commands.push('#    - Make it Public');
                commands.push('#    - Don\'t initialize with README');
                commands.push('#    - Click "Create repository"');
                commands.push('');
                commands.push('# 2. Then run these commands:');
                commands.push('# git remote add origin https://github.com/yourusername/timewarp.git');
                commands.push('# git push -u origin main');
            }
            
            // Create a blob with the commands
            const blob = new Blob([commands.join('\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            // Create and click a download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `git-commands-${selectedYear}.txt`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        }
        
        return false;
    }

    parseGitCommands(text) {
        const commits = {};
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Skip comments and setup commands
            if (line.startsWith('#') || line.startsWith('mkdir') || line.startsWith('cd') || 
                line.startsWith('git init') || line.startsWith('echo') || line.startsWith('git add')) {
                continue;
            }
            
            if (line.startsWith('GIT_AUTHOR_DATE=')) {
                // Extract date and message
                const dateMatch = line.match(/GIT_AUTHOR_DATE="([^"]+)"/);
                const messageMatch = line.match(/-m "([^"]+)"/);
                
                if (dateMatch && messageMatch) {
                    const date = dateMatch[1].split(' ')[0]; // Get just the date part
                    const message = messageMatch[1];
                    commits[date] = { message };
                }
            }
        }
        
        return commits;
    }

    importCommits(commands) {
        try {
            const newCommits = this.parseGitCommands(commands);
            const existingCommits = this.getAllCommits();
            
            // Merge new commits with existing ones
            const mergedCommits = {
                ...existingCommits,
                ...newCommits
            };
            
            this.saveToHistory(mergedCommits);
            localStorage.setItem(this.storageKey, JSON.stringify(mergedCommits));
            return true;
        } catch (error) {
            console.error('Error importing commits:', error);
            return false;
        }
    }
}

export default Storage; 