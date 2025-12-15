import { defineConfig } from "vitepress";
import path from "path";

export default async () => {
  const posts = await (
    await fetch("http://127.0.0.1:5000/vitepress/getVitePressSidebar")
  ).json();
  return defineConfig({
    title: "帮助文档",
    description: "查阅",
    appearance: true,
    navbar: true,
    themeConfig: {
      sidebar: JSON.parse(posts),
      search: {
        provider: 'local'
      }
    },
    vite: {
      resolve: {
        alias: {
          //'@': fileURLToPath(new URL('../../', import.meta.url)),
          "@": path.resolve(__dirname, "../../src"),
        },
      },
    },
  });
};
