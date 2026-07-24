import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';

import { useAuthContext } from '../context/AuthContext';
import useStrapiClient from '../services/StrapiClient';

import type {StrapiRequestError, StrapiSingleResponse,} from '../type/Strapi';
import { NovaSugestao, Sugestao, SugestaoTipo } from '../type/FeedBack';

const useSugestao = () => {
  const conexao = useStrapiClient();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState<boolean>(false);

  const enviarSugestao = useCallback(
    async (tipo: SugestaoTipo, mensagem: string): Promise<boolean> => {
      const mensagemTratada = mensagem.trim();

      if (!user) {
        Toast.show({
          type: 'error',
          text1: 'Usuário não identificado',
          text2: 'Faça login novamente.',
        });

        return false;
      }

      if (!mensagemTratada) {
        Toast.show({
          type: 'error',
          text1: 'Mensagem obrigatória',
          text2: 'Descreva sua sugestão ou melhoria.',
        });

        return false;
      }

      const novaSugestao: NovaSugestao = {
        user: user.username ?? 'Não informado',
        setor: user.setor ?? 'Não informado',
        email: user.email,
        tipo,
        tela: 'ROTAS',
        sugestao: mensagemTratada,
        situation: 'PENDENTE',
      };

      setLoading(true);

      try {
        await conexao.post<StrapiSingleResponse<Sugestao>>('/sugestoes', {
          data: novaSugestao,
        });

        Toast.show({
          type: 'success',
          text1: 'Sugestão enviada',
          text2: 'Obrigado por ajudar a melhorar o aplicativo.',
        });

        return true;
      } catch (err: unknown) {
        const strapiError = err as StrapiRequestError;

        const message =
          strapiError.response?.data?.error?.message ??
          strapiError.response?.data?.message ??
          'Não foi possível enviar sua sugestão.';

        Toast.show({
          type: 'error',
          text1: 'Erro ao enviar',
          text2: message,
        });

        return false;
      } finally {
        setLoading(false);
      }
    },
    [conexao, user],
  );

  return {
    loading,
    enviarSugestao,
  };
};

export default useSugestao;