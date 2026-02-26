import React, { useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useDrag, useDrop } from 'react-dnd';
import '../styles/TreeView.css';

// 定义右侧的数据结构
interface SourceItem {
  id: string;
  text: string;
  tags: string[];
}
interface ApiResponse {
  code: number;
  data: SourceItem[];
  message: string;
}
interface DataSourceComponentProps {
  onDrop?: (node: any) => void;
}
// 数据源项组件
const DataSourceItem: React.FC<{ item: any; index: number; onRemove: (id: string) => void }> = ({ 
  item, 
  index, 
  onRemove 
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'data_source_item',
    item: { item, index, source: 'datasource' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [item, index]);

  return (
    <Box
      ref={drag}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
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
      <Typography variant="body1">{item.text}</Typography>
      <Typography 
        variant="body2" 
        color="error" 
        sx={{ cursor: 'pointer', mt: 1 }}
        onClick={() => onRemove(item.id)}
      >
        移除
      </Typography>
    </Box>
  );
};

// 数据源放置区域
const DataSourceDropZone = forwardRef<any, DataSourceComponentProps>(({ onDrop }, ref) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['tree_node'],
    drop: (item: any) => {
      if (item.source === 'tree' && onDrop) {
        onDrop(item.node);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDrop]);

  const [dataSource, setDataSource] = useState<any[]>([]);
  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    itemId: ''
  });

  // 从接口获取树数据的函数
  const fetchDataSource = async () => {
    // setLoading(true);
    // setError(null);
    try {
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/getRightDataSource`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
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
      // setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      // setLoading(false);
    }
  };
  // 使用useEffect钩子在组件挂载时调用接口
  useEffect(() => {
    fetchDataSource();
  }, []);
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
  // 处理从数据源移除项目
  const handleRemoveFromDataSource = (id: string) => {
    // 打开确认对话框
    setConfirmDialog({
      open: true,
      itemId: id
    });
  };

  // 处理确认移除
  const handleConfirmRemove = async () => {
    const { itemId } = confirmDialog;
    try {
      // 调用移除接口
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/remove_note?id=${itemId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      // 检查接口返回是否成功
      if (result.code === 200) {
        // 接口调用成功后更新本地状态
        setDataSource(prev => {
          const newDataSource = prev.filter((item) => item.id !== itemId);
          console.log('📦 数据源改变 - 移除项目:', itemId, '当前数据源:', newDataSource);
          return newDataSource;
        });
      } else {
        throw new Error(result.message || '接口返回失败');
      }
    } catch (err) {
      console.error('移除项目失败:', err);
    } finally {
      // 无论成功与否，关闭确认对话框
      setConfirmDialog({ open: false, itemId: '' });
    }
  };

  // 处理取消移除
  const handleCancelRemove = () => {
    setConfirmDialog({ open: false, itemId: '' });
  };

  return (
    <>
      <Box
        ref={drop}
        sx={{
          height: '100%',
          border: isOver ? '2px solid #1976d2' : '2px dashed #ccc',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: isOver ? 'rgba(25, 118, 210, 0.1)' : '#f9f9f9',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          数据源
        </Typography>
        
        {dataSource.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            从左侧拖拽节点到此处
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {dataSource.map((item, index) => (
              <DataSourceItem 
                key={index} 
                item={item} 
                index={index} 
                onRemove={handleRemoveFromDataSource}
              />
            ))}
          </Box>
        )}
        
        {isOver && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              zIndex: 1,
            }}
          >
            <Typography variant="h6" color="primary">
              释放以将项目添加到数据源
            </Typography>
          </Box>
        )}
      </Box>

      {/* 确认移除对话框 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelRemove}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">确认移除</DialogTitle>
        <DialogContent>
          <Typography>您确定要从数据源中移除这个项目吗？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemove}>取消</Button>
          <Button onClick={handleConfirmRemove} color="error">确认移除</Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default DataSourceDropZone;