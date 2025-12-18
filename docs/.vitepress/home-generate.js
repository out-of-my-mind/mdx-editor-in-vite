import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'  // 需要安装：npm install js-yaml
import { loadEnv } from 'vite';
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 方法1：使用环境变量（推荐）
const url = env.VITE_PRESS_ENV_API || '127.0.0.1:5000'
console.log('---------', env.VITE_PRESS_ENV_API)
// 生成模板文件前，先删除之前生成的文件
const ignoreFolders = ['.vitepress', 'template','theme', 'todo']
const basePath = path.join(__dirname, '../')

async function updateHomePage() {
  try {
    //#region 从接口获得 home页 菜单数据
    // 1. 调用API获取actions数据
    const response = await fetch(`http://${url}/vitepress/GetHomeActions`)
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }
    const result = await response.json()
    // 2. 根据你的API实际返回结构调整
    const actions = result.data || result
    console.log('获取到的actions数据:', actions)

    // 3. 读取原始的index.md文件
    const homePagePath = path.join(basePath, '/index.md')
    console.log('读取文件:', homePagePath)
    if (!fs.existsSync(homePagePath)) {
      throw new Error(`文件不存在: ${homePagePath}`)
    }
    
    let content = fs.readFileSync(homePagePath, 'utf-8')
    // 4. 解析frontmatter（使用js-yaml更可靠）
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/
    const match = content.match(frontmatterRegex)
    if (!match) {
      throw new Error('未找到有效的frontmatter')
    }
    
    // 5. 创建模板文件夹以及文件
    const fileAll = fs.readdirSync(basePath)
    fileAll.forEach((item) =>{
      const filePath = path.join(basePath, `/${item}`)
      if(fs.statSync(filePath).isDirectory() && !ignoreFolders.includes(item)) {
        fs.rmSync(filePath, { recursive: true })
      }
    })
    const templateMD = path.join(basePath, `/template/[].md`)
    const templateJS = path.join(basePath, `/template/[].paths.js`)
    actions.forEach(action => {
      const folderPath = path.join(basePath, `/${action.link}`)
      console.log('创建文件夹：', folderPath)
      try {
        fs.mkdirSync(folderPath, { recursive: true })
        const mdFile = path.join(folderPath, `/[${action.link}].md`)
        const jsFile = path.join(folderPath, `/[${action.link}].paths.js`)
        fs.copyFileSync(templateMD, mdFile);
        fs.copyFileSync(templateJS, jsFile);
        console.log('文件已成功复制');
        // 替换模板内容
        let jsContent = fs.readFileSync(jsFile, 'utf-8')
        jsContent = jsContent.replaceAll('\'#link_txt#\'', action.link)
        fs.writeFileSync(jsFile, jsContent)
      } catch (err) {
        throw new Error(err)
      }
    });
    
    const frontmatterStr = match[1]
    const frontmatter = yaml.load(frontmatterStr)
    // 6. 更新actions
    frontmatter.hero = frontmatter.hero || {}
    const heroActions = []
    for(var i = 0; i < actions.length; i++) {
      const action = actions[i]
      const pkgs = await (
        await fetch(`http://${url}/vitepress/GetVitePressRoute?type=${action.link}`)
      ).json()
      heroActions.push({
        theme: action.theme || 'brand',
        text: action.title,
        link: `/${action.link}/${pkgs.data[0]?.noteid}` // 注意需要和模板js里设置的 字段保持一致
      })
    }
    frontmatter.hero.actions = heroActions
    
    // 6. 重新构建文件内容
    const updatedFrontmatter = '---\n' + yaml.dump(frontmatter, { lineWidth: -1 }) + '---\n'
    const markdownContent = content.slice(match[0].length)
    const newContent = updatedFrontmatter + markdownContent
    
    // 7. 写回文件
    fs.writeFileSync(homePagePath, newContent)
    console.log('✅ 首页actions已成功更新')
    //#endregion
  } catch (error) {
    console.error('❌ 更新首页失败:', error.message)
    process.exit(1)
  }
}

// 执行更新
updateHomePage()