import React, { useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import RecycleBinDropZone from '../com/RecycleBinDropZone'

// 主组件
const Recover: React.FC = () => {
  const recycleBinRef = useRef<any>(null);

  return (
    <Box 
      sx={{ height: 'calc(100vh - 76px)', padding: '16px' }}
    >
      {/* 回收站区域 */}
      <Paper elevation={2} sx={{ height: '100%', padding: '16px', overflow: 'auto' }}>
        <RecycleBinDropZone 
          ref={recycleBinRef} 
          apiEndpoint="/notes/getDelInfo"
          recoverEndpoint="/notes/recover_note"
          title="回收站"
          recoverButtonText="恢复"
          dialogTitle="确认恢复"
          dialogContent="您确定要恢复这个项目吗？"
          confirmButtonText="确认恢复"
        />
      </Paper>
    </Box>
  );
};

export default Recover;
