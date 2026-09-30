import { logger } from '../utils/logger.js';

const ESTADOS = ['idle', 'loading', 'erro', 'vazio', 'lista'];

export class UserListView {
  constructor() {
    this.els = {
      idle:     document.getElementById('estado-idle'),
      loading:  document.getElementById('estado-loading'),
      erro:     document.getElementById('estado-erro'),
      vazio:    document.getElementById('estado-vazio'),
      lista:    document.getElementById('lista-usuarios'),
      busca:    document.getElementById('input-busca'),
    };
    this._usuarios = [];
    this._filtro = '';
    this.els.busca?.addEventListener('input', (e) => {
      this._filtro = e.target.value.trim().toLowerCase();
      this.#renderLista();
    });
  }

  #setEstado(nome) {
    ESTADOS.forEach((k) => this.els[k]?.classList.toggle('hidden', k !== nome));
  }

  setLoading() { this.#setEstado('loading'); }

  setIdle() { this.#setEstado('idle'); }

  setErro(error) {
    const box = this.els.erro;
    if (!box) return;
    box.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = `Erro ${error.status || ''} — `;
    box.appendChild(title);
    box.appendChild(document.createTextNode(error.message || 'Falha desconhecida'));

    if (error.payload || error.timestamp) {
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(error.toJSON?.() ?? {}, null, 2);
      box.appendChild(pre);
    }
    this.#setEstado('erro');
  }

  setData(usuarios) {
    this._usuarios = usuarios;
    this.#renderLista();
  }

  #renderLista() {
    const lista = this.els.lista;
    lista.innerHTML = '';

    const filtrados = this._filtro
      ? this._usuarios.filter((u) =>
          u.name?.toLowerCase().includes(this._filtro) ||
          u.email?.toLowerCase().includes(this._filtro))
      : this._usuarios;

    if (!filtrados.length) { this.#setEstado(this._usuarios.length ? 'vazio' : 'vazio'); return; }

    const frag = document.createDocumentFragment();
    for (const u of filtrados) {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = u.name ?? '(sem nome)';
      const email = document.createElement('span');
      email.textContent = u.email ?? '';
      const empresa = document.createElement('span');
      empresa.textContent = u.company?.name ?? '';
      li.append(strong, email, empresa);
      frag.appendChild(li);
    }
    lista.appendChild(frag);
    this.#setEstado('lista');
  }
}