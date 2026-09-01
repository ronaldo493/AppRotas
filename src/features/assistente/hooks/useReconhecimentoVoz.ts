import {requireOptionalNativeModule} from 'expo';
import {useCallback, useEffect, useRef, useState} from 'react';

type SpeechRecognitionErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'busy'
  | 'client'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'speech-timeout'
  | 'unknown';

interface SpeechRecognitionResultEvent {
  isFinal: boolean;
  results: Array<{
    transcript: string;
    confidence?: number;
    segments?: Array<{
      segment: string;
    }>;
  }>;
}

interface SpeechRecognitionErrorEvent {
  error: SpeechRecognitionErrorCode;
  message: string;
}

interface NativeSubscription {
  remove: () => void;
}

interface SpeechRecognitionNativeModule {
  addListener: (
    eventName: 'start' | 'end' | 'result' | 'error' | 'nomatch',
    listener: (event: unknown) => void,
  ) => NativeSubscription;
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    contextualStrings: string[];
    addsPunctuation: boolean;
    androidIntentOptions: {
      EXTRA_LANGUAGE_MODEL: 'free_form';
    };
  }) => void;
  stop: () => void;
  abort: () => void;
  requestPermissionsAsync: () => Promise<{
    granted: boolean;
  }>;
  isRecognitionAvailable: () => boolean;
}

export type ErroReconhecimentoVoz =
  | 'modulo_ausente'
  | 'servico_indisponivel'
  | 'permissao_negada'
  | 'sem_fala'
  | 'sem_conexao'
  | 'ocupado'
  | 'falha';

interface UseReconhecimentoVozOptions {
  onTranscricoes: (transcricoes: readonly string[]) => void;
  onErro: (erro: ErroReconhecimentoVoz) => void;
}

interface UseReconhecimentoVozReturn {
  ativo: boolean;
  ouvindo: boolean;
  alternarReconhecimento: () => Promise<void>;
  cancelarReconhecimento: () => void;
}

const speechRecognitionModule =
  requireOptionalNativeModule<SpeechRecognitionNativeModule>(
    'ExpoSpeechRecognition',
  );

/**
 * Vocabulário do domínio enviado ao serviço nativo para reduzir trocas de
 * palavras importantes. Ele funciona como dica acústica, não como uma lista
 * fechada de comandos.
 */
const CONTEXTOS_ASSISTENTE = [
  'adicionar filial',
  'adicionar loja',
  'remover filial',
  'traçar rota',
  'limpar rota',
  'inverter rota',
  'mover filial',
  'trocar filial',
  'desfazer',
  'antes da filial',
  'depois da filial',
  'posição',
  'restaurante mais próximo',
  'posto de combustível mais próximo',
  'pontos de interesse',
  'abrir mapa de filiais',
  'mostrar filial no mapa',
  'lojas em Piracicaba',
  'quantas filiais existem em Piracicaba',
  'cidade com mais filiais',
  'cidade com menos filiais',
  'região mais quente',
  'listar cidades com filiais',
  'consultar histórico',
  'visitas de hoje',
  'visitas de ontem',
  'visitas desta semana',
  'última visita',
  'buscar contato',
  'consultar ramal',
  'contato do departamento',
  'listar departamentos',
  'listar pessoas do departamento',
  'quantas pessoas trabalham no departamento',
  'segunda parada',
  'trocar primeira parada',
  'abrir preventiva',
  'abrir meu perfil',
  'enviar sugestão',
  'modo escuro',
  'modo claro',
];

const mapearErro = (error: SpeechRecognitionErrorCode): ErroReconhecimentoVoz => {
  if (error === 'not-allowed') return 'permissao_negada';
  if (error === 'no-speech' || error === 'speech-timeout') return 'sem_fala';
  if (error === 'network') return 'sem_conexao';
  if (error === 'busy') return 'ocupado';
  if (error === 'service-not-allowed' || error === 'language-not-supported') {
    return 'servico_indisponivel';
  }

  return 'falha';
};

/**
 * Controla uma sessão curta de reconhecimento de voz e traduz eventos nativos
 * em callbacks simples para o assistente global.
 */
export default function useReconhecimentoVoz({
  onTranscricoes,
  onErro,
}: UseReconhecimentoVozOptions): UseReconhecimentoVozReturn {
  const [iniciando, setIniciando] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const ouvindoRef = useRef(false);
  const transcricoesPendentesRef = useRef<string[]>([]);
  const resultadoEntregueRef = useRef(false);
  const permissaoConcedidaRef = useRef(false);
  const onTranscricoesRef = useRef(onTranscricoes);
  const onErroRef = useRef(onErro);

  useEffect(() => {
    onTranscricoesRef.current = onTranscricoes;
    onErroRef.current = onErro;
  }, [onErro, onTranscricoes]);

  useEffect(() => {
    if (!speechRecognitionModule) return;

    const subscriptions = [
      speechRecognitionModule.addListener('start', () => {
        transcricoesPendentesRef.current = [];
        resultadoEntregueRef.current = false;
        ouvindoRef.current = true;
        setIniciando(false);
        setOuvindo(true);
      }),
      speechRecognitionModule.addListener('end', () => {
        const transcricoes = transcricoesPendentesRef.current;
        const deveEntregar =
          !resultadoEntregueRef.current && transcricoes.length > 0;

        transcricoesPendentesRef.current = [];
        resultadoEntregueRef.current = false;
        ouvindoRef.current = false;
        setIniciando(false);
        setOuvindo(false);

        if (deveEntregar) {
          onTranscricoesRef.current(transcricoes);
        }
      }),
      speechRecognitionModule.addListener('result', rawEvent => {
        const event = rawEvent as unknown as SpeechRecognitionResultEvent;

        if (!event.isFinal) return;

        const transcricoes = Array.from(
          new Set(
            event.results
              .flatMap(resultado => {
                const transcricao = resultado.transcript.trim();
                const transcricaoSegmentada = resultado.segments
                  ?.map(segmento => segmento.segment.trim())
                  .filter(Boolean)
                  .join(' ');

                return [transcricao, transcricaoSegmentada ?? ''];
              })
              .filter(Boolean),
          ),
        );

        if (transcricoes.length === 0 || resultadoEntregueRef.current) return;

        /*
         * O resultado final já é suficiente para interpretar o pedido. Não
         * aguarda o evento `end`, que alguns serviços Android emitem somente
         * depois de um atraso perceptível.
         */
        transcricoesPendentesRef.current = transcricoes;
        resultadoEntregueRef.current = true;
        ouvindoRef.current = false;
        setIniciando(false);
        setOuvindo(false);
        onTranscricoesRef.current(transcricoes);
        speechRecognitionModule.stop();
      }),
      speechRecognitionModule.addListener('error', rawEvent => {
        const event = rawEvent as unknown as SpeechRecognitionErrorEvent;

        if (event.error === 'aborted') return;

        transcricoesPendentesRef.current = [];
        resultadoEntregueRef.current = false;
        ouvindoRef.current = false;
        setIniciando(false);
        setOuvindo(false);
        onErroRef.current(mapearErro(event.error));
      }),
      speechRecognitionModule.addListener('nomatch', () => {
        transcricoesPendentesRef.current = [];
        resultadoEntregueRef.current = false;
        ouvindoRef.current = false;
        setIniciando(false);
        setOuvindo(false);
        onErroRef.current('sem_fala');
      }),
    ];

    return () => {
      subscriptions.forEach(subscription => subscription.remove());

      if (ouvindoRef.current) speechRecognitionModule.abort();
    };
  }, []);

  const iniciarReconhecimento = useCallback(async (): Promise<void> => {
    if (!speechRecognitionModule) {
      onErroRef.current('modulo_ausente');
      return;
    }

    if (!speechRecognitionModule.isRecognitionAvailable()) {
      onErroRef.current('servico_indisponivel');
      return;
    }

    setIniciando(true);

    try {
      if (!permissaoConcedidaRef.current) {
        const permission =
          await speechRecognitionModule.requestPermissionsAsync();

        if (!permission.granted) {
          setIniciando(false);
          onErroRef.current('permissao_negada');
          return;
        }

        /* Evita uma nova travessia da ponte nativa em cada comando da sessão. */
        permissaoConcedidaRef.current = true;
      }

      speechRecognitionModule.start({
        lang: 'pt-BR',
        interimResults: false,
        continuous: false,
        maxAlternatives: 3,
        contextualStrings: CONTEXTOS_ASSISTENTE,
        addsPunctuation: false,
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: 'free_form',
        },
      });
    } catch {
      setIniciando(false);
      onErroRef.current('falha');
    }
  }, []);

  const alternarReconhecimento = useCallback(async (): Promise<void> => {
    if (iniciando) return;

    if (ouvindo) {
      speechRecognitionModule?.stop();
      return;
    }

    await iniciarReconhecimento();
  }, [iniciando, iniciarReconhecimento, ouvindo]);

  const cancelarReconhecimento = useCallback((): void => {
    transcricoesPendentesRef.current = [];
    resultadoEntregueRef.current = false;
    ouvindoRef.current = false;
    setIniciando(false);
    setOuvindo(false);
    speechRecognitionModule?.abort();
  }, []);

  return {
    ativo: iniciando || ouvindo,
    ouvindo,
    alternarReconhecimento,
    cancelarReconhecimento,
  };
}
