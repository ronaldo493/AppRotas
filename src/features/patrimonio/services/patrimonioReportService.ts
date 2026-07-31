import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import {Platform} from 'react-native';

import type {RelatorioPatrimonio} from '../models/Patrimonio';

let pendingSave: Promise<void> = Promise.resolve();
let pendingReport: RelatorioPatrimonio | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const SAVE_DELAY_MS = 300;

const getReportPath = (): string => {
  if (!FileSystem.documentDirectory) {
    throw new Error('Diretório de documentos indisponível.');
  }

  return `${FileSystem.documentDirectory}patrimonio.json`;
};

/**
 * Agenda a última versão do relatório. Digitações consecutivas substituem a
 * versão pendente e resultam em uma única escrita no arquivo.
 */
export const schedulePatrimonioReportSave = (
  report: RelatorioPatrimonio,
): void => {
  pendingReport = report;

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void flushPatrimonioReportSave().catch(error => {
      console.error('Erro ao salvar relatório de patrimônio:', error);
    });
  }, SAVE_DELAY_MS);
};

/**
 * Grava imediatamente a versão mais recente e aguarda escritas anteriores.
 */
export const flushPatrimonioReportSave = (): Promise<void> => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  const report = pendingReport;
  pendingReport = null;

  if (!report) return pendingSave;

  pendingSave = pendingSave
    .catch(() => undefined)
    .then(() =>
      FileSystem.writeAsStringAsync(
        getReportPath(),
        JSON.stringify(report, null, 2),
      ),
    );

  return pendingSave;
};

const formatReport = (report: RelatorioPatrimonio): string => {
  const lines = [`*${report.categoria}*`, '', `*FILIAL*: ${report.filial}`, ''];

  Object.entries(report.secoes).forEach(([section, values]) => {
    lines.push(`  *${section}:*`);

    Object.entries(values).forEach(([item, value]) => {
      lines.push(`    ${item} ${value}`);
    });

    lines.push('');
  });

  return lines.join('\n');
};

/**
 * Aguarda a última edição ser salva antes de ler e compartilhar o relatório.
 */
export const sharePatrimonioReport = async (): Promise<boolean> => {
  await flushPatrimonioReportSave();

  const reportPath = getReportPath();
  const reportInfo = await FileSystem.getInfoAsync(reportPath);

  if (!reportInfo.exists) return false;

  const serialized = await FileSystem.readAsStringAsync(reportPath);
  const report = JSON.parse(serialized) as RelatorioPatrimonio;
  const message = formatReport(report);
  const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
  const isSupported = await Linking.canOpenURL(url);

  if (!isSupported) return false;

  await Linking.openURL(url);
  await FileSystem.deleteAsync(reportPath, {idempotent: true});
  return true;
};

export const getWhatsAppUnavailableMessage = (): string =>
  Platform.OS === 'ios'
    ? 'O WhatsApp não está instalado ou o esquema de abertura não está disponível.'
    : 'O WhatsApp não está instalado ou não é suportado neste dispositivo.';
