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
- Cadastro assíncrono com validação de formulário e atualização da lista
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
os dados. Portanto, usuários enviados pelo formulário não serão mantidos em recargas ou
consultas posteriores.

## Publicar a entrega no GitHub

Depois de configurar o endereço do repositório fornecido para a atividade:

```bash
git switch -c exercicio_ajax
git add .
git commit -m "Implementa exercício AJAX robusto"
git push -u origin exercicio_ajax
```

Envie o link do repositório na plataforma após confirmar que a branch `exercicio_ajax` está
publicada.