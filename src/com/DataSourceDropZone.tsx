import React, { useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useDrag, useDrop } from 'react-dnd';
import '../styles/TreeView.css';

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
      <Typography variant="body1">{item.title}</Typography>
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
    }
  }));
  // 处理从数据源移除项目
  const handleRemoveFromDataSource = (id: string) => {
    setDataSource(prev => {
      const newDataSource = prev.filter((item) => item.id !== id);
      console.log('📦 数据源改变 - 移除项目:', id, '当前数据源:', newDataSource);
      return newDataSource;
    });
  };

  return (
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
  );
});

export default DataSourceDropZone;