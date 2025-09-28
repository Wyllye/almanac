import './style.css';

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
  /**
   * Contador de dias consecutivos em que todos os hábitos foram concluídos.
   */
  private streakCount: number = 0;
  /**
   * Data da última atualização de streak no formato AAAA-MM-DD.
   */
  private lastUpdateDate: string = '';
  /**
   * Marca se, no dia atual, todos os hábitos já foram concluídos (impede incrementar mais de uma vez por dia).
   */
  private didCompleteAllToday: boolean = false;

  constructor() {
    // Carregar streak antes de inicializar a aplicação
    this.loadStreak();
    this.init();
  }

  /**
   * Carrega o contador de sequência (streak) da localStorage e aplica as regras de reinício.
   * Se o dia mudou em relação à última atualização armazenada, verifica se a sequência pode ser
   * mantida (apenas se ontem todos os hábitos foram concluídos). Caso contrário, reseta para 0.
   */
  private loadStreak(): void {
    const today = new Date().toISOString().slice(0, 10);
    const dataStr = localStorage.getItem('almanacStreak');
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        this.streakCount = data.streakCount ?? 0;
        this.lastUpdateDate = data.lastUpdateDate ?? today;
        this.didCompleteAllToday = data.didCompleteAll ?? false;
        // Se a data mudou, decidimos manter ou resetar a sequência
        if (this.lastUpdateDate !== today) {
          const lastDate = new Date(this.lastUpdateDate);
          const currDate = new Date(today);
          const diffTime = currDate.getTime() - lastDate.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          // Se ontem foi concluído e estamos exatamente no dia seguinte, mantemos streak
          if (!(diffDays === 1 && this.didCompleteAllToday)) {
            this.streakCount = 0;
          }
          // Reiniciar indicadores diários para o novo dia
          this.lastUpdateDate = today;
          this.didCompleteAllToday = false;
          this.saveStreak();
        }
      } catch (e) {
        // Se algum erro ocorrer ao ler/parsing, iniciamos valores padrão
        this.streakCount = 0;
        this.lastUpdateDate = today;
        this.didCompleteAllToday = false;
        this.saveStreak();
      }
    } else {
      // Primeiro uso: inicializar com padrão
      this.streakCount = 0;
      this.lastUpdateDate = today;
      this.didCompleteAllToday = false;
      this.saveStreak();
    }
  }

  /**
   * Persiste o contador de sequência (streak) e informações do dia na localStorage.
   */
  private saveStreak(): void {
    const data = {
      streakCount: this.streakCount,
      lastUpdateDate: this.lastUpdateDate,
      didCompleteAll: this.didCompleteAllToday,
    };
    localStorage.setItem('almanacStreak', JSON.stringify(data));
  }

  /**
   * Verifica se todos os hábitos do dia estão concluídos. Caso estejam e ainda não
   * tenham sido concluídos neste dia (impedindo incremento múltiplo), incrementa
   * a sequência (streak) em 1, marca a flag diária e salva os dados.
   */
  private checkForStreakUpdate(): void {
    const totalHabits = this.habits.length;
    const completed = this.habits.filter(h => h.completedToday).length;
    if (totalHabits > 0 && completed === totalHabits && !this.didCompleteAllToday) {
      this.streakCount += 1;
      this.didCompleteAllToday = true;
      this.saveStreak();
      // Atualiza o UI
      const streakEl = document.getElementById('current-streak');
      if (streakEl) streakEl.textContent = this.streakCount.toString();
      const statsStreakEl = document.getElementById('stats-streak');
      if (statsStreakEl) statsStreakEl.textContent = this.streakCount.toString();
    }
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
    // Usa o contador de sequência carregado da localStorage
    const currentStreak = this.streakCount;
    
    // Update dashboard stats
    const totalEl = document.getElementById('total-habits');
    const completedEl = document.getElementById('completed-today');
    const streakEl = document.getElementById('current-streak');
    
    if (totalEl) totalEl.textContent = totalHabits.toString();
    if (completedEl) completedEl.textContent = completedToday.toString();
    if (streakEl) streakEl.textContent = currentStreak.toString();
    
    // Toggle flame lit state when all habits are completed
    const flameIcon = document.getElementById('streak-flame');
    if (flameIcon) {
      if (totalHabits > 0 && completedToday === totalHabits) {
        flameIcon.classList.add('lit');
      } else {
        flameIcon.classList.remove('lit');
      }
    }
  }

  private updateStatistics(): void {
    const totalHabits = this.habits.length;
    // Utiliza o contador de streak persistido para exibir na aba de estatísticas
    const currentStreak = this.streakCount;
    const achievements = Math.floor(this.habits.filter(h => h.completedToday).length / 2);
    
    // Update statistics tab
    const statsTotalEl = document.getElementById('stats-total');
    const statsStreakEl = document.getElementById('stats-streak');
    const statsAchievementsEl = document.getElementById('stats-achievements');
    
    if (statsTotalEl) statsTotalEl.textContent = totalHabits.toString();
    if (statsStreakEl) statsStreakEl.textContent = currentStreak.toString();
    if (statsAchievementsEl) statsAchievementsEl.textContent = achievements.toString();
    
    // Render summary of all habits
    const summaryContainer = document.getElementById('stats-summary');
    if (summaryContainer) {
      if (this.habits.length === 0) {
        summaryContainer.innerHTML = '<p>Você ainda não criou nenhum hábito.</p>';
      } else {
        summaryContainer.innerHTML = this.habits.map(h => `
          <div class="stats-summary-item">
            <div>
              <div class="name">${this.escapeHtml(h.name)}</div>
              <div class="category">${this.getCategoryLabel(h.category)}</div>
            </div>
            <div class="status ${h.completedToday ? 'completed' : 'pending'}">
              ${h.completedToday ? 'Concluído' : 'Pendente'}
            </div>
          </div>
        `).join('');
      }
    }
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
      (card as HTMLElement).classList.add('success-animation');
      setTimeout(() => (card as HTMLElement).classList.remove('success-animation'), 600);
    }
    
    this.renderHabits();
    // Atualiza números gerais e chama verificação de streak
    this.updateStats();
    this.checkForStreakUpdate();
    // Atualiza a aba de estatísticas incluindo o resumo e o valor da streak
    this.updateStatistics();
    
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

  /**
   * Retorna um rótulo legível para a categoria fornecida.
   */
  private getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      saude: 'Saúde',
      exercicio: 'Exercício',
      estudo: 'Estudo',
      trabalho: 'Trabalho',
      lazer: 'Lazer',
      outros: 'Outros'
    };
    return labels[category] || category;
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