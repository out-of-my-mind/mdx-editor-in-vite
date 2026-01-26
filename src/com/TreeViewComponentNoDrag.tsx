import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view';
import { Paper, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItemNoDrag from './TreeItemNoDrag';

import '../styles/TreeView.css';

interface TreeViewComponentProps {
  onNodeClick?: (node: TreeNode) => void;
}

// 定义书签树节点的数据结构
export interface TreeNode {
  id: string;
  isTop?: boolean;
  text: string;
  items?: TreeNode[];
  link?: string;
  collapsed?: string;
  link_txt?: string;
  folderId: string;
  noteId?: string;
  parent_id?: string;
  sort: number;
}

// 定义接口返回数据结构
interface ApiResponse {
  code: number;
  data: Record<string, TreeNode[]>;
  message: string;
}

// 定义组件内部状态
const TreeViewComponentNoDrag = forwardRef<any, TreeViewComponentProps>(({ onNodeClick }, ref): React.ReactNode => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
        const expanded: string[] = [];
        
        const collectExpanded = (nodes: TreeNode[]) => {
          nodes.forEach(node => {
            if (node.collapsed === 'false') {
              expanded.push(node.id);
            }
            if (node.items) {
              collectExpanded(node.items);
            }
          });
        };
        
        Object.values(result.data).forEach(nodeArray => {
          nodeArray[0].isTop = true;
          allNodes.push(...nodeArray);
          collectExpanded(nodeArray);
        });
        
        setTreeData(allNodes);
        setExpandedItems(expanded);
      } else {
        throw new Error(result.message || '接口返回失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    // 查看页面树节点无操作功能
  }));

  // 使用useEffect钩子在组件挂载时调用接口
  useEffect(() => {
    fetchTreeData();
  }, []);

  return (
    <>
      <Paper className='tree-view-paper' elevation={0}>
        <Box className='tree-view-box'>
          {loading ? (
            <Box sx={{ p: 2 }}>加载中...</Box>
          ) : error ? (
            <Box sx={{ p: 2, color: 'error.main' }}>错误：{error}</Box>
          ) : (
            <SimpleTreeView
              aria-label="书签树"
              defaultExpandedItems={expandedItems}
              slots={{
                collapseIcon: ExpandMoreIcon,
                expandIcon: ChevronRightIcon,
              }}
            >
              {treeData.map((node) => (
                <TreeItemNoDrag 
                  key={node.id} 
                  node={node} 
                  onNodeClick={onNodeClick}
                />
              ))}
            </SimpleTreeView>
          )}
        </Box>
      </Paper>
    </>
  );
});

TreeViewComponentNoDrag.displayName = 'TreeViewComponentNoDrag';

export default TreeViewComponentNoDrag;