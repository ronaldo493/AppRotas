const axios = require('axios');

const BASE_URL = 'http://10.215.10.30:1337';

const testUserMe = async () => {
  try {
    // 1. LOGIN
    const loginResponse = await axios.post(
      `${BASE_URL}/api/auth/local`,
      {
        identifier: '8392@drogal.com.br',
        password: '27Drogal',
      }
    );

    const token = loginResponse.data.jwt;

    console.log('JWT GERADO:', token);

    // 2. USUÁRIO + ROLE
    const userResponse = await axios.get(
      `${BASE_URL}/api/users/me?populate=role`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const user = userResponse.data;

    console.log('\nUSER COMPLETO:');
    console.log(JSON.stringify(user, null, 2));

    // 3. SETOR DO USUÁRIO
    const setor = user.setor?.trim().toLowerCase();

    // 4. CARGO (IMPORTANTE)
    const cargo = user.cargo?.trim().toUpperCase();

    console.log('\nSETOR DO USUÁRIO:', setor);
    console.log('CARGO:', cargo);

    // 5. BUSCA MENUS
    const menuResponse = await axios.get(
      `${BASE_URL}/api/menus?populate=setors`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("🚀 ~ testUserMe ~ menuResponse:", menuResponse.data.data)

    // 6. FILTRO FINAL (SETOR + ADMIN/GESTOR)
    const menusFiltrados = menuResponse.data.data
      .filter(menu => {
        // 1. Se o cara for ADMIN, passa direto (traz tudo sem filtro algum)
        if (cargo === "ADMIN") {
          return true;
        }

        // Validação do setor (usada para GESTOR e usuários sem cargo)
        const setorMatch = menu.setors?.some(s =>
          s.titulo?.trim().toLowerCase() === setor?.trim().toLowerCase()
        );

        // Identifica se é um menu de Admin
        const isAdminMenu = menu.titulo === "Admin";

        // 2. Se o cara for GESTOR, traz os do setor dele + os menus de Admin
        if (cargo === "GESTOR") {
          return setorMatch || isAdminMenu;
        }

        // 3. Se não tiver cargo algum (ou qualquer outro caso), traz APENAS os do setor dele
        return setorMatch;
      })
      .map(({ titulo, rota, ativo, ordem }) => ({
        titulo,
        rota,
        ativo,
        ordem
      }));

    // console.log("\nMENUS FILTRADOS:");
    // console.log(JSON.stringify(menusFiltrados, null, 2));

  } catch (error) {
    console.error(
      'Erro:',
      error.response?.data || error.message
    );
  }
};

testUserMe();