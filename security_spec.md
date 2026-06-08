# Especificação de Segurança dos Dados - Crianças à Boleia

Este documento estabelece as regras e restrições de controlo de acessos (Attribute-Based Access Control) assegurando privacidade e integridade máxima na gestão dos dados familiares da aplicação "Crianças à Boleia".

## 1. Invariantes do Sistema de Dados

1. **Vínculo Familiar Inviolável**: Uma criança (`Child`) só pode ser criada por um utilizador autenticado cujo `userId` corresponda exatamente ao seu próprio UID (`request.auth.uid`). O pai/mãe só pode alterar os dados dos seus próprios filhos.
2. **Propriedade da Atividade**: Uma atividade (`Activity`) só pode ser associada a uma criança do próprio utilizador que a adiciona.
3. **Restrição de Pedidos de Boleia**: Um pedido de boleia (`RideRequest`) só pode ser criado pelo pai/mãe da criança associada. O estado inicial de qualquer boleia tem de ser obrigatoriamente `Pendente` ou então o seu formulário de criação tem de ser estritamente validado.
4. **Estados Finitos e Regras Transicionais**: 
   - Apenas o criador pode mudar o estado para `Cancelado`.
   - Apenas qualquer outro pai/mãe autenticado (não o criador) pode mudar o estado de `Pendente` para `Aceite` preenchendo o campo `acceptedBy` com o seu próprio UID.
   - Qualquer pedido com estado `Concluído` ou `Cancelado` fica congelado e bloqueado de quaisquer futuras alterações (Terminal State Locking).
5. **Autoproteção de Perfil (PII)**: O utilizador só pode ler e escrever no seu próprio documento de perfil em `/users/{userId}`. Não é permitido ler a totalidade do catálogo ou detalhes privados de outros pais a menos que façam parte do mesmo grupo (a ler por associações seguras ou listagem direta baseada em dados reais).

---

## 2. As "Doze Pragas" (The Dirty Dozen Malicious Payloads)

Iremos demonstrar 12 tentativas de ataque que os nossos controlos de segurança em `firestore.rules` e nas validações do sistema devem bloquear (PERMISSION_DENIED):

### Praga 1: Criação de Criança Alheia (Privilege Escalation)
Tentativa de registar uma criança para a conta de outro utilizador.
```json
{
  "id": "criança-1",
  "userId": "outroid-vitima",
  "nome": "Joãozinho",
  "dataNascimento": "2018-05-10"
}
```

### Praga 2: Atribuição de Criança na Atividade de Outro Pai
Registrar uma atividade para uma criança que não pertence ao próprio criador.
```json
{
  "id": "atividade-1",
  "childId": "criança-alheia-id",
  "nome": "Futebol",
  "local": "Estádio Municipal",
  "diaSemana": "Segunda-feira",
  "hora": "18:00"
}
```

### Praga 3: Pedido de Boleia por Conta de Terceiros
Criar um pedido de boleia associando-se como proprietário mas indicando o UID alheio.
```json
{
  "id": "boleia-1",
  "userId": "outro-utilizador-infiltrado",
  "childId": "minha-crianca-id",
  "activityId": "atividade-id",
  "data": "2026-06-10",
  "hora": "17:30",
  "estado": "Pendente",
  "createdAt": "2026-06-06T17:43:00Z"
}
```

### Praga 4: Autoconsumo de Boleia (Self-Acceptance)
O criador da boleia tenta aceitar o seu próprio pedido de boleia para reclamar ou burlar o estado.
```json
{
  "id": "boleia-1",
  "userId": "meu-uid",
  "childId": "minha-crianca-id",
  "activityId": "atividade-id",
  "data": "2026-06-10",
  "hora": "17:30",
  "estado": "Aceite",
  "acceptedBy": "meu-uid",
  "createdAt": "2026-06-06T17:43:00Z"
}
```

### Praga 5: Furto de Boleia Já Aceite por Outro
Um utilizador terceiro tenta reescrever o campo `acceptedBy` de uma boleia que já tinha sido aceite por outro pai.
```json
{
  "$oldDoc": { "acceptedBy": "pai-ajudante-a", "estado": "Aceite" },
  "$newDoc": { "acceptedBy": "pai-malicioso-b", "estado": "Aceite" }
}
```

### Praga 6: Alteração Após Estado Terminal (Terminal State Locking)
Tentar reverter ou editar os detalhes de uma boleia marcada como `Concluído` ou `Cancelado`.
```json
{
  "$oldDoc": { "estado": "Concluído", "acceptedBy": "pai-a" },
  "$newDoc": { "estado": "Pendente", "acceptedBy": "" }
}
```

### Praga 7: Injeção de Campos Fantasma (Shadow Update / Value Poisoning)
Adicionar campos administrativos de validação ou privilégios inexistentes num registo de utilizador.
```json
{
  "id": "meu-uid",
  "nome": "Utilizador Malicioso",
  "email": "malicious@gmail.com",
  "telefone": "912345678",
  "isAdmin": true,
  "systemBypassRole": "godMode"
}
```

### Praga 8: Modificação Direta do Histórico de Notificações Alheias
Tentar apagar ou marcar como lida uma notificação que pertence a outra família.
```json
{
  "id": "notif-vitima",
  "userId": "outro-utilizador-id",
  "titulo": "Nova Boleia",
  "mensagem": "Boleia aceite",
  "lida": true
}
```

### Praga 9: Envio de Dados Malformados (Denial of Wallet - ID longo de 1MB)
Registar uma atividade com string de ID gigante ou observação de 1MB de caracteres aleatórios no intuito de esgotar o armazenamento e estourar largura de banda.
```json
{
  "id": "gigante-id-com-mais-de-1000-caracteres...",
  "childId": "crianca-id",
  "nome": "F"
}
```

### Praga 10: Falsificação de Carimbo de Data/Hora (Temporal Fraud)
Falsificar a data de criação `createdAt` na solicitação da boleia com datas futuras arbitrárias ou datas passadas em vez de usar `request.time` de servidor.
```json
{
  "id": "boleia-1",
  "userId": "meu-uid",
  "createdAt": "2099-12-31T23:59:59Z"
}
```

### Praga 11: Modificação Imutável de Parentesco
Tentar atualizar uma criança alterando o `userId` original para transferir a responsabilidade para outro sem autorização.
```json
{
  "$oldDoc": { "userId": "pai-legitimo-original" },
  "$newDoc": { "userId": "pai-fraudulento" }
}
```

### Praga 12: Consulta Indevida a Perfis Inteiros (Blanket Reading / Scraping Attack)
Tentar ler a coleção `/users` de forma livre e irrestrita sem restrição de herança ou pertença familiar.
```javascript
// Operação maliciosa:
getDocs(collection(db, "users")) // Deverá ser rejeitada pelas regras de lista se não houver restrições de igualdade ID.
```

---

## 3. Test Runner (Mock Tests / Declarations)

Para validar estas "Doze Pragas", usamos asserções automáticas nas regras de autenticação e no motor de base de dados para garantir reações instantâneas de barramento.
