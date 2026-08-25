Você é um desenvolvedor sênior full-stack especializado em React JS e Supabase. Preciso que você crie a estrutura completa de um sistema web (ERP) para gestão do Programa Nacional de Alimentação Escolar (PNAE), conforme a Lei nº 11.947/2009.

### REQUISITOS TÉCNICOS

**Front-end:**
- React JS com Vite (última versão)
- TypeScript
- React Router DOM para navegação
- React Hook Form + Zod para validação de formulários
- Tailwind CSS + Shadcn/ui para interface
- Context API ou Zustand para gerenciamento de estado
- React Query (TanStack Query) para gerenciamento de requisições e cache
- Biblioteca para gráficos/dashboards: Recharts
- Biblioteca para tabelas: TanStack React Table

**Autenticação:**
- Login com e-mail/senha (Supabase Auth)
- Três perfis de acesso:
  1. ADMIN (Gestor Municipal/Estadual)
  2. NUTRICIONISTA
  3. ESCOLA (Diretor/Responsável pela merenda)
  4. FORNECEDOR (Agricultor Familiar)
  5. CAE (Conselho de Alimentação Escolar - apenas visualização)


### FUNCIONALIDADES POR PERFIL

**ADMIN (Gestor)**
- Dashboard com KPIs: total de alunos, total gasto, % agricultura familiar, entregas pendentes
- Gerenciar cadastro de municípios, escolas e usuários
- Visualizar e aprovar prestações de contas
- Relatórios: execução financeira, comparativo de gastos, lista de fornecedores

**NUTRICIONISTA**
- Elaborar cardápios semanais/mensais
- Gerar projeção automática de compras com base no cardápio e número de alunos
- Cadastrar/alimentar o catálogo de alimentos
- Acompanhar recebimento e qualidade dos alimentos

**ESCOLA (Diretor)**
- Visualizar cardápios programados
- Acompanhar entregas programadas
- Registrar recebimento de mercadorias (conferência de AF)
- Dashboard com consumos e estoque da escola

**FORNECEDOR (Agricultor Familiar)**
- Cadastrar projetos de venda com produtos, preços e quantidades
- Acompanhar chamadas públicas abertas
- Visualizar contratos e AF emitidas
- Registrar entregas realizadas

**CAE (Conselho)**
- Dashboard de acompanhamento: visualizar todo o processo
- Verificar compras, entregas e gastos
- Emitir parecer sobre prestações de contas

---

### REQUISITOS FUNCIONAIS OBRIGATÓRIOS

1. **Autenticação e Autorização**
   - Login com e-mail/senha
   - Redirecionamento por perfil após login
   - Proteção de rotas (não acessar páginas sem permissão)
   - Recuperação de senha

2. **Validações de Negócio**
   - Garantir que o percentual mínimo de 30% (ou 45%) seja direcionado à agricultura familiar
   - Validar limite de venda do agricultor familiar (R$ 40.000/ano)
   - Impedir entregas sem AF válida
   - Evitar duplicidade de CPF/CNPJ

3. **Relatórios**
   - Relatório de execução financeira (gasto x recebido)
   - Relatório de percentual de compra da agricultura familiar
   - Relatório de entregas por escola
   - Relatório de cardápios executados

4. **Notificações**
   - Alertas de entregas pendentes
   - Alertas de contratos próximos do vencimento
   - Notificações de novas chamadas públicas (para fornecedores)

5. **Dashboard Geral**
   - Cards com indicadores principais
   - Gráficos de evolução de gastos
   - Tabela de últimas entregas
   - Alertas e notificações no topo

---

### ENTREGÁVEIS ESPERADOS

1. **Estrutura de projeto React** completa com pastas organizadas:

2. **Arquivo de migração SQL** com todas as tabelas e políticas RLS para o Supabase

3. **Funções e triggers** no Supabase para:
- Calcular percentual de gasto com agricultura familiar automaticamente
- Atualizar estoques após entregas
- Gerar logs de auditoria

4. **Páginas funcionais** para:
- Login e recuperação de senha
- Dashboard do ADMIN com gráficos
- Cadastro de cardápio com visualização semanal
- Cadastro de chamada pública (ADMIN/NUTRICIONISTA)
- Página de submissão de proposta (FORNECEDOR)
- Página de registro de entrega (ESCOLA)
- Prestação de contas com geração de PDF

5. **Boas práticas:**
- Código limpo e comentado
- Tratamento de erros robusto
- Loading states e skeletons
- Responsividade (mobile first)
- Acessibilidade (WCAG básico)

---

### INSTRUÇÕES FINAIS

Gere o código fonte completo da aplicação, começando pela configuração inicial (criação do projeto Vite + instalação de dependências) até a implementação completa de todas as telas e funcionalidades. Forneça também o script SQL para criação do banco de dados no Supabase.

Priorize a entrega de:
1. Configuração do projeto
2. Tela de login e autenticação
3. Dashboard do ADMIN
4. Módulo de cardápio (Nutricionista)
5. Módulo de chamada pública (Gestor)
6. Módulo de entrega (Escola)
7. Relatórios básicos

Documente cada etapa com explicações claras do que está sendo feito e como testar cada funcionalidade.
