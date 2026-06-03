import React, { useRef, useState, useEffect } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import TreeViewComponentNoDrag from '../com/TreeViewComponentNoDrag';
import { TreeNode } from '../com/TreeViewComponent';
import Note from "./Note";
import { useLocation } from 'react-router-dom';

// 主组件
const View: React.FC = () => {
  const treeViewRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const location = useLocation();

  // 处理节点点击事件
  const handleNodeClick = (node: TreeNode) => {
    console.log('View页面 - 节点被点击:', node);
    setSelectedNode(node);
  };

  // 树数据加载完成回调
  const handleDataLoaded = () => {
    setDataLoaded(true);
  };

  // 从路由状态获取 nodeId 并自动选中
  useEffect(() => {
    const nodeId = location.state?.nodeId;
    if (nodeId && dataLoaded && treeViewRef.current) {
      treeViewRef.current?.selectNode(nodeId); // 触发了 onNodeClick 事件
    }
  }, [location.state, dataLoaded]);
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
      <Paper elevation={2} sx={{ width: '240px', padding: '16px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          文档树
        </Typography>
        <TreeViewComponentNoDrag 
          key="tree-view-nodrag"  // 添加固定 key，确保组件不会被重新渲染
          ref={treeViewRef} 
          onNodeClick={handleNodeClick}
          onDataLoaded={handleDataLoaded}
        />
      </Paper>

      {/* 右侧记录页面区域 */}
      <Paper elevation={2} sx={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        {
          selectedNode?.noteId ? <Note nodeId={selectedNode?.noteId} /> : null
        }
      </Paper>
    </Box>
  );
};

export default View;