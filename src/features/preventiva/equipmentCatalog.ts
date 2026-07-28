import type {
  Equipamento,
  SecaoPatrimonio,
  TipoSecao,
} from './models';

const choice = (
  label: string,
  options: Array<[string, string]>,
): Equipamento => ({
  label,
  requiresSelection: true,
  options: options.map(
    ([optionLabel, value]) => ({
      label: optionLabel,
      value,
    }),
  ),
});

const simple = (
  label: string,
): Equipamento => ({
  label,
  requiresSelection: false,
});

export const ALL_EQUIPMENT: Equipamento[] = [
  simple('Nobreak:'),
  simple('Roteador:'),
  simple('Mikrotik:'),
  simple('SAT:'),
  choice('Leitor:', [
    ['QD', 'qd'],
    ['VSI', 'vsi'],
  ]),
  choice('Impressora:', [
    ['Epson', 'epson'],
    ['Daruma', 'daruma'],
  ]),
  choice('Zebra:', [
    ['ZD230', 'zd230'],
    ['GT800', 'gt800'],
  ]),
  choice('Scanner:', [
    ['Lide 300', 'lide300'],
    ['Scanjet 200', 'scanjet200'],
  ]),
  choice('ATA:', [
    ['Intelbras', 'intelbras'],
    ['Leucotron', 'leucotron'],
  ]),
];

export const EQUIPMENT_BY_SECTION:
  Record<TipoSecao, Equipamento[]> = {
    CAIXA: [
      simple('Máquina:'),
      simple('SAT:'),
      choice('Leitor:', [
        ['QD', 'qd'],
        ['VSI', 'vsi'],
      ]),
      choice('Impressora:', [
        ['Epson', 'epson'],
        ['Daruma', 'daruma'],
      ]),
      simple('Monitor:'),
    ],
    BALCAO: [
      simple('Máquina:'),
      choice('Leitor:', [
        ['QD', 'qd'],
        ['VSI', 'vsi'],
      ]),
      simple('Monitor:'),
    ],
    SERVIDOR: [
      simple('Máquina:'),
      simple('Nobreak:'),
      choice('ATA:', [
        ['Intelbras', 'intelbras'],
        ['Leucotron', 'leucotron'],
      ]),
      choice('Leitor:', [
        ['QD', 'qd'],
        ['VSI', 'vsi'],
      ]),
      choice('Scanner:', [
        ['Lide 300', 'lide300'],
        ['Scanjet 200', 'scanjet200'],
      ]),
      simple('Monitor:'),
    ],
    CLINICA: [
      simple('Máquina:'),
      choice('Leitor:', [
        ['QD', 'qd'],
        ['VSI', 'vsi'],
      ]),
      simple('Monitor:'),
    ],
    GERENTE: [
      simple('Máquina:'),
      simple('Monitor:'),
    ],
    RACK: [
      simple('Mikrotik:'),
      simple('Nobreak:'),
    ],
  };

export const INITIAL_SECTIONS:
  SecaoPatrimonio[] = [
    {
      title: 'Caixa G',
      items: [...EQUIPMENT_BY_SECTION.CAIXA],
    },
    {
      title: 'Caixa H',
      items: [...EQUIPMENT_BY_SECTION.CAIXA],
    },
    {
      title: 'Caixa I',
      items: [...EQUIPMENT_BY_SECTION.CAIXA],
    },
    {
      title: 'Balcao J',
      items: [...EQUIPMENT_BY_SECTION.BALCAO],
    },
    {
      title: 'Balcao K',
      items: [...EQUIPMENT_BY_SECTION.BALCAO],
    },
    {
      title: 'Balcao L',
      items: [...EQUIPMENT_BY_SECTION.BALCAO],
    },
    {
      title: 'Servidor',
      items: [
        ...EQUIPMENT_BY_SECTION.SERVIDOR,
      ],
    },
    {
      title: 'Clinica',
      items: [
        ...EQUIPMENT_BY_SECTION.CLINICA,
      ],
    },
    {
      title: 'Gerente',
      items: [
        ...EQUIPMENT_BY_SECTION.GERENTE,
      ],
    },
    {
      title: 'Rack',
      items: [...EQUIPMENT_BY_SECTION.RACK],
    },
  ];

export const getSectionPrefix = (
  type: TipoSecao,
): string => {
  const prefixes: Record<TipoSecao, string> = {
    CAIXA: 'Caixa',
    BALCAO: 'Balcao',
    SERVIDOR: 'Servidor',
    CLINICA: 'Clinica',
    GERENTE: 'Gerente',
    RACK: 'Rack',
  };

  return prefixes[type];
};
