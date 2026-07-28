export const AUDIT_LOG_ACTION = {
  ATUALIZACAO_EMAIL: 'ATUALIZACAO_EMAIL',
  ALTERACAO_SENHA: 'ALTERACAO_SENHA',
} as const;

export type AuditLogAction =
  (typeof AUDIT_LOG_ACTION)[keyof typeof AUDIT_LOG_ACTION];

export interface NewAuditLog {
  acao: AuditLogAction;
  entidade: 'USUARIO';
  entidadeId: string;
  username: string;
  setor: string;
  origem: 'APP_MOBILE';
}
