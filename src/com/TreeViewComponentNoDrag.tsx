import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view';
import { Paper, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItemNoDrag from './TreeItemNoDrag';

import '../styles/TreeView.css';
import axiosInstance from '../api/axiosInstance';

interface TreeViewComponentProps {
  onNodeClick?: (node: TreeNode) => void;
  onDataLoaded?: () => void;
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
const TreeViewComponentNoDrag = forwardRef<any, TreeViewComponentProps>(({ onNodeClick, onDataLoaded }, ref): React.ReactNode => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const hasFetched = useRef(false);

  const fetchTreeData = async () => {
    if (hasFetched.current) return;
    setLoading(true);
    setError(null);
    const expanded: string[] = [];
    try {
      const result: ApiResponse = await axiosInstance.get('/vitepress/GetVitePressSidebar');
      // 检查接口返回是否成功
      if (result.code === 200) {
        // 将 data 对象中的所有树节点数组合并为一个数组
        const allNodes: TreeNode[] = [];
        const collectExpanded = (nodes: TreeNode[]) => {
          nodes.forEach(node => {
            if (node.collapsed === 'false') {
              console.log('expanded');
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
       
      } else {
        throw new Error(result.message || '接口返回失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
      onDataLoaded?.();
      setExpandedItems(prev => [...new Set([...prev, ...expanded])]);
    }
  };

  // 在树数据中查找节点
  const findNode = (nodes: TreeNode[], nodeId: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId || node.noteId === nodeId) {
        return node;
      }
      if (node.items) {
        const found = findNode(node.items, nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  // 查找节点的所有祖先节点ID（用于展开）
  const findAncestors = (nodes: TreeNode[], targetId: string, ancestors: string[] = []): string[] | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return ancestors;
      }
      if (node.items) {
        const result = findAncestors(node.items, targetId, [...ancestors, node.id]);
        if (result !== null) {
          return result;
        }
      }
    }
    return null;
  };

  useImperativeHandle(ref, () => ({
    selectNode: (nodeId: string) => {
      const node = findNode(treeData, nodeId);
      if (node && onNodeClick) {
        // 查找并展开所有祖先节点
        const ancestors = findAncestors(treeData, node.id) || [];
        setExpandedItems(prev => {
          const newExpanded = [...new Set([...prev, ...ancestors])];
          return newExpanded;
        });
        onNodeClick(node);
      }
    }
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
              expandedItems={expandedItems}
              onExpandedItemsChange={(_event, expanded) =>{
                console.log('onExpandedItemsChange 触发, 新值:', expanded);
                setExpandedItems(expanded);
              }}
              onItemClick={(_event, itemId) => {
                const clickedNode = findNode(treeData, itemId);
                if (clickedNode && onNodeClick) {
                  onNodeClick(clickedNode);
                }
              }}
              slots={{
                collapseIcon: ExpandMoreIcon,
                expandIcon: ChevronRightIcon,
              }}
            >
              {treeData.map((node) => (
                <TreeItemNoDrag 
                  key={node.id} 
                  node={node} 
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
