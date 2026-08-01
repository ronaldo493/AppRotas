import {useCallback} from 'react';

import useChamados from '../../chamados/hooks/useChamados';
import type {AssistenteHandlerDependencies} from './assistenteHandlerTypes';

type Params = Pick<
  AssistenteHandlerDependencies,
  'responder' | 'temAcesso' | 'informarAcessoNegado'
>;

/** Resume chamados sem expor o estado da tela ao restante da assistente. */
export default function useChamadosAssistenteHandler({
  responder,
  temAcesso,
  informarAcessoNegado,
}: Params) {
  const {chamados, reload: carregarChamados} = useChamados({
    loadOnMount: false,
  });

  const consultarChamados = useCallback(async (): Promise<void> => {
    if (!temAcesso('Chamados')) {
      informarAcessoNegado('chamados');
      return;
    }

    const chamadosDisponiveis = chamados.length > 0
      ? chamados
      : await carregarChamados();

    if (!chamadosDisponiveis) {
      responder('Não consegui carregar os chamados. Verifique sua conexão.');
      return;
    }

    const atribuidos = chamadosDisponiveis.filter(
      chamado => chamado.situacao === 1 || chamado.situacao === 2,
    ).length;
    const naoAtribuidos = chamadosDisponiveis.filter(
      chamado => chamado.situacao === 0,
    ).length;

    responder(
      `Você possui ${atribuidos} ${atribuidos === 1 ? 'chamado atribuído' : 'chamados atribuídos'} e ${naoAtribuidos} ${naoAtribuidos === 1 ? 'não atribuído' : 'não atribuídos'} no seu setor.`,
    );
  }, [
    carregarChamados,
    chamados,
    informarAcessoNegado,
    responder,
    temAcesso,
  ]);

  return {consultarChamados};
}

