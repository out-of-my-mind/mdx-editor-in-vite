import { defineConfig } from "vitepress";
import path from "path";
import ENV from '../env'

const url = ENV.VITE_PRESS_ENV_API
export default async () => {
  const posts = await (
    await fetch(`http://${url}/vitepress/GetVitePressSidebar`)
  ).json();
  return defineConfig({
    title: "帮助文档",
    description: "查阅",
    appearance: true,
    navbar: true,
    themeConfig: {
      sidebar: posts.data,
      // {
      //   "/jenkins/": [
      //     {
      //       "text": "jenkins手册",
      //       "items": [
      //         {
      //           "text": "简介",
      //           "link": "/jenkins/简介标题"
      //         },
      //         {
      //           "text": "一级二",
      //           "link": "/jenkins/3"
      //         },
      //         {
      //           "text": "一级一",
      //           "link": "/jenkins/2"
      //         },
      //         {
      //           "text": "二级准备",
      //           "collapsed": "false",
      //           "items": [
      //             {
      //               "text": "二级二",
      //               "link": "/jenkins/5"
      //             },
      //             {
      //               "text": "二级一",
      //               "link": "/jenkins/4"
      //             }
      //           ]
      //         }
      //       ]
      //     }
      //   ],
      //   "/svn/": [
      //     {
      //       "text": "svn手册",
      //       "items": [
      //         {
      //           "text": "二级准备",
      //           "collapsed": "false",
      //           "items": [
      //             {
      //               "text": "二级一",
      //               "link": "/svn/4"
      //             },
      //             {
      //               "text": "二级二",
      //               "link": "/svn/5"
      //             }
      //           ]
      //         },
      //         {
      //           "text": "简介",
      //           "link": "/svn/1"
      //         },
      //         {
      //           "text": "一级一",
      //           "link": "/svn/2"
      //         },
      //         {
      //           "text": "一级二",
      //           "link": "/svn/3"
      //         }
      //       ]
      //     }
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
