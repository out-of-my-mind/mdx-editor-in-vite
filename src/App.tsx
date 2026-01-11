import "@mdxeditor/editor/style.css";
import { useState, useCallback } from "react";
import { ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DrawerCom from "./com/Drawer";
import Note from "./page/Note";
import Sorting from "./page/Sorting";

// 创建主题配置
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  spacing: 4
});

// 主应用组件
function App() {
  const [menuSelect, setMenuSelect] = useState('记录');

  const handleMenuSelect = useCallback((menu: string) => {
    setMenuSelect(menu);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <DrawerCom onMenuSelect={handleMenuSelect}>
          <Routes>
            {/* 默认路由重定向到记录页面 */}
            <Route path="/" element={<Navigate to="/note" replace />} />
            
            {/* 记录页面 */}
            <Route path="/note" element={
              <div>
                <Note />
              </div>
            } />
            
            {/* 梳理页面 */}
            <Route path="/sorting" element={
              <div>
                <Sorting />
              </div>
            } />
            
            {/* 查看页面 */}
            <Route path="/view" element={
              <div style={{ padding: '20px' }}>
                <h2>查看页面</h2>
                <p>这里是查看功能的内容区域。</p>
              </div>
            } />
            
            {/* 总览页面 */}
            <Route path="/overview" element={
              <div style={{ padding: '20px' }}>
                <h2>总览页面</h2>
                <p>这里是总览功能的内容区域。</p>
              </div>
            } />
            
            {/* 模板页面 */}
            <Route path="/template" element={
              <div style={{ padding: '20px' }}>
                <h2>模板页面</h2>
                <p>这里是模板功能的内容区域。</p>
              </div>
            } />
            
            {/* 404 页面 */}
            <Route path="*" element={
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>页面未找到</h2>
                <p>您访问的页面不存在。</p>
              </div>
            } />
          </Routes>
        </DrawerCom>
      </Router>
    </ThemeProvider>
  );
}

export default App;