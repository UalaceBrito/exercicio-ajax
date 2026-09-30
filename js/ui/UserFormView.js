export class UserFormView {
  constructor({ onSubmit }) {
    this.form = document.getElementById('form-usuario');
    this.submitBtn = document.getElementById('btn-submit');
    this.onSubmit = onSubmit;
    this.form.addEventListener('submit', this.#handle);
    this.form.addEventListener('input', this.#clearError);
  }

  #clearError = (e) => {
    const field = e.target.closest('.field');
    field?.classList.remove('field--invalid');
    field?.querySelector('input')?.removeAttribute('aria-invalid');
    field?.querySelector('.field__error')?.replaceChildren();
  };

  #setFieldError(name, msg) {
    const input = this.form.querySelector(`[name="${name}"]`);
    const wrapper = input?.closest('.field');
    wrapper?.classList.add('field--invalid');
    input?.setAttribute('aria-invalid', 'true');
    const slot = wrapper?.querySelector(`[data-error-for="${name}"]`);
    if (slot) slot.textContent = msg;
  }

  #validate(data) {
    const errors = {};
    if (!data.name || data.name.trim().length < 3) errors.name = 'Informe ao menos 3 caracteres.';
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'E-mail inválido.';
    return errors;
  }

  setLoading(loading) {
    this.submitBtn.disabled = loading;
    this.submitBtn.textContent = loading ? 'Enviando…' : 'Cadastrar';
  }

  reset() { this.form.reset(); }

  #handle = async (e) => {
    e.preventDefault();
    const fd = new FormData(this.form);
    const data = Object.fromEntries(fd.entries());

    const errors = this.#validate(data);
    Object.keys(errors).forEach((k) => this.#setFieldError(k, errors[k]));
    if (Object.keys(errors).length) return;

    this.setLoading(true);
    try {
      await this.onSubmit(data);
    } finally {
      this.setLoading(false);
    }
  };
}