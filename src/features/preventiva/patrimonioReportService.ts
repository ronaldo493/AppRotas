import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import {Platform} from 'react-native';

import type {RelatorioPatrimonio} from './models';

const getReportPath = (): string => {
  if (!FileSystem.documentDirectory) {
    throw new Error(
      'Diretório de documentos indisponível.',
    );
  }

  return `${FileSystem.documentDirectory}patrimonio.json`;
};

export const savePatrimonioReport = async (
  report: RelatorioPatrimonio,
): Promise<void> => {
  await FileSystem.writeAsStringAsync(
    getReportPath(),
    JSON.stringify(report, null, 2),
  );
};

const formatReport = (
  report: RelatorioPatrimonio,
): string => {
  const lines = [
    `*${report.categoria}*`,
    '',
    `*FILIAL*: ${report.filial}`,
    '',
  ];

  Object.entries(report.secoes).forEach(
    ([section, values]) => {
      lines.push(`  *${section}:*`);

      Object.entries(values).forEach(
        ([item, value]) => {
          lines.push(`    ${item} ${value}`);
        },
      );

      lines.push('');
    },
  );

  return lines.join('\n');
};

export const sharePatrimonioReport =
  async (): Promise<boolean> => {
    const reportPath = getReportPath();
    const reportInfo =
      await FileSystem.getInfoAsync(reportPath);

    if (!reportInfo.exists) return false;

    const serialized =
      await FileSystem.readAsStringAsync(
        reportPath,
      );
    const report = JSON.parse(
      serialized,
    ) as RelatorioPatrimonio;
    const message = formatReport(report);
    const url =
      `whatsapp://send?text=${encodeURIComponent(
        message,
      )}`;
    const isSupported =
      await Linking.canOpenURL(url);

    if (!isSupported) return false;

    await Linking.openURL(url);
    await FileSystem.deleteAsync(reportPath, {
      idempotent: true,
    });

    return true;
  };

export const getWhatsAppUnavailableMessage =
  (): string =>
    Platform.OS === 'ios'
      ? 'O WhatsApp não está instalado ou o esquema de abertura não está disponível.'
      : 'O WhatsApp não está instalado ou não é suportado neste dispositivo.';
