import {Linking} from 'react-native';

const abrirUrl = async (url: string): Promise<boolean> => {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) return false;

    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
};

export const ligarParaContato = async (telefone: string): Promise<boolean> => {
  const numero = telefone.replace(/\D/g, '');

  return numero.length > 0 && abrirUrl(`tel:${numero}`);
};

export const enviarEmailParaContato = async (email: string): Promise<boolean> => {
  const destinatario = email.trim();

  return destinatario.length > 0 && abrirUrl(`mailto:${destinatario}`);
};
