import useStrapiClient from "../services/StrapiClient";

const useAuthMenus = () => {
  const conexao = useStrapiClient();

  const loadUserWithMenus = async (jwt, user) => {
    try {
      const setor = user.setor?.trim().toLowerCase();
      const cargo = user.cargo?.trim().toUpperCase();

      const response = await conexao.get("/menus?populate=setors", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const menusFiltrados = response.data.data
        .filter(menu => {
          // 1. Se o usuário for ADMIN, ignora filtros e traz tudo
          if (cargo === "ADMIN") {
            return true;
          }

          //Validação do setor (usada para GESTOR e usuários sem cargo)
          const setorMatch = menu.setors?.some(s =>
            s.titulo?.trim().toLowerCase() === setor?.trim().toLowerCase()
          );
          
          //Identifica se é um menu específico de Admin
          const isAdminMenu = menu.titulo === "Admin";

          //2. Se for GESTOR, traz os do setor dele + os de Admin
          if (cargo === "GESTOR") {
            return setorMatch || isAdminMenu;
          }

          //3. Se não tiver cargo (usuário comum), traz APENAS os do seu próprio setor
          return setorMatch.filter(active => active.active === true);
        })
        .map(({ titulo, rota, ativo, ordem, icone }) => ({
          titulo,
          rota,
          ativo,
          icone,
          ordem,
        }));

      return {
        ...user,
        menus: menusFiltrados,
      };

    } catch (err) {
      console.log("Erro menus:", err);
      return {
        ...user,
        menus: [],
      };
    }
  };

  return { loadUserWithMenus };
};

export default useAuthMenus;