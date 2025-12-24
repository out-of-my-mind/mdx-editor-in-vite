import "@mdxeditor/editor/style.css";
import { useState, useCallback } from "react";
import { ThemeProvider, createTheme } from '@mui/material';
import DrawerCom from "./com/Drawer";
import Note from "./com/Note";

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
});

function App() {
  const [menuSelect, setMenuSelect] = useState('记录');

  const handleMenuSelect = useCallback((menu: string) => {
    setMenuSelect(menu);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <DrawerCom onMenuSelect={handleMenuSelect}>
        {menuSelect === '记录' && (
          <>
            <Note />
          </>
        )}
        {menuSelect === '梳理' && (
          <div style={{ padding: '20px' }}>
            <h2>梳理页面</h2>
            <p>这里是梳理功能的内容区域。</p>
          </div>
        )}
        {menuSelect === '查看' && (
          <div style={{ padding: '20px' }}>
            <h2>查看页面</h2>
            <p>这里是查看功能的内容区域。</p>
          </div>
        )}
        {menuSelect === '总览' && (
          <div style={{ padding: '20px' }}>
            <h2>总览页面</h2>
            <p>这里是总览功能的内容区域。</p>
          </div>
        )}
        {menuSelect === '模板' && (
          <div style={{ padding: '20px' }}>
            <h2>模板页面</h2>
            <p>这里是模板功能的内容区域。</p>
          </div>
        )}
      </DrawerCom>
    </ThemeProvider>
  );
}

export default App;