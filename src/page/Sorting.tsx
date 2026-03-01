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

// 树根放置区域（用于从数据源拖拽到树根空白区域）
const TreeRootDropZone: React.FC<{ 
  onDrop: (item: any) => void;
  children: React.ReactNode;
}> = ({ onDrop, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['data_source_item'],
    drop: (item: any) => {
      console.log('-----------------拖拽项:', item);
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
      {/* <Box
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
      /> */}
      
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
  const treeViewRef = useRef<any>(null);
  const dataSourceRef = useRef<any>(null);
  // 处理从树拖拽到数据源
  const handleDropToDataSource = (node: any) => {
    console.log('📦 数据源改变 - 从树拖拽添加项目:', node);
    dataSourceRef.current.handleSetDataSource(prev => {
      const newDataSource = [...prev, node];
      return newDataSource;
    });
    // 可选：从树中移除节点
    if (treeViewRef.current && node.id) {
      treeViewRef.current.handleDragRemoveNode(node);
    }
  };

  // 处理从数据源拖拽到树根
  const handleDropToTreeRoot = (item: any) => {
    console.log('📦 数据源改变 - 从数据源拖拽到树根:', item);
    // 从数据源移除项目
    dataSourceRef.current.handleSetDataSource(prev => {
      const newDataSource = prev.filter((_, i) => i !== item.node.index);
      // console.log('📦 数据源改变 - 移除项目后当前数据源:', newDataSource);
      return newDataSource;
    });
    // 将项目添加到树根
    if (treeViewRef.current) {
      treeViewRef.current.handleAddNode(item);
    }
  };

  // 处理从数据源拖拽到具体树节点
  const handleDropToTreeNode = (item: any) => {
    console.log('📦 数据源改变 - 从数据源拖拽到具体树节点:', item);
    // 根据项目内容从数据源中移除对应的项目
    dataSourceRef.current.handleSetDataSource(prev => {
      const newDataSource = prev.filter(dataItem => dataItem !== item);
      // console.log('📦 数据源改变 - 移除项目后当前数据源:', newDataSource);
      return newDataSource;
    });
  };

  // 禁用右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // 处理节点删除成功后的回调
  const handleNodeRemoved = () => {
    console.log('📦 数据源改变 - 左侧节点删除成功，刷新数据源');
    // 调用数据源组件的方法来刷新数据
    if (dataSourceRef.current) {
      dataSourceRef.current.refreshDataSource();
      console.log('📦 数据源已刷新');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box 
        sx={{ display: 'flex', height: 'calc(100vh - 76px)', padding: '16px', gap: '16px' }} 
        onContextMenu={handleContextMenu}
      >
        {/* 左侧树区域 */}
        <Paper elevation={2} sx={{ width: '300px', padding: '16px', overflow: 'auto', display: 'flex', 'flex-direction': 'column' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            文档树
          </Typography>
          <TreeRootDropZone onDrop={handleDropToTreeRoot}>
            <TreeViewComponentReactDnd 
              ref={treeViewRef} 
              onDropFromDataSource={handleDropToTreeNode}
              onNodeRemoved={handleNodeRemoved}
            />
          </TreeRootDropZone>
        </Paper>

        {/* 右侧数据源区域 */}
        <Paper elevation={2} sx={{ flex: 1, padding: '16px', overflow: 'auto' }}>
          <DataSourceDropZone 
            ref={dataSourceRef} 
            onDrop={handleDropToDataSource}
          />
        </Paper>
      </Box>
    </DndProvider>
  );
};

export default SortingReactDnd;