import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TreeViewComponentReactDnd from '../com/TreeViewComponent'
import DataSourceDropZone from '../com/DataSourceDropZone'

// 定义拖拽项类型
const ItemTypes = {
  TREE_NODE: 'tree_node',
  DATA_SOURCE_ITEM: 'data_source_item'
};
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
// 树根放置区域（用于从数据源拖拽到树根空白区域）
const TreeRootDropZone: React.FC<{ 
  onDrop: (item: any) => void;
  children: React.ReactNode;
}> = ({ onDrop, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['data_source_item'],
    drop: (item: any) => {
      if (item.source === 'datasource') {
        onDrop(item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDrop]);

  return (
    <Box
      sx={{
        // minHeight: '400px',
        flex: '1',
        border: '2px dashed #ccc',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        padding: '16px',
        position: 'relative',
      }}
    >
      {/* 树根放置区域 - 只覆盖空白区域 */}
      <Box
        ref={drop}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: isOver ? '2px solid #1976d2' : 'none',
          borderRadius: '8px',
          backgroundColor: isOver ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
          transition: 'all 0.2s ease',
          zIndex: 0, // 较低层级，不干扰树节点
        }}
      />
      
      {/* 树组件 - 在放置区域之上 */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
      
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
            zIndex: 0, // 较低层级
          }}
        >
          <Typography variant="h6" color="primary">
            释放以将项目添加到树根
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// 主组件
const SortingReactDnd: React.FC = () => {
  const [dataSource, setDataSource] = useState<any[]>([]);
  const treeViewRef = useRef<any>(null);

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

  // 处理从树拖拽到数据源
  const handleDropToDataSource = (node: any) => {
    setDataSource(prev => [...prev, node]);
    // 可选：从树中移除节点
    if (treeViewRef.current && node.id) {
      treeViewRef.current.handleRemoveNode(node.id);
    }
  };

  // 处理从数据源拖拽到树根
  const handleDropToTreeRoot = (item: any) => {
    console.log('树根', item);
    // 从数据源移除项目
    setDataSource(prev => prev.filter((_, i) => i !== item.index));
    // 将项目添加到树根
    if (treeViewRef.current) {
      treeViewRef.current.handleAddNode(item.item);
    }
  };

  // 处理从数据源拖拽到具体树节点
  const handleDropToTreeNode = (item: any) => {
    // 根据项目内容从数据源中移除对应的项目
    setDataSource(prev => prev.filter(dataItem => dataItem !== item));
  };

  // 处理从数据源移除项目
  const handleRemoveFromDataSource = (index: number) => {
    setDataSource(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 76px)', padding: '16px', gap: '16px' }}>
        {/* 左侧树区域 */}
        <Paper elevation={2} sx={{ width: '300px', padding: '16px', overflow: 'auto', display: 'flex', 'flex-direction': 'column' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            文档树
          </Typography>
          <TreeRootDropZone onDrop={handleDropToTreeRoot}>
            <TreeViewComponentReactDnd 
              ref={treeViewRef} 
              onDropFromDataSource={handleDropToTreeNode}
            />
          </TreeRootDropZone>
        </Paper>

        {/* 右侧数据源区域 */}
        <Paper elevation={2} sx={{ flex: 1, padding: '16px', overflow: 'auto' }}>
          <DataSourceDropZone 
            dataSource={dataSource}
            onDrop={handleDropToDataSource}
            onRemove={handleRemoveFromDataSource}
          />
        </Paper>
      </Box>
    </DndProvider>
  );
};

export default SortingReactDnd;