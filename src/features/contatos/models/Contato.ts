export interface Contato {
  id?: number;
  documentId?: string;
  departamento: string;
  colaboradores: string;
  ramal?: string | null;
  ddr?: string | null;
  email?: string | null;
}
