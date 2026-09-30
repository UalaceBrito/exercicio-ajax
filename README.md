# Exercício AJAX — clientes HTTP robustos

Demonstração didática de integração de uma interface com uma API usando requisições
assíncronas. Os dados da lista são carregados por `GET` e o formulário envia usuários por
`POST`, sem recarregar a página. O projeto permite alternar entre **Fetch API** e
**XMLHttpRequest** e apresenta tratamento de falhas, cancelamento e estados acessíveis.

## Stack
- JavaScript moderno com ES Modules, sem framework de interface
- Fetch API e XMLHttpRequest por meio de adaptadores intercambiáveis
- Node.js 20+ e test runner nativo para testes automatizados
- Sem dependências de produção ou de desenvolvimento

## Recursos
- Carregamento de usuários por AJAX assim que a página abre e pelo botão **Atualizar**
- Cadastro assíncrono com validação, busca imediata na lista durante a sessão e aviso explícito de persistência
- Alternância entre Fetch e XHR pela interface
- Timeout, cancelamento, retry exponencial com jitter e cache GET com TTL
- Erros HTTP tipados e validação das respostas recebidas da API
- Estados de carregamento, erro e lista vazia; filtro local e notificações não bloqueantes
- Testes automatizados das camadas HTTP e do serviço de usuários

## Como rodar

Requer Node.js 20+ para executar os testes. Para servir a aplicação localmente:

```bash
npm test
npm run check
python -m http.server 8080
```

Abra `http://localhost:8080`. Não use `file://`: os módulos JavaScript precisam ser servidos
por HTTP. A aplicação precisa de acesso à internet para consultar a API.

## API e persistência

O exercício usa [JSONPlaceholder](https://jsonplaceholder.typicode.com), endpoint `/users`.
É uma API pública de demonstração: o `POST` retorna uma resposta simulada, mas não persiste
os dados. Para que a demonstração continue coerente após o `POST` e durante atualizações da
lista na mesma sessão, o serviço mantém os novos registros em memória. A interface informa
que eles são temporários; ao recarregar a página, a API não os devolverá.

## Entrega no GitHub

O exercício está publicado na branch `exercicio_ajax`. Para obter uma cópia dessa branch:

```bash
git clone --branch exercicio_ajax https://github.com/UalaceBrito/exercicio-ajax.git
```

Envie o link do repositório pela plataforma da atividade.