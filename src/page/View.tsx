import React, { useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import TreeViewComponentNoDrag from '../com/TreeViewComponentNoDrag';
import Note from "./Note";

// 主组件
const View: React.FC = () => {
  const treeViewRef = useRef<any>(null);

  // 禁用右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <Box 
      sx={{ display: 'flex', height: 'calc(100vh - 76px)', padding: '16px', gap: '16px' }} 
      onContextMenu={handleContextMenu}
    >
      {/* 左侧树区域 */}
      <Paper elevation={2} sx={{ width: '240px', padding: '16px', overflow: 'auto', display: 'flex', 'flex-direction': 'column' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          文档树
        </Typography>
        <TreeViewComponentNoDrag 
              ref={treeViewRef} 
            />
      </Paper>

      {/* 右侧记录页面区域 */}
      <Paper elevation={2} sx={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        <Note />
      </Paper>
    </Box>
  );
};

export default View;