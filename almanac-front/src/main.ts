// Types
interface Habit {
  id: number;
  name: string;
  description?: string;
  category: 'saude' | 'exercicio' | 'estudo' | 'trabalho' | 'lazer' | 'outros';
  createdAt?: string;
  updatedAt?: string;
  completedToday?: boolean;
}

interface CreateHabitDto {
  name: string;
  description?: string;
  category: string;
}

// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// State Management
class AlmanacApp {
  private habits: Habit[] = [];
  private currentEditingHabit: Habit | null = null;
  private isLoading = false;

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupEventListeners();
    this.loadHabits();
  }

  // Event Listeners
  private setupEventListeners(): void {
    // Tab switching
    document.querySelectorAll<HTMLButtonElement>('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLButtonElement;
        const tabName = el.dataset.tab;
        if (tabName) this.switchTab(tabName);
      });
    });

    // Modal controls
    document.getElementById('fab')?.addEventListener('click', () => this.openModal());
    document.getElementById('create-first-habit')?.addEventListener('click', () => this.openModal());
    document.getElementById('close-modal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancel-btn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('save-btn')?.addEventListener('click', () => this.saveHabit());
    document.getElementById('overlay')?.addEventListener('click', () => this.closeModal());

    // Form validation
    const nameInput = document.getElementById('habit-name') as HTMLInputElement | null;
    nameInput?.addEventListener('input', () => this.validateForm());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('modal');
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        this.closeModal();
      }
      if (e.key === 'Enter' && modal && !modal.classList.contains('hidden') && e.target === nameInput) {
        e.preventDefault();
        this.saveHabit();
      }
    });
  }

  private switchTab(tabName: string): void {
    // Update nav buttons
    document.querySelectorAll<HTMLButtonElement>('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll<HTMLElement>('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabName);
    });

    // Show/hide FAB
    const fab = document.getElementById('fab') as HTMLElement | null;
    if (fab) fab.style.display = tabName === 'dashboard' ? 'block' : 'none';

    // Update statistics when switching to stats tab
    if (tabName === 'statistics') this.updateStatistics();
  }

  // API calls
  private async apiRequest(endpoint: string, options?: RequestInit): Promise<any> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  private async loadHabits(): Promise<void> {
    this.setLoading(true);
    try {
      const habits = await this.apiRequest('/hobbies');
      this.habits = (habits || []).map((habit: any) => ({
        ...habit,
        completedToday: false // Initialize completion status
      }));
      this.renderHabits();
      this.updateStats();
    } catch (error) {
      console.error('Erro ao carregar hábitos:', error);
      this.showNotification('Erro ao carregar hábitos', 'error');
      // Show empty state even on error
      this.habits = [];
      this.renderHabits();
    } finally {
      this.setLoading(false);
    }
  }

  private async createHabit(data: CreateHabitDto): Promise<void> {
    try {
      await this.apiRequest('/hobbies', { method: 'POST', body: JSON.stringify(data) });
      await this.loadHabits();
      this.showNotification('Hábito criado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar hábito:', error);
      this.showNotification('Erro ao criar hábito', 'error');
    }
  }

  private async updateHabit(id: number, data: CreateHabitDto): Promise<void> {
    try {
      await this.apiRequest(`/hobbies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      await this.loadHabits();
      this.showNotification('Hábito atualizado!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar hábito:', error);
      this.showNotification('Erro ao atualizar hábito', 'error');
    }
  }

  private async deleteHabit(id: number): Promise<void> {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return;
    
    if (!confirm(`Tem certeza que deseja deletar "${habit.name}"?`)) return;
    
    try {
      await this.apiRequest(`/hobbies/${id}`, { method: 'DELETE' });
      await this.loadHabits();
      this.showNotification('Hábito deletado', 'info');
    } catch (error) {
      console.error('Erro ao deletar hábito:', error);
      this.showNotification('Erro ao deletar hábito', 'error');
    }
  }

  // UI Methods
  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    const loadingEl = document.getElementById('loading');
    const habitsList = document.getElementById('habits-list');
    const emptyState = document.getElementById('empty-state');
    
    if (loadingEl) loadingEl.classList.toggle('hidden', !loading);
    
    if (loading) {
      habitsList?.classList.add('hidden');
      emptyState?.classList.add('hidden');
    }
  }

  private renderHabits(): void {
    const habitsList = document.getElementById('habits-list');
    const emptyState = document.getElementById('empty-state');
    
    if (!habitsList || !emptyState) return;

    if (this.habits.length === 0) {
      habitsList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    habitsList.classList.remove('hidden');

    habitsList.innerHTML = this.habits.map(habit => `
      <div class="habit-card ${habit.completedToday ? 'completed' : ''}" data-habit-id="${habit.id}">
        <div class="habit-card-content">
          <div class="habit-info">
            <div class="habit-icon ${habit.category}">
              ${this.getCategoryIcon(habit.category)}
            </div>
            <div class="habit-details">
              <h3>${this.escapeHtml(habit.name)}</h3>
              ${habit.description ? `<p>${this.escapeHtml(habit.description)}</p>` : ''}
            </div>
          </div>
          <div class="habit-actions">
            <button class="action-btn check" onclick="app.toggleHabit(${habit.id})" title="${habit.completedToday ? 'Desmarcar' : 'Marcar como concluído'}">
              ${habit.completedToday ? '✓' : '○'}
            </button>
            <button class="action-btn edit" onclick="app.editHabit(${habit.id})" title="Editar">
              ✏️
            </button>
            <button class="action-btn delete" onclick="app.deleteHabitById(${habit.id})" title="Deletar">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  private updateStats(): void {
    const totalHabits = this.habits.length;
    const completedToday = this.habits.filter(h => h.completedToday).length;
    const currentStreak = 0; // TODO: Implement streak logic
    
    // Update dashboard stats
    const totalEl = document.getElementById('total-habits');
    const completedEl = document.getElementById('completed-today');
    const streakEl = document.getElementById('current-streak');
    
    if (totalEl) totalEl.textContent = totalHabits.toString();
    if (completedEl) completedEl.textContent = completedToday.toString();
    if (streakEl) streakEl.textContent = currentStreak.toString();
  }

  private updateStatistics(): void {
    const totalHabits = this.habits.length;
    const currentStreak = 0; // TODO: Implement streak logic
    const achievements = Math.floor(this.habits.filter(h => h.completedToday).length / 2);
    
    // Update statistics tab
    const statsTotalEl = document.getElementById('stats-total');
    const statsStreakEl = document.getElementById('stats-streak');
    const statsAchievementsEl = document.getElementById('stats-achievements');
    
    if (statsTotalEl) statsTotalEl.textContent = totalHabits.toString();
    if (statsStreakEl) statsStreakEl.textContent = currentStreak.toString();
    if (statsAchievementsEl) statsAchievementsEl.textContent = achievements.toString();
  }

  // Modal Methods
  private openModal(habit?: Habit): void {
    this.currentEditingHabit = habit || null;
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('overlay');
    const modalTitle = document.getElementById('modal-title');
    const saveBtnText = document.getElementById('save-btn-text');
    
    if (!modal || !overlay || !modalTitle || !saveBtnText) return;
    
    if (habit) {
      modalTitle.textContent = 'Editar Hábito';
      saveBtnText.textContent = 'Salvar';
      this.fillForm(habit);
    } else {
      modalTitle.textContent = 'Novo Hábito';
      saveBtnText.textContent = 'Criar';
      this.clearForm();
    }
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    nameInput?.focus();
    this.validateForm();
  }

  private closeModal(): void {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('overlay');
    
    modal?.classList.add('hidden');
    overlay?.classList.add('hidden');
    this.currentEditingHabit = null;
    this.clearForm();
  }

  private fillForm(habit: Habit): void {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const descInput = document.getElementById('habit-description') as HTMLTextAreaElement;
    const categorySelect = document.getElementById('habit-category') as HTMLSelectElement;
    
    if (nameInput) nameInput.value = habit.name;
    if (descInput) descInput.value = habit.description || '';
    if (categorySelect) categorySelect.value = habit.category;
  }

  private clearForm(): void {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const descInput = document.getElementById('habit-description') as HTMLTextAreaElement;
    const categorySelect = document.getElementById('habit-category') as HTMLSelectElement;
    
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    if (categorySelect) categorySelect.value = 'saude';
  }

  private validateForm(): void {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    
    if (!nameInput || !saveBtn) return;
    
    const isValid = nameInput.value.trim().length > 0;
    saveBtn.disabled = !isValid;
    saveBtn.style.opacity = isValid ? '1' : '0.5';
    saveBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  }

  private async saveHabit(): Promise<void> {
    const nameInput = document.getElementById('habit-name') as HTMLInputElement;
    const descInput = document.getElementById('habit-description') as HTMLTextAreaElement;
    const categorySelect = document.getElementById('habit-category') as HTMLSelectElement;
    
    if (!nameInput || !descInput || !categorySelect) return;
    
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    const category = categorySelect.value;

    if (!name) {
      this.showNotification('Nome do hábito é obrigatório', 'error');
      return;
    }

    const habitData: CreateHabitDto = {
      name,
      description: description || undefined,
      category
    };

    if (this.currentEditingHabit) {
      await this.updateHabit(this.currentEditingHabit.id, habitData);
    } else {
      await this.createHabit(habitData);
    }

    this.closeModal();
  }

  // Public Methods (called from HTML onclick)
  public toggleHabit(id: number): void {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return;
    
    habit.completedToday = !habit.completedToday;
    
    // Add success animation
    const card = document.querySelector(`[data-habit-id="${id}"]`);
    if (card) {
      card.classList.add('success-animation');
      setTimeout(() => card.classList.remove('success-animation'), 600);
    }
    
    this.renderHabits();
    this.updateStats();
    
    const message = habit.completedToday ? 'Parabéns! Hábito concluído! 🎉' : 'Hábito desmarcado';
    this.showNotification(message, habit.completedToday ? 'success' : 'info');
  }

  public editHabit(id: number): void {
    const habit = this.habits.find(h => h.id === id);
    if (habit) {
      this.openModal(habit);
    }
  }

  public async deleteHabitById(id: number): Promise<void> {
    await this.deleteHabit(id);
  }

  // Utility Methods
  private getCategoryIcon(category: string): string {
    const icons = {
      saude: '🏥',
      exercicio: '💪',
      estudo: '📚',
      trabalho: '💼',
      lazer: '🎮',
      outros: '⭐'
    };
    return icons[category as keyof typeof icons] || '⭐';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      background: ${colors[type]};
      color: white;
      border-radius: 12px;
      font-weight: 600;
      z-index: 2000;
      animation: slideInRight 0.3s ease;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      max-width: 300px;
    `;
    
    notification.textContent = message;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    
    if (!document.head.querySelector('style[data-notifications]')) {
      style.setAttribute('data-notifications', 'true');
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the app
const app = new AlmanacApp();

// Make app available globally for onclick handlers
(window as any).app = app;

// ===== ADICIONE ISSO NO FINAL DO SEU MAIN.TS =====

// Challenge state
let challengeActive = false;
let completedHabitsToday: number[] = [];

// Função para trocar para a aba Challenge (ou qualquer outra)
function switchToTab(tabName: string) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// Atualiza a tela de ofensiva baseado nos hábitos existentes
function updateChallengeTab() {
    const hasHabits = this.habits && this.habits.length > 0;
    const challengeEmpty = document.getElementById('challenge-empty-state');
    const challengeContent = document.getElementById('challenge-content');
    
    if (challengeEmpty && challengeContent) {
        challengeEmpty.classList.toggle('hidden', hasHabits);
        challengeContent.classList.toggle('hidden', !hasHabits);
    }
    
    if (hasHabits) {
        updateChallengeStats();
        renderChallengeHabits();
        updateProgressCircle();
        updateCurrentDate();
    }
}

// Atualiza as estatísticas da ofensiva
function updateChallengeStats() {
    const totalHabits = this.habits ? this.habits.length : 0;
    const completedToday = completedHabitsToday.length;
    const currentStreak = 0; // Pega do seu sistema existente
    
    const streakEl = document.getElementById('challenge-streak');
    const completedEl = document.getElementById('challenge-completed');
    const totalEl = document.getElementById('challenge-total');
    
    if (streakEl) streakEl.textContent = currentStreak.toString();
    if (completedEl) completedEl.textContent = completedToday.toString();
    if (totalEl) totalEl.textContent = totalHabits.toString();
}

// Renderiza os hábitos na tela de ofensiva
function renderChallengeHabits() {
    const container = document.getElementById('challenge-habits');
    if (!container || !this.habits) return;
    
    container.innerHTML = this.habits.map((habit: any) => {
        const isCompleted = completedHabitsToday.includes(habit.id);
        const categoryIcon = this.getCategoryIcon ? this.getCategoryIcon(habit.category) : '⭐';
        
        return `
            <div class="habit-item ${isCompleted ? 'completed' : ''}" data-habit-id="${habit.id}">
                <div class="habit-content">
                    <div class="habit-info">
                        <div class="habit-icon ${habit.category}">${categoryIcon}</div>
                        <div class="habit-details">
                            <h3>${habit.name}</h3>
                            ${habit.description ? `<p>${habit.description}</p>` : ''}
                        </div>
                    </div>
                    <div class="habit-checkbox">
                        <button class="checkbox-btn ${isCompleted ? 'completed' : ''}" 
                                onclick="toggleChallengeHabit(${habit.id})" 
                                ${!challengeActive ? 'disabled' : ''}>
                            <span>${isCompleted ? '✓' : '○'}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Atualiza o círculo de progresso
function updateProgressCircle() {
    const totalHabits = this.habits ? this.habits.length : 0;
    const completedToday = completedHabitsToday.length;
    const percentage = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    
    const progressText = document.getElementById('progress-percentage');
    const progressCircle = document.getElementById('progress-circle');
    
    if (progressText) progressText.textContent = percentage + '%';
    
    if (progressCircle) {
        const circumference = 2 * Math.PI * 50;
        const offset = circumference - (percentage / 100 * circumference);
        progressCircle.style.strokeDasharray = `${circumference - offset} ${circumference}`;
    }
}

// Atualiza a data atual
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = today.toLocaleDateString('pt-BR', options);
    }
}

// Inicia a ofensiva
function startChallenge() {
    if (!this.habits || this.habits.length === 0) {
        alert('Crie pelo menos um hábito primeiro!');
        return;
    }
    
    challengeActive = true;
    
    const statusElement = document.getElementById('challenge-status');
    if (statusElement) {
        statusElement.className = 'challenge-status status-active';
        statusElement.innerHTML = `
            <h3>Ofensiva Ativa! 🔥</h3>
            <p>Marque cada hábito conforme você os completa hoje.</p>
            <button class="btn-primary" onclick="resetChallenge()">
                🔄 Resetar Dia
            </button>
        `;
    }
    
    // Habilita os checkboxes
    document.querySelectorAll('.checkbox-btn').forEach((btn: any) => {
        btn.disabled = false;
    });
}

// Toggle de hábito na ofensiva
function toggleChallengeHabit(habitId: number) {
    if (!challengeActive) return;
    
    const isCompleted = completedHabitsToday.includes(habitId);
    
    if (isCompleted) {
        completedHabitsToday = completedHabitsToday.filter(id => id !== habitId);
    } else {
        completedHabitsToday.push(habitId);
    }
    
    renderChallengeHabits();
    updateProgressCircle();
    updateChallengeStats();
    checkChallengeComplete();
}

// Verifica se completou todos os hábitos
function checkChallengeComplete() {
    const totalHabits = this.habits ? this.habits.length : 0;
    const completedToday = completedHabitsToday.length;
    
    if (completedToday === totalHabits && totalHabits > 0) {
        const statusElement = document.getElementById('challenge-status');
        if (statusElement) {
            statusElement.className = 'challenge-status status-complete';
            statusElement.innerHTML = `
                <h3>🔥 Ofensiva Mantida!</h3>
                <p>Parabéns! Você completou TODOS os hábitos hoje!</p>
                <p><strong>Continue assim para manter seu streak!</strong></p>
                <button class="btn-primary" onclick="finishDay()">
                    ✨ Finalizar Dia
                </button>
            `;
        }
    }
}

// Reseta a ofensiva do dia
function resetChallenge() {
    if (confirm('Tem certeza que deseja resetar o dia?')) {
        challengeActive = false;
        completedHabitsToday = [];
        
        const statusElement = document.getElementById('challenge-status');
        if (statusElement) {
            statusElement.className = 'challenge-status';
            statusElement.innerHTML = `
                <h3>Pronto para recomeçar?</h3>
                <p>Complete TODOS os hábitos para manter seu streak!</p>
                <button class="btn-primary" onclick="startChallenge()">
                    🚀 Iniciar Ofensiva
                </button>
            `;
        }
        
        renderChallengeHabits();
        updateProgressCircle();
        updateChallengeStats();
    }
}

// Finaliza o dia
function finishDay() {
    alert('Dia finalizado! Parabéns por manter a ofensiva! 🎉');
    // Aqui você salvaria no banco que completou o dia
    challengeActive = false;
}

// Torna as funções globais para os onclick
(window as any).switchToTab = switchToTab;
(window as any).startChallenge = startChallenge;
(window as any).toggleChallengeHabit = toggleChallengeHabit;
(window as any).resetChallenge = resetChallenge;
(window as any).finishDay = finishDay;

// Adicione essa chamada no seu método de atualização existente
// Para quando carregar ou atualizar hábitos, chame: updateChallengeTab();