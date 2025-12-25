import React, { useState, useEffect } from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { Paper, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import '../styles/TreeView.css';

// 定义书签树节点的数据结构
interface TreeNode {
  id: string;
  text: string;
  items?: TreeNode[];
  link?: string;
  collapsed?: string;
}

// 定义接口返回数据结构
interface ApiResponse {
  code: number;
  data: Record<string, TreeNode[]>;
  message: string;
}

// 定义组件内部状态
const TreeViewComponent: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 递归渲染TreeItem的组件
  const TreeItemRenderer: React.FC<{ node: TreeNode }> = ({ node }) => {
    // 根据是否有子节点或链接来判断节点类型
    const isFolder = !!node.items;
    const isBookmark = !!node.link;
    
    return (
      <TreeItem
        itemId={node.id}
        label={
          <React.Fragment>
            {isFolder ? (
              <FolderIcon sx={{ mr: 1 }} />
            ) : (
              <BookmarkIcon sx={{ mr: 1 }} />
            )}
            {node.text}
          </React.Fragment>
        }
        // 设置初始展开/折叠状态
        // defaultExpanded={node.collapsed === 'false'}
      >
        {node.items?.map((childNode) => (
          <TreeItemRenderer key={childNode.id} node={childNode} />
        ))}
      </TreeItem>
    );
  };

  // 从接口获取树数据的函数
  const fetchTreeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/vitepress/GetVitePressSidebar`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      
      // 检查接口返回是否成功
      if (result.code === 200) {
        // 将 data 对象中的所有树节点数组合并为一个数组
        const allNodes: TreeNode[] = [];
        Object.values(result.data).forEach(nodeArray => {
          allNodes.push(...nodeArray);
        });
        setTreeData(allNodes);
      } else {
        throw new Error(result.message || '接口返回失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 使用useEffect钩子在组件挂载时调用接口
  useEffect(() => {
    fetchTreeData();
  }, []);
  return (
    <Paper className='tree-view-paper' elevation={0} >
      <Box className='tree-view-box'>
        {loading ? (
          <Box sx={{ p: 2 }}>加载中...</Box>
        ) : error ? (
          <Box sx={{ p: 2, color: 'error.main' }}>错误：{error}</Box>
        ) : (
          <SimpleTreeView
            aria-label="书签树"
            slots={{
              collapseIcon: ExpandMoreIcon,
              expandIcon: ChevronRightIcon,
            }}
          >
            {treeData.map((node) => (
              <TreeItemRenderer key={node.id} node={node} />
            ))}
          </SimpleTreeView>
        )}
      </Box>
    </Paper>
  );
};

export default TreeViewComponent;