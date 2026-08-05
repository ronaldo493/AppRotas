export interface UsuarioAdministravel {
  id: number;
  username: string;
  setor: string;
  cargo: string;
  bloqueado: boolean;
  deveAlterarSenha: boolean;
}

export interface PaginaUsuariosAdministrativos {
  escopo: {
    abrangencia: 'todos_setores' | 'proprio_setor';
    setor: string | null;
  };
  usuarios: UsuarioAdministravel[];
  paginacao: {
    pagina: number;
    tamanhoPagina: number;
    total: number;
    totalPaginas: number;
  };
}
