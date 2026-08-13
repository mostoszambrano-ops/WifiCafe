export type MenuItemType = {
  name: string;
  desc?: string;
  price: string;
  separator?: boolean;
};

export type ComboCardType = {
  badge: string;
  name: string;
  includes: string[];
  price: string;
  desc?: string;
};

export type AdditionalItemType = {
  name: string;
  price: string;
};

export type DrinkItemType = {
  name: string;
  price: string;
};

export const proteins = [
  'Pollo Crispy',
  'Carne Mechada',
  'Pollo Mechado',
  'Lomo de Cerdo',
  'Milanesa de Pollo',
  'Tocineta',
  'Chorizo',
];

export const sections = [
  { id: 'cachapas', label: 'Cachapas', emoji: '🌽' },
  { id: 'burgers', label: 'Hamburguesas', emoji: '🍔' },
  { id: 'hotdogs', label: 'Perros', emoji: '🌭' },
  { id: 'burritos', label: 'Burritos', emoji: '🌯' },
  { id: 'morocho', label: 'Morocho', emoji: '🥗' },
  { id: 'especiales', label: 'Especiales', emoji: '⭐' },
  { id: 'papas', label: 'Papas', emoji: '🍟' },
  { id: 'combos', label: 'Combos', emoji: '🔥' },
  { id: 'adicionales', label: 'Adicionales', emoji: '➕' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🥤' },
];

export const cachapas: MenuItemType[] = [
  { name: 'Queso Mozzarella', price: '14.000$' },
  { name: 'Queso Mozzarella + Jamón', price: '16.000$' },
  { name: 'Queso Mozzarella + Jamón', desc: '+ 1 Proteína a elegir', price: '23.000$' },
  { name: 'Queso Mozzarella + Jamón', desc: '+ 2 Proteínas a elegir', price: '28.000$' },
  { name: 'Queso Mozzarella + Jamón', desc: '+ 3 Proteínas a elegir', price: '35.000$' },
  { name: 'Queso de Mano', price: '20.000$', separator: true },
  { name: 'Queso de Mano + Jamón', price: '21.000$' },
  { name: 'Queso de Mano + Jamón', desc: '+ 1 Proteína a elegir', price: '28.000$' },
  { name: 'Queso de Mano + Jamón', desc: '+ 2 Proteínas a elegir', price: '33.000$' },
  { name: 'Queso de Mano + Jamón', desc: '+ 3 Proteínas a elegir', price: '41.000$' },
];

export const burgers_note = 'Todas las hamburguesas incluyen un servicio de 100g de papas fritas';

export const burgers: MenuItemType[] = [
  { name: 'Wi-Fi Croqueta', price: '14.000$' },
  { name: 'Wi-Fi Doble Croqueta + Queso Fundido', price: '21.000$' },
  { name: 'Wi-Fi Pollo Crispy', price: '16.000$' },
  { name: 'Wi-Fi Milanesa de Pollo', price: '16.000$' },
  { name: 'Wi-Fi Pollo Mechado', price: '16.000$' },
  { name: 'Wi-Fi Carne Mechada', price: '16.000$' },
  { name: 'Wi-Fi Lomo de Cerdo', price: '16.000$' },
  { name: 'Doble Wi-Fi', desc: '2 Proteínas a elegir', price: '23.000$' },
  { name: 'Súper Wi-Fi', desc: '4 Proteínas a elegir', price: '31.000$' },
  { name: 'QuetoWIFI', desc: '1 Proteína a elegir', price: '16.000$' },
  { name: 'QuetoWIFI', desc: '2 Proteínas a elegir', price: '23.000$' },
];

export const hotdogs: MenuItemType[] = [
  { name: 'Hot Dog Sencillo', price: '7.000$' },
  { name: 'Hot Dog Pollo Mechado', price: '12.000$' },
  { name: 'Hot Dog Carne Mechada', price: '12.000$' },
  { name: 'Perro Alemán', desc: 'Salchicha Frankfurt · Vegetales · Papas · Queso', price: '12.000$' },
  { name: 'Perro Polaco', desc: 'Salchicha Polaca · Vegetales · Papas · Queso', price: '18.000$' },
  { name: 'Perro Alemán', desc: '+ 1 Proteína a elegir', price: '17.000$' },
  { name: 'Perro Polaco', desc: '+ 1 Proteína a elegir', price: '23.000$' },
];

export const burritos: MenuItemType[] = [
  { name: 'Burrito', desc: '+ 1 Proteína a elegir', price: '17.500$' },
  { name: 'Burrito', desc: '+ 2 Proteínas a elegir', price: '23.000$' },
  { name: 'Faji-Burguer', desc: '+ 1 Proteína a elegir', price: '17.500$' },
  { name: 'Faji-Burguer', desc: '+ 2 Proteínas a elegir', price: '23.000$' },
];

export const burritos_note = 'Todos incluyen: Lechuga · Tomate · Cebolla · Jamón · Queso amarillo · Tocineta · Huevo · Papas fritas · Salsas';

export const morocho: ComboCardType[] = [
  {
    badge: 'Normal',
    name: 'Morocho Normal',
    includes: [
      'Pan de perro · Vegetales · Pollo mechado',
      'Carne mechada · Salchicha · Jamón · Queso',
      'Huevo · Papas fritas · Salsa',
    ],
    price: '24.000$',
  },
  {
    badge: '⭐ Especial',
    name: 'Morocho Especial',
    includes: [
      'Pan de perro · Vegetales · Pollo mechado',
      'Carne mechada · Salchicha · Lomo de cerdo',
      'Chorizo · Jamón · Queso · Huevo · Papas fritas · Salsa',
    ],
    price: '30.000$',
  },
];

export const especiales: ComboCardType[] = [
  {
    badge: 'Especialidad',
    name: 'Granjero',
    includes: [
      '1 Proteína a elegir',
      'Pollo Mechado · Carne Mechada · Pollo Crispy · Lomo de Cerdo · Milanesa',
    ],
    price: '19.000$',
  },
  {
    badge: 'Club',
    name: 'Club House',
    includes: [
      'Lechuga · Tomate · Cebolla · Huevo',
      'Pollo Mechado · Jamón · Queso',
      'Papas Fritas',
    ],
    price: '25.000$',
  },
  {
    badge: '🤝 Para Compartir',
    name: 'Picada o Parrillada al Barril',
    includes: [
      'Carne · Pollo · Chorizo',
      'Ensalada · Queso · Papas fritas · Salsas',
    ],
    price: '32.000$',
  },
];

export const ensaladas: ComboCardType[] = [
  {
    badge: '🥗 Ensalada',
    name: 'Ensalada César',
    includes: ['Lechuga · Tomate · Crutones · Queso Parmesano', 'Aderezo César'],
    price: '16.000$',
  },
  {
    badge: '🥗 Ensalada',
    name: 'Ensalada César + Pollo Crispy',
    includes: ['Lechuga · Tomate · Crutones · Queso Parmesano', 'Aderezo César · Pollo Crispy'],
    price: '21.000$',
  },
];

export const papas: MenuItemType[] = [
  { name: 'Salchipapa', desc: 'Papas fritas · Salchicha · Queso amarillo', price: '13.000$' },
  { name: 'Papipollo', desc: 'Papas fritas · Pollo Crispy · Queso amarillo', price: '18.000$' },
  { name: 'Servicio de Papas', price: '7.000$' },
  { name: 'Papas Especiales', desc: 'Queso amarillo fundido + Tocineta', price: '12.000$' },
];

export const mega_note = 'Cada Mega WiFi incluye 200g de Papas Fritas + Refresco de 1 Litro';

export const combos: ComboCardType[] = [
  {
    badge: '🔥 Combo',
    name: 'Combo Hamburguesa',
    includes: [
      '2 Hamburguesas Croqueta',
      'Servicio de Papas Fritas',
      '2 Vasos de Refresco',
    ],
    price: '24.000$',
  },
  {
    badge: '🔥 Combo',
    name: 'Combo Perros',
    includes: [
      '2 Hot Dog (Sencillo o Especial)',
      '2 Vasos de Refresco',
    ],
    price: '15.000$',
  },
  {
    badge: '👨‍👩‍👧‍👦 Para 4 Personas',
    name: 'Mega WiFi de Croqueta',
    includes: [
      'Hamburguesa de Croqueta para 4 personas',
      '200g de Papas Fritas · Refresco de 1 Litro',
    ],
    price: '45.000$',
  },
  {
    badge: '👨‍👩‍👧‍👦 Para 4 Personas',
    name: 'Mega WiFi 1 Proteína',
    includes: [
      'Hamburguesa para 4 personas',
      'Elige 1 Proteína',
      '200g de Papas Fritas · Refresco de 1 Litro',
    ],
    price: '50.000$',
    desc: '1 Proteína a elegir',
  },
  {
    badge: '👨‍👩‍👧‍👦 Para 4 Personas',
    name: 'Mega WiFi 2 Proteínas',
    includes: [
      'Hamburguesa para 4 personas',
      'Elige 2 Proteínas',
      '200g de Papas Fritas · Refresco de 1 Litro',
    ],
    price: '55.000$',
    desc: '2 Proteínas a elegir',
  },
];

export const adicionales: AdditionalItemType[] = [
  { name: 'Tocineta', price: '6.000$' },
  { name: 'Maíz', price: '2.000$' },
  { name: 'Huevo', price: '1.000$' },
  { name: 'Pollo Crispy', price: '9.000$' },
  { name: 'Milanesa Pollo', price: '8.000$' },
  { name: 'Croqueta', price: '7.000$' },
  { name: 'Pollo Mechado', price: '8.000$' },
  { name: 'Carne Mechada', price: '8.000$' },
  { name: 'Lomo Ahumado', price: '8.000$' },
  { name: 'Aros de Cebolla', price: '5.000$' },
];

export const bebidas: DrinkItemType[] = [
  { name: 'Refresco 2 Litros', price: '8.000$' },
  { name: 'Refresco 1 Litro', price: '5.000$' },
  { name: 'Refresco Individual', price: '3.000$' },
  { name: 'Vaso de Refresco', price: '2.000$' },
  { name: 'Jugos (Yukery / Yuky Park)', price: '4.000$' },
];
