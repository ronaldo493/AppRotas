import type {
  CamposPorSecao,
  RelatorioPatrimonio,
  TipoServico,
} from '../models/Patrimonio';

interface CreatePatrimonioReportInput {
  filial: string;
  serviceType: TipoServico;
  fields: CamposPorSecao;
}

/**
 * Converte o estado editável da tela no formato já usado pelo relatório e pelo
 * compartilhamento, mantendo a regra de apresentação das opções selecionadas.
 */
export default function createPatrimonioReport({
  filial,
  serviceType,
  fields,
}: CreatePatrimonioReportInput): RelatorioPatrimonio {
  const secoes = Object.fromEntries(
    Object.entries(fields).map(([section, sectionFields]) => [
      section,
      Object.fromEntries(
        Object.entries(sectionFields).map(([item, field]) => [
          item,
          field.option
            ? `${field.patrimonio} (${field.option})`
            : field.patrimonio,
        ]),
      ),
    ]),
  );

  return {
    categoria: serviceType,
    filial,
    secoes,
  };
}
