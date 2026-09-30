export class ToastView {
  constructor(rootId = 'toast-region', { duration = 4_000 } = {}) {
    this.root = document.getElementById(rootId);
    this.duration = duration;
  }

  #show(message, variant) {
    if (!this.root) return;
    const el = document.createElement('div');
    el.className = `toast toast--${variant}`;
    el.textContent = message;
    this.root.appendChild(el);
    setTimeout(() => el.remove(), this.duration);
  }

  success(msg) { this.#show(msg, 'success'); }
  error(msg)   { this.#show(msg, 'error'); }
  info(msg)    { this.#show(msg, 'info'); }
}