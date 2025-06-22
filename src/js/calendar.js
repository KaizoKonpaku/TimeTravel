class Calendar {
    constructor(container) {
        this.container = container;
        this.currentDate = new Date();
        this.selectedYear = this.currentDate.getFullYear();
        this.commits = new Map();
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.isScrolling = false;
        this.setupTouchEvents();
    }

    setupTouchEvents() {
        this.container.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartX = e.touches[0].clientX;
            this.isScrolling = false;
        }, { passive: true });

        this.container.addEventListener('touchmove', (e) => {
            if (!this.touchStartY || !this.touchStartX) return;

            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const deltaY = touchY - this.touchStartY;
            const deltaX = touchX - this.touchStartX;

            // Determine if the user is scrolling vertically or horizontally
            if (!this.isScrolling) {
                this.isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
            }

            // If scrolling vertically, prevent default to allow container scrolling
            if (this.isScrolling) {
                e.preventDefault();
            }
        }, { passive: false });

        this.container.addEventListener('touchend', () => {
            this.touchStartY = 0;
            this.touchStartX = 0;
            this.isScrolling = false;
        }, { passive: true });
    }

    setYear(year) {
        this.selectedYear = year;
        this.commits.clear(); // Clear commits when changing years
    }

    addCommit(date, message) {
        const formattedDate = this.formatDate(new Date(date));
        const commitYear = new Date(date).getFullYear();
        
        // Only add commit if it's for the current year
        if (commitYear === this.selectedYear) {
            this.commits.set(formattedDate, message);
            this.updateContribution(formattedDate, 1);
        }
    }

    render() {
        this.container.innerHTML = '';
        
        const yearContainer = document.createElement('div');
        yearContainer.className = 'year-container';

        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';

        // Create weeks for the entire year
        const weekGrid = document.createElement('div');
        weekGrid.className = 'week-grid';

        // Start from the first day of the year
        let currentDate = new Date(this.selectedYear, 0, 1);
        
        // Adjust to the first Sunday
        while (currentDate.getDay() !== 0) {
            currentDate.setDate(currentDate.getDate() - 1);
        }

        // Create weeks until we've covered the entire year
        const endDate = new Date(this.selectedYear, 11, 31);
        while (currentDate <= endDate || currentDate.getDay() !== 0) {
            const weekContainer = document.createElement('div');
            weekContainer.className = 'week-container';

            // Create days for this week (Sunday to Saturday)
            for (let i = 0; i < 7; i++) {
                const dayBox = document.createElement('div');
                
                // Check if this day is in the current year
                if (currentDate.getFullYear() === this.selectedYear) {
                    const formattedDate = this.formatDate(currentDate);
                    dayBox.className = 'day-box contribution-0';
                    dayBox.dataset.date = formattedDate;
                    
                    // Add tooltip
                    const tooltip = document.createElement('div');
                    tooltip.className = 'tooltip';
                    const dateStr = currentDate.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    // Add commit message to tooltip if exists
                    const commitMessage = this.commits.get(formattedDate);
                    if (commitMessage) {
                        tooltip.textContent = `${dateStr}\n${commitMessage}`;
                        dayBox.className = 'day-box contribution-1';
                    } else {
                        tooltip.textContent = dateStr;
                    }
                    
                    dayBox.appendChild(tooltip);
                } else {
                    dayBox.className = 'day-box empty';
                }

                weekContainer.appendChild(dayBox);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            weekGrid.appendChild(weekContainer);
        }

        monthGrid.appendChild(weekGrid);
        yearContainer.appendChild(monthGrid);
        this.container.appendChild(yearContainer);
    }

    updateContribution(date, level) {
        const dayBox = this.container.querySelector(`[data-date="${date}"]`);
        if (dayBox) {
            dayBox.className = `day-box contribution-${level}`;
        }
    }

    getDateFromElement(element) {
        return element.dataset.date;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

export default Calendar; 