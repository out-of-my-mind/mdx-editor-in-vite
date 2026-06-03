import React, { useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import '../styles/TreeView.css';
import axiosInstance from '../api/axiosInstance';

// 定义右侧的数据结构
interface SourceItem {
  id: string;
  title: string;
  tags: string[];
}
interface ApiResponse {
  code: number;
  data: SourceItem[];
  message: string;
}
interface RecycleBinComponentProps {
  apiEndpoint?: string;
  recoverEndpoint?: string;
  title?: string;
  recoverButtonText?: string;
  dialogTitle?: string;
  dialogContent?: string;
  confirmButtonText?: string;
}

// 回收站项组件
const RecycleBinItem: React.FC<{ item: any; onRecover: (id: string) => void; recoverButtonText: string }> = ({ 
  item, 
  onRecover,
  recoverButtonText
}) => {
  console.log(item);
  return (
    <Box
      sx={{
        padding: '12px',
        margin: '8px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: 2,
        '&:hover': {
          backgroundColor: '#f0f0f0',
        },
      }}
    >
      <Typography variant="body1">{item.title}</Typography>
      <Typography 
        variant="body2" 
        color="primary" 
        sx={{ cursor: 'pointer', mt: 1 }}
        onClick={() => onRecover(item.id)}
      >
        {recoverButtonText}
      </Typography>
    </Box>
  );
};

// 回收站组件
const RecycleBinDropZone = forwardRef<any, RecycleBinComponentProps>(({ 
  apiEndpoint = '/notes/getDelInfo', 
  recoverEndpoint = '/notes/recover_note', 
  title = '回收站',
  recoverButtonText = '恢复',
  dialogTitle = '确认恢复',
  dialogContent = '您确定要恢复这个项目吗？',
  confirmButtonText = '确认恢复'
}, ref) => {
  const [dataSource, setDataSource] = useState<any[]>([]);
  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    itemId: ''
  });

  // 从接口获取数据的函数
  const fetchDataSource = async () => {
    try {
      const result: ApiResponse = await axiosInstance.get(apiEndpoint);
      const rightSource: SourceItem[] = [];
      // 检查接口返回是否成功
      if (result.code === 200) {
        Object.values(result.data).forEach(nodeArray => {
          rightSource.push({...nodeArray});
        });
        setDataSource(rightSource);
      } else {
        throw new Error(result.message || '接口返回失败');
      }
    } catch (err) {
      console.error('获取数据失败:', err);
    }
  };

  // 使用useEffect钩子在组件挂载时调用接口
  useEffect(() => {
    fetchDataSource();
  }, [apiEndpoint]);

  useImperativeHandle(ref, () => ({
    handleSetDataSource: (newDataSource: any[] | ((o: any[]) => any[])) => {
      setDataSource(prev => {
        const updatedDataSource = typeof newDataSource === 'function' ? newDataSource(prev) : newDataSource;
        return updatedDataSource;
      });
    },
    refreshDataSource: () => {
      fetchDataSource();
    }
  }));

  // 处理恢复项目
  const handleRecoverFromDataSource = (id: string) => {
    // 打开确认对话框
    setConfirmDialog({
      open: true,
      itemId: id
    });
  };

  // 处理确认恢复
  const handleConfirmRecover = async () => {
    const { itemId } = confirmDialog;
    try {
      // 调用恢复接口
      const result = await axiosInstance.get(`${recoverEndpoint}?id=${itemId}`);
      // 检查接口返回是否成功
      if (result.code === 200) {
        // 接口调用成功后更新本地状态
        setDataSource(prev => {
          const newDataSource = prev.filter((item) => item.id !== itemId);
          console.log('📦 回收站改变 - 恢复项目:', itemId, '当前回收站:', newDataSource);
          return newDataSource;
        });
      } else {
        throw new Error(result.message || '接口返回失败');
      }
    } catch (err) {
      console.error('恢复项目失败:', err);
    } finally {
      // 无论成功与否，关闭确认对话框
      setConfirmDialog({ open: false, itemId: '' });
    }
  };

  // 处理取消恢复
  const handleCancelRecover = () => {
    setConfirmDialog({ open: false, itemId: '' });
  };

  return (
    <>
      <Box
        sx={{
          height: '100%',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#f9f9f9',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        
        {dataSource.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            回收站为空
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {dataSource.map((item, index) => (
              <RecycleBinItem 
                key={index} 
                item={item} 
                onRecover={handleRecoverFromDataSource}
                recoverButtonText={recoverButtonText}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* 确认恢复对话框 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelRecover}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography>{dialogContent}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRecover}>取消</Button>
          <Button onClick={handleConfirmRecover} color="primary">{confirmButtonText}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default RecycleBinDropZone;
