import { defineConfig } from "vitepress";
import path from "path";
import ENV from '../env'

const url = ENV.VITE_PRESS_ENV_API
export default async () => {
  const posts = await (
    await fetch(`http://${url}/vitepress/GetVitePressSidebar`)
  ).json();
  console.log(posts.data)
  return defineConfig({
    title: "帮助文档",
    description: "查阅",
    appearance: true,
    navbar: true,
    themeConfig: {
      sidebar: posts.data,
      // {
      //   "/costs/": [
      //       {
      //           "text": "\u6280\u7ecf\u624b\u518c",
      //           "items": [
      //               {
      //                   "text": "\u7b80\u4ecb",
      //                   "link": "/costs/a"
      //               },
      //               {
      //                   "text": "\u4e00\u7ea71",
      //                   "link": "/costs/b"
      //               },
      //               {
      //                   "text": "\u4e00\u7ea72",
      //                   "link": "/costs/c"
      //               },
      //               {
      //                   "text": "\u4e8c\u7ea7\u51c6\u5907",
      //                   "collapsed": "false",
      //                   "items": [
      //                       {
      //                           "text": "\u4e8c\u7ea71",
      //                           "link": "/costs/d"
      //                       },
      //                       {
      //                           "text": "\u4e8c\u7ea72",
      //                           "link": "/costs/e"
      //                       }
      //                   ]
      //               }
      //           ]
      //       }
      //   ],
      //   "/designs/": [
      //       {
      //           "text": "\u8bbe\u8ba1\u624b\u518c",
      //           "items": [
      //               {
      //                   "text": "\u7b80\u4ecb",
      //                   "link": "/designs/a"
      //               },
      //               {
      //                   "text": "\u4e00\u7ea71",
      //                   "link": "/designs/b"
      //               },
      //               {
      //                   "text": "\u4e00\u7ea72",
      //                   "link": "/designs/c"
      //               },
      //               {
      //                   "text": "\u4e8c\u7ea7\u51c6\u5907",
      //                   "collapsed": "false",
      //                   "items": [
      //                       {
      //                           "text": "\u4e8c\u7ea71",
      //                           "link": "/designs/d"
      //                       },
      //                       {
      //                           "text": "\u4e8c\u7ea72",
      //                           "link": "/designs/e"
      //                       }
      //                   ]
      //               }
      //           ]
      //       }
      //   ]
      // },
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
