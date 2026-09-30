import { HttpError } from '../core/HttpError.js';

/**
 * Serviço de domínio — encapsula endpoints e regras de negócio.
 * Não conhece DOM nem localStorage.
 */
export class UserService {
  constructor(http) { this.http = http; }

  async list({ signal } = {}) {
    const { data } = await this.http.get('/users', {
      signal,
      cacheTtl: 30_000,
      query: { _limit: 20 },
    });
    if (!Array.isArray(data)) {
      throw new HttpError('A API retornou uma lista de usuários inválida', {
        status: 502, method: 'GET', url: '/users', payload: data,
      });
    }
    return data;
  }

  async create({ name, email, company }) {
    const { data } = await this.http.post('/users', {
      name: name.trim(),
      email: email.trim(),
      company: { name: company.trim() },
    });
    if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.name !== 'string') {
      throw new HttpError('A API retornou um usuário inválido', {
        status: 502, method: 'POST', url: '/users', payload: data,
      });
    }
    return data;
  }
}