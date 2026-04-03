# InfraOS - Guia Completo de Implementação das 15 Melhorias

## 📋 Visão Geral

Este guia detalha como usar e integrar todas as 15 melhorias implementadas no projeto InfraOS v2.8.2-enhanced.

---

## 🎯 Melhorias Implementadas

### P0 - Críticas (Implementadas)

#### 1. Sistema de Notificações Global

**Arquivo:** `components/providers/notification-provider.tsx`

**Uso:**
```typescript
// Em layout.tsx
import { NotificationProvider } from '@/components/providers/notification-provider';

export default function RootLayout({ children }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
}

// Em componentes
import { useNotifications } from '@/components/providers/notification-provider';

export function MyComponent() {
  const { success, error, warning, info } = useNotifications();

  const handleSave = async () => {
    try {
      await saveData();
      success('Dados salvos com sucesso!', {
        action: { label: 'Desfazer', onClick: () => undo() }
      });
    } catch (err) {
      error('Erro ao salvar dados');
    }
  };

  return <button onClick={handleSave}>Salvar</button>;
}
```

**Tipos de Notificação:**
- `success()` - Sucesso (verde)
- `error()` - Erro (vermelho)
- `warning()` - Aviso (amarelo)
- `info()` - Informação (azul)

**Opções:**
- `title` - Título da notificação
- `duration` - Tempo de exibição em ms (padrão: 3000)
- `action` - Ação rápida com label e callback

---

#### 2. Confirmação de Ações Destrutivas

**Arquivo:** `components/shared/confirm-dialog.tsx`

**Uso:**
```typescript
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';

export function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { confirm, Dialog } = useConfirmDialog();

  const handleDelete = async () => {
    const confirmed = await confirm({
      type: 'danger',
      title: 'Deletar ordem?',
      description: 'Esta ação não pode ser desfeita',
      confirmText: 'Deletar',
      onConfirm: async () => {
        await deleteOrder();
      }
    });
  };

  return (
    <>
      <button onClick={handleDelete}>Deletar</button>
      {Dialog}
    </>
  );
}
```

**Tipos:**
- `danger` - Ação destrutiva (vermelho)
- `warning` - Aviso (amarelo)
- `info` - Informação (azul)

---

#### 3. Validação de Formulários

**Arquivo:** `lib/validators.ts`

**Uso:**
```typescript
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validate
} from '@/lib/validators';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const result = validateEmail(value);
    setEmailError(result.error || '');
  };

  return (
    <input
      value={email}
      onChange={(e) => handleEmailChange(e.target.value)}
      className={emailError ? 'border-red-500' : ''}
    />
  );
}
```

**Validadores Disponíveis:**
- `validateEmail()` - Valida email
- `validatePhone()` - Valida telefone
- `validatePassword()` - Valida senha (mín 6 chars, maiúscula, número)
- `validatePasswordMatch()` - Confirma senha
- `validateRequired()` - Campo obrigatório
- `validateMinLength()` - Comprimento mínimo
- `validateMaxLength()` - Comprimento máximo
- `validateNumber()` - Número
- `validateDate()` - Data
- `validateFutureDate()` - Data futura
- `validatePastDate()` - Data passada
- `validateURL()` - URL
- `validateCPF()` - CPF
- `validateCNPJ()` - CNPJ

---

#### 4. Estados de Loading e Skeleton

**Arquivo:** `components/shared/loading-components.tsx`

**Uso:**
```typescript
import {
  LoadingOverlay,
  SkeletonLoader,
  SkeletonCard,
  SkeletonTable,
  LoadingSpinner,
  ProgressBar
} from '@/components/shared/loading-components';

export function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <>
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoading} message="Processando..." />

      {/* Skeleton Loaders */}
      {isLoading ? (
        <>
          <SkeletonLoader count={3} variant="card" />
          <SkeletonTable rows={5} columns={6} />
        </>
      ) : (
        <div>Conteúdo carregado</div>
      )}

      {/* Progress Bar */}
      <ProgressBar progress={progress} />

      {/* Loading Spinner */}
      <LoadingSpinner size="lg" />
    </>
  );
}
```

**Variantes:**
- `default` - Linha padrão
- `card` - Card skeleton
- `table` - Tabela skeleton
- `avatar` - Avatar circular

---

#### 5. Error Boundary

**Arquivo:** `components/shared/error-boundary.tsx`

**Uso:**
```typescript
import { ErrorBoundary } from '@/components/shared/error-boundary';

export default function RootLayout({ children }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Error caught:', error);
        // Enviar para Sentry, LogRocket, etc
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

### P1 - Altas (Implementadas)

#### 6. Busca Global e Command Palette

**Arquivo:** `components/shared/command-palette.tsx`

**Uso:**
```typescript
import { CommandPalette, useCommandPalette } from '@/components/shared/command-palette';

export function App() {
  const { isOpen, setIsOpen } = useCommandPalette();

  const commands = [
    {
      id: 'new-order',
      label: 'Nova O.S.',
      description: 'Criar nova ordem de serviço',
      category: 'Ordens',
      href: '/orders/new',
      shortcut: 'Cmd+N'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Ir para dashboard',
      href: '/dashboard',
      shortcut: 'Cmd+D'
    },
  ];

  return (
    <CommandPalette
      commands={commands}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    />
  );
}
```

**Atalhos:**
- `Cmd+K` ou `Ctrl+K` - Abrir/fechar
- `↑↓` - Navegar
- `Enter` - Selecionar
- `Esc` - Fechar

---

#### 7. Tabelas Avançadas

**Arquivo:** `components/shared/advanced-table.tsx`

**Uso:**
```typescript
import { AdvancedTable, Column } from '@/components/shared/advanced-table';

export function OrdersTable() {
  const columns: Column<Order>[] = [
    {
      id: 'number',
      label: 'O.S.',
      accessor: (row) => row.number,
      sortable: true,
    },
    {
      id: 'client',
      label: 'Cliente',
      accessor: (row) => row.clientName,
      sortable: true,
      filterable: true,
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <AdvancedTable
      data={orders}
      columns={columns}
      selectable
      sortable
      onRowClick={(row) => navigate(`/orders/${row.id}`)}
      onDelete={(row) => deleteOrder(row.id)}
      onExport={(data) => exportToExcel(data)}
    />
  );
}
```

**Recursos:**
- Sorting por coluna (clicável)
- Seleção múltipla
- Bulk actions
- Export de dados
- Alternância de cores de linha

---

#### 8. Date Picker

**Arquivo:** `components/shared/date-picker.tsx`

**Uso:**
```typescript
import { DatePicker, DateRangePicker } from '@/components/shared/date-picker';

export function FilterForm() {
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <>
      <DatePicker
        label="Data da O.S."
        value={date}
        onChange={setDate}
        minDate={new Date()}
      />

      <DateRangePicker
        label="Período"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />
    </>
  );
}
```

**Recursos:**
- Calendar visual
- Validação de data (min/max)
- Range picker
- Navegação por mês

---

#### 9. Export Button

**Arquivo:** `components/shared/export-button.tsx`

**Uso:**
```typescript
import { ExportButton } from '@/components/shared/export-button';

export function OrdersList() {
  return (
    <ExportButton
      data={orders}
      filename="ordens"
      formats={['excel', 'csv', 'json']}
      columns={['number', 'client', 'status', 'deadline']}
    />
  );
}
```

**Formatos:**
- Excel (.xlsx)
- CSV (.csv)
- JSON (.json)

---

#### 10. Breadcrumbs

**Arquivo:** `components/shared/breadcrumbs.tsx`

**Uso:**
```typescript
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export function OrderDetail() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Ordens', href: '/orders' },
        { label: '#123', href: '/orders?selected=123' },
      ]}
      showHome
    />
  );
}
```

---

## 🔧 Integração Passo a Passo

### 1. Adicionar NotificationProvider ao Layout

```typescript
// app/layout.tsx
import { NotificationProvider } from '@/components/providers/notification-provider';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 2. Usar em Componentes

```typescript
// components/orders/create-order-form.tsx
import { useNotifications } from '@/components/providers/notification-provider';
import { useConfirmDialog } from '@/components/shared/confirm-dialog';
import { validateRequired, validateEmail } from '@/lib/validators';
import { DatePicker } from '@/components/shared/date-picker';
import { LoadingOverlay } from '@/components/shared/loading-components';

export function CreateOrderForm() {
  const { success, error } = useNotifications();
  const { confirm, Dialog } = useConfirmDialog();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar
    const clientError = validateRequired(formData.client, 'Cliente');
    if (!clientError.isValid) {
      setErrors({ client: clientError.error });
      return;
    }

    // Confirmar
    const confirmed = await confirm({
      type: 'info',
      title: 'Criar nova O.S.?',
      description: 'Verifique os dados antes de confirmar',
      confirmText: 'Criar',
    });

    if (!confirmed) return;

    // Salvar
    setIsLoading(true);
    try {
      await createOrder(formData);
      success('Ordem criada com sucesso!');
    } catch (err) {
      error('Erro ao criar ordem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay isVisible={isLoading} message="Criando ordem..." />
      <form onSubmit={handleSubmit} className="space-y-4">
        <DatePicker
          label="Data da O.S."
          value={formData.date}
          onChange={(date) => setFormData({ ...formData, date })}
          minDate={new Date()}
          error={errors.date}
        />
        <button type="submit" disabled={isLoading}>
          Criar
        </button>
      </form>
      {Dialog}
    </>
  );
}
```

---

## 📊 Checklist de Implementação

- [ ] Adicionar `NotificationProvider` ao layout
- [ ] Adicionar `ErrorBoundary` ao layout
- [ ] Usar `useNotifications()` em ações
- [ ] Usar `ConfirmDialog` em ações destrutivas
- [ ] Usar validadores em formulários
- [ ] Usar `SkeletonLoader` em carregamentos
- [ ] Usar `CommandPalette` na navegação
- [ ] Usar `AdvancedTable` em listagens
- [ ] Usar `DatePicker` em formulários
- [ ] Usar `ExportButton` em tabelas
- [ ] Usar `Breadcrumbs` em páginas de detalhe

---

## 🎨 Customização

### Cores de Notificações

Edite `components/providers/notification-provider.tsx`:

```typescript
const typeClasses = {
  success: "bg-success/10 border-success/30 text-success",
  error: "bg-danger/10 border-danger/30 text-danger",
  warning: "bg-warning/10 border-warning/30 text-warning",
  info: "bg-info/10 border-info/30 text-info",
};
```

### Duração de Notificações

```typescript
success('Mensagem', { duration: 5000 }); // 5 segundos
```

### Validadores Customizados

```typescript
// lib/validators.ts
export function validateCustom(value: string): ValidationResult {
  if (value.length < 10) {
    return { isValid: false, error: 'Mínimo 10 caracteres' };
  }
  return { isValid: true };
}
```

---

## 🚀 Próximas Melhorias (P2)

- [ ] Gráficos com Recharts
- [ ] Modo offline com Service Worker
- [ ] Atalhos de teclado customizáveis
- [ ] Temas customizáveis
- [ ] Documentação interativa

---

## 📚 Referências

- `components/providers/notification-provider.tsx` - Notificações
- `components/shared/confirm-dialog.tsx` - Confirmações
- `lib/validators.ts` - Validadores
- `components/shared/loading-components.tsx` - Loading
- `components/shared/error-boundary.tsx` - Error handling
- `components/shared/command-palette.tsx` - Busca
- `components/shared/advanced-table.tsx` - Tabelas
- `components/shared/date-picker.tsx` - Datas
- `components/shared/export-button.tsx` - Export
- `components/shared/breadcrumbs.tsx` - Navegação

