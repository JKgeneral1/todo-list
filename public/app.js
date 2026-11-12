'use strict';
(() => {
  const STORAGE_KEY = 'po-poryadku.tasks.v1';
  const form = document.querySelector('#task-form');
  const input = document.querySelector('#task-input');
  const list = document.querySelector('#tasks');
  const notice = document.querySelector('#notice');
  let tasks = [];
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(stored) || !stored.every(task => task && typeof task.id === 'string' && typeof task.text === 'string' && task.text.trim() && task.text.length <= 500 && typeof task.completed === 'boolean') || new Set(stored.map(task => task.id)).size !== stored.length) throw new Error('Invalid data');
    tasks = stored;
  } catch {
    notice.textContent = 'Не удалось прочитать сохранённые задачи. Можно начать новый список.';
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); notice.textContent = ''; }
    catch { notice.textContent = 'Хранилище недоступно. Изменения сохранятся только до обновления страницы.'; }
  }
  function render() {
    list.replaceChildren();
    for (const task of tasks) {
      const item = document.createElement('li');
      item.classList.toggle('completed', task.completed);
      const label = document.createElement('label');
      label.className = 'task-label';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        item.classList.toggle('completed', task.completed);
        persist(); updateSummary();
      });
      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;
      label.append(checkbox, text);
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'delete';
      remove.setAttribute('aria-label', `Удалить задачу: ${task.text}`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6m4-6v6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      remove.addEventListener('click', () => {
        const index = tasks.findIndex(value => value.id === task.id);
        tasks.splice(index, 1); persist(); render();
        const next = list.children[Math.min(index, tasks.length - 1)];
        (next?.querySelector('.delete') || input).focus();
      });
      item.append(label, remove); list.append(item);
    }
    updateSummary();
  }
  function updateSummary() {
    document.querySelector('#total').textContent = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    document.querySelector('#progress').textContent = tasks.length ? `Выполнено ${completed} из ${tasks.length}` : 'Начнём с малого';
    document.querySelector('#empty').hidden = tasks.length > 0;
    list.hidden = tasks.length === 0;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) { input.value = ''; input.focus(); return; }
    tasks.push({ id: crypto.randomUUID(), text, completed: false });
    persist(); render(); input.value = ''; input.focus();
  });
  render();
})();
