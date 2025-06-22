class CalendarInteractions {
    constructor(calendar, storage) {
        this.calendar = calendar;
        this.storage = storage;
        this.longPressTimer = null;
        this.longPressDuration = 500; // ms
        this.selectedDate = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.calendar.container.addEventListener('click', this.handleClick.bind(this));
        this.calendar.container.addEventListener('contextmenu', this.handleRightClick.bind(this));
        this.calendar.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.calendar.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.calendar.container.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        this.calendar.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.calendar.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.calendar.container.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
    }

    handleClick(event) {
        const dayBox = event.target.closest('.day-box');
        if (!dayBox || dayBox.classList.contains('empty')) return;

        const date = this.calendar.getDateFromElement(dayBox);
        const commit = this.storage.getCommit(date);

        if (commit) {
            // Toggle off
            this.storage.removeCommit(date);
            this.calendar.updateContribution(date, 0);
            this.updateTooltip(dayBox, null);
        } else {
            // Toggle on with default message
            const defaultMessage = `Commit on ${date}`;
            this.storage.saveCommit(date, defaultMessage);
            this.calendar.updateContribution(date, 1);
            this.updateTooltip(dayBox, defaultMessage);
        }
    }

    handleRightClick(event) {
        event.preventDefault();
        const dayBox = event.target.closest('.day-box');
        if (!dayBox || dayBox.classList.contains('empty')) return;

        const date = this.calendar.getDateFromElement(dayBox);
        this.showEditModal(date);
    }

    handleMouseDown(event) {
        const dayBox = event.target.closest('.day-box');
        if (!dayBox || dayBox.classList.contains('empty')) return;

        this.longPressTimer = setTimeout(() => {
            const date = this.calendar.getDateFromElement(dayBox);
            this.showEditModal(date);
        }, this.longPressDuration);
    }

    handleMouseUp() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    handleTouchStart(event) {
        const dayBox = event.target.closest('.day-box');
        if (!dayBox || dayBox.classList.contains('empty')) return;

        this.longPressTimer = setTimeout(() => {
            const date = this.calendar.getDateFromElement(dayBox);
            this.showEditModal(date);
        }, this.longPressDuration);
    }

    handleTouchEnd() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    showEditModal(date) {
        const commit = this.storage.getCommit(date);
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const title = document.createElement('div');
        title.className = 'modal-title';
        title.textContent = `Edit Commit - ${date}`;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close';
        closeButton.textContent = '×';
        closeButton.onclick = () => {
            document.body.removeChild(modal);
            document.body.removeChild(backdrop);
        };
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        const input = document.createElement('input');
        input.className = 'modal-input';
        input.type = 'text';
        input.value = commit ? commit.message : '';
        input.placeholder = 'Enter commit message...';
        
        content.appendChild(input);
        
        const actions = document.createElement('div');
        actions.className = 'modal-actions';
        
        const saveButton = document.createElement('button');
        saveButton.className = 'modal-button modal-button-primary';
        saveButton.textContent = 'Save';
        saveButton.onclick = () => {
            const message = input.value.trim();
            if (message) {
                this.storage.saveCommit(date, message);
                this.calendar.updateContribution(date, 1);
                const dayBox = this.calendar.container.querySelector(`[data-date="${date}"]`);
                this.updateTooltip(dayBox, message);
            }
            document.body.removeChild(modal);
            document.body.removeChild(backdrop);
        };
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'modal-button modal-button-secondary';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => {
            this.storage.removeCommit(date);
            this.calendar.updateContribution(date, 0);
            const dayBox = this.calendar.container.querySelector(`[data-date="${date}"]`);
            this.updateTooltip(dayBox, null);
            document.body.removeChild(modal);
            document.body.removeChild(backdrop);
        };
        
        actions.appendChild(deleteButton);
        actions.appendChild(saveButton);
        
        modal.appendChild(header);
        modal.appendChild(content);
        modal.appendChild(actions);
        
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        input.focus();
    }

    updateTooltip(dayBox, message) {
        const tooltip = dayBox.querySelector('.tooltip');
        if (message) {
            tooltip.textContent = message;
            tooltip.style.display = 'block';
        } else {
            tooltip.style.display = 'none';
        }
    }
}

export default CalendarInteractions; 