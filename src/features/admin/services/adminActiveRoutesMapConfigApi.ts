import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';

interface ConfiguracaoMapaRotas {
  mapaRotasEmAndamentoAtivo?: boolean | null;
  attributes?: {
    mapaRotasEmAndamentoAtivo?: boolean | null;
  };
}

/** A ausência da flag ou qualquer resposta ambígua mantém o recurso oculto. */
export async function consultarMapaRotasAtivasHabilitado(
  client: AxiosInstance,
): Promise<boolean> {
  const response = await client.get<StrapiSingleResponse<ConfiguracaoMapaRotas>>(
    '/configuracao-app',
    {
      timeout: 4_000,
      'axios-retry': {retries: 0},
    },
  );
  const configuration = response.data.data;
  return (configuration?.attributes ?? configuration)
    ?.mapaRotasEmAndamentoAtivo === true;
}
