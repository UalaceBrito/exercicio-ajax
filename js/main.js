import { CONFIG } from './config/constants.js';
import { HttpClient } from './core/HttpClient.js';
import { UserService } from './services/UserService.js';
import { UserListView } from './ui/UserListView.js';
import { UserFormView } from './ui/UserFormView.js';
import { ToastView } from './ui/ToastView.js';
import { logger } from './utils/logger.js';
import { HttpError } from './core/HttpError.js';

(() => {
  'use strict';

  // ---------- Wiring ----------
  const http     = new HttpClient();
  const service  = new UserService(http);
  const listView = new UserListView();
  const toast    = new ToastView();

  // ---------- Estado ----------
  let currentController = null;

  // ---------- Carga da lista ----------
  const carregarUsuarios = async () => {
    // Cancela requisição anterior
    currentController?.abort('Nova requisição disparada');
    const controller = new AbortController();
    currentController = controller;

    listView.setLoading();
    try {
      const usuarios = await service.list({ signal: controller.signal });
      if (currentController !== controller) return;
      listView.setData(usuarios);
      toast.info(`${usuarios.length} usuário(s) carregado(s).`);
    } catch (err) {
      if (err instanceof HttpError && err.isAborted) {
        logger.debug('Requisição cancelada pelo usuário.');
        return;
      }
      if (currentController !== controller) return;
      listView.setErro(err);
      toast.error(err instanceof Error ? err.message : 'Falha ao carregar usuários.');
    } finally {
      if (currentController === controller) currentController = null;
    }
  };

  // ---------- Criação ----------
  const formView = new UserFormView({
    onSubmit: async (data) => {
      try {
        const criado = await service.create(data);
        toast.success(`"${criado.name}" entrou na lista desta sessão. A API de demonstração não persiste cadastros.`);
        formView.reset();
        // Revalidação: força recarregar sem cache
        http.cache.clear();
        await carregarUsuarios();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Falha ao cadastrar usuário.');
        logger.error('Erro no POST /users', err);
      }
    },
  });

  // ---------- Controles de UI ----------
  document.getElementById('btn-refresh')?.addEventListener('click', carregarUsuarios);

  document.getElementById('toggle-adapter')?.addEventListener('change', (event) => {
    const toggle = event.currentTarget;
    const adapter = toggle.checked ? 'xhr' : 'fetch';
    try {
      http.setAdapter(adapter);
      http.cache.clear();          // invalida cache ao trocar de transporte
      toast.info(`Adaptador alterado para ${adapter.toUpperCase()}.`);
      carregarUsuarios();
    } catch (err) {
      toast.error(`Não foi possível trocar o adaptador: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
      toggle.checked = !toggle.checked;
    }
  });

  // Cancela requisições ao sair da página
  window.addEventListener('beforeunload', () => currentController?.abort('unload'));

  // ---------- Bootstrap ----------
  logger.info(`App iniciado · adaptador=${CONFIG.DEFAULT_ADAPTER} · api=${CONFIG.API_BASE_URL}`);
  carregarUsuarios();
})();