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
// 方法2：直接硬编码（快速测试用）
// const url = '127.0.0.1:5000'

async function updateHomePage() {
  try {
    // 1. 调用API获取actions数据
    const response = await fetch(`http://${url}/vitepress/GetHomeActions`)
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    // 2. 根据你的API实际返回结构调整
    // 假设返回格式: { code: 0, data: [{ text: '按钮1', link: '/link1', theme: 'brand' }, ...] }
    const actions = result.data || result
    
    console.log('获取到的actions数据:', actions)
    
    // 3. 读取原始的index.md文件
    const homePagePath = path.join(__dirname, '../index.md')
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
    
    const frontmatterStr = match[1]
    const frontmatter = yaml.load(frontmatterStr)
    
    // 5. 更新actions
    frontmatter.hero = frontmatter.hero || {}
    frontmatter.hero.actions = actions.map(action => ({
      theme: action.theme || 'brand',
      text: action.text,
      link: action.link
    }))
    
    // 6. 重新构建文件内容
    const updatedFrontmatter = '---\n' + yaml.dump(frontmatter, { lineWidth: -1 }) + '---\n'
    const markdownContent = content.slice(match[0].length)
    const newContent = updatedFrontmatter + markdownContent
    
    // 7. 写回文件
    fs.writeFileSync(homePagePath, newContent)
    console.log('✅ 首页actions已成功更新')
    
  } catch (error) {
    console.error('❌ 更新首页失败:', error.message)
    process.exit(1)
  }
}

// 执行更新
updateHomePage()