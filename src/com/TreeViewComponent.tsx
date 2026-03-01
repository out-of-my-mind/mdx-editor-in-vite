import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view';
import { Paper, Box, AlertProps } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import DraggableTreeItem, { dropPositionMode } from './TreeItemDraggable';
import AlertMessage from './AlertMessage';
import { generateUniqueId, removeTreeNode, addChildNode, calculateSortValue, insertBeforeNode, insertAfterNode } from '../utils/treeUtils';
import '../styles/TreeView.css';

interface TreeViewComponentProps {
  onDropFromDataSource?: (item: any) => void;
  onNodeRemoved?: () => void;
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
export interface TreeFolder {
  id: string;
  title: string;
  linkTxt?: string;
}
// 定义接口返回数据结构
interface ApiResponse {
  code: number;
  data: Record<string, TreeNode[]>;
  message: string;
}

// 定义组件内部状态
const TreeViewComponentReactDnd = forwardRef<any, TreeViewComponentProps>(({ onDropFromDataSource, onNodeRemoved }, ref): React.ReactNode => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as AlertProps['severity']
  });
  const fetchTreeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/vitepress/GetVitePressSidebar`);
      console.log('---------------', response)
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
          nodeArray[0].isTop = true
          allNodes.push(...nodeArray);
          collectExpanded(nodeArray);
        });
        console.log('--------------树节点-', allNodes) 
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
  const fetchRemoveTreeNode = async (note: TreeNode) => {
    setLoading(true);
    setError(null);
    try {
      console.log('移除节点', note)
      const apiUrl = note.noteId? `?id=${note.id}&isfolder=false` : `?id=${note.folderId}&isfolder=true`
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/remove_tree_node${apiUrl}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除节点失败');
    } finally {
      setLoading(false);
    }
  };
  const fetchAddTreeNode = async (note: TreeNode) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/add_tree_node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除节点失败');
    } finally {
      setLoading(false);
    }
  };
  // 添加目录节点
  const fetchAddFolderNode = async (note: TreeFolder) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/add_tree_folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加目录失败');
    } finally {
      setLoading(false);
    }
  };
  const fetchRenameNode = async (nodeId: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/rename_tree_node?nodeId=${nodeId}&name=${name}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加目录失败');
    } finally {
      setLoading(false);
    }
  };
  const fetchRenameFolder = async (note: TreeFolder) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/rename_tree_folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加目录失败');
    } finally {
      setLoading(false);
    }
  };
  // 调节节点顺序
  const fetchSortTreeNode = async (note: TreeNode) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/sort_tree_node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加目录失败');
    } finally {
      setLoading(false);
    }
  };


  // 拖拽移除树节点
  const handleDragRemoveNode = useCallback((note: TreeNode) => {
    fetchRemoveTreeNode(note).then(res => {
      if (res?.code === 200) {
        // 接口返回成功后才更新树数据
        const newTreeData = removeTreeNode(treeData, note.id);
        console.log('🌲 树节点改变 - 删除节点:', note.id, '当前树数据:', newTreeData);
        setTreeData(newTreeData);
        
        setSnackbar({ open: true, message: res?.message, severity: 'success' });
        // 通知父组件节点删除成功，刷新右侧数据源
        if (onNodeRemoved) {
          onNodeRemoved();
        }
      } else {
        setSnackbar({ open: true, message: res?.message || '接口返回失败', severity: 'error' });
      }
    });
  }, [treeData, onNodeRemoved]);
  
  // 处理添加节点到树中
  const handleAddNode = useCallback((item: any, dropnode: TreeNode, position: dropPositionMode = 'child') => {
    // 判断是树节点之间的拖拽还是数据源拖拽
    const isTreeDrag = item.source === 'tree';
    const draggedNode = isTreeDrag ? item.node : null;
    
    console.log('🌲 树节点改变 - 开始处理拖拽:', item, '目标节点:', dropnode, '位置:', position, '是否树节点拖拽:', isTreeDrag);
    
    if (isTreeDrag && draggedNode) {
      // 处理树节点之间的拖拽排序
      handleMoveNode(draggedNode, dropnode, position);
    } else {
      // 处理从数据源拖拽到树
      handleAddFromDataSource(item.item, dropnode, position);
    }
  }, [onDropFromDataSource, treeData]);

  // 处理从数据源拖拽到树
  const handleAddFromDataSource = useCallback((item: any, dropnode: TreeNode, position: dropPositionMode = 'child') => {
    const newNode: TreeNode = {
      id: generateUniqueId(),
      text: item.text || '新节点',
      link: item.link || undefined,
      items: item.items ? [...item.items] : undefined,
      folderId: dropnode.folderId,
      parent_id: dropnode.parent_id,
      noteId: item.id,
      sort: 0
    };
    console.log('🌲 树节点改变 - 开始添加节点:', item, '目标节点:', dropnode);
    
    // 计算排序值
    if (position === 'child') {
      if (dropnode.isTop) {
        newNode.parent_id = undefined;
      } else {
        newNode.parent_id = dropnode.id;
      }
      newNode.sort = calculateSortValue(dropnode);
    } else if (position === 'top') {
      newNode.sort = dropnode.sort - 0.001;
    } else if (position === 'bottom') {
      newNode.sort = dropnode.sort + 0.001;
    }
    // 调用接口添加节点
    fetchAddTreeNode(newNode).then(res => {
      console.log('🌲 树节点改变 - 接口返回:', res);
      if (res?.code === 200) {
        // 接口返回成功后才更新树数据
        setTreeData(prev => {
          let newTreeData: TreeNode[];
          if (position === 'child') {
            newTreeData = addChildNode(prev, dropnode.id, newNode);
            console.log('🌲 树节点改变 - 添加子节点完成:', newNode, '父节点ID:', dropnode.id, '当前树数据:', newTreeData);
          } else if (position === 'top') {
            newTreeData = insertBeforeNode(prev, dropnode.id, newNode);
            console.log('🌲 树节点改变 - 插入到上方:', newNode, '参考节点:', dropnode, '当前树数据:', newTreeData);
          } else if (position === 'bottom') {
            newTreeData = insertAfterNode(prev, dropnode.id, newNode);
            console.log('🌲 树节点改变 - 插入到下方:', newNode, '参考节点:', dropnode, '当前树数据:', newTreeData);
          } else {
            newTreeData = prev;
          }
          return newTreeData;
        });
        setSnackbar({ open: true, message: res?.message, severity: 'success' });
        // 通知父组件数据源项目已被使用
        if (onDropFromDataSource) {
          onDropFromDataSource(item);
        }
      } else {
        setSnackbar({ open: true, message: res?.message || '接口返回失败', severity: 'error' });
      }
    }).catch(err => {
      console.error('🌲 树节点改变 - 接口调用失败:', err);
      setSnackbar({ open: true, message: err instanceof Error ? err.message : '接口调用失败', severity: 'error' });
    });
  }, [onDropFromDataSource, treeData]);

  // 处理树节点之间的移动
  const handleMoveNode = useCallback((draggedNode: TreeNode, dropnode: TreeNode, position: dropPositionMode = 'bottom') => {
    // 不能将节点移动到自己的子节点中
    const isDescendant = (parent: TreeNode, childId: string): boolean => {
      if (parent.id === childId) return true;
      if (parent.items) {
        return parent.items.some(item => isDescendant(item, childId));
      }
      return false;
    };

    if (isDescendant(draggedNode, dropnode.id)) {
      setSnackbar({ open: true, message: '不能将节点移动到自己的子节点中', severity: 'error' });
      return;
    }

    // 更新节点信息
    const updatedNode = { ...draggedNode };
    
    // 计算新的父节点和排序值
    if (position === 'top') {
      updatedNode.folderId = dropnode.folderId
      updatedNode.parent_id = dropnode.parent_id;
      updatedNode.sort = dropnode.sort - 0.001;
    } else if (position === 'bottom') {
      updatedNode.folderId = dropnode.folderId
      updatedNode.parent_id = dropnode.parent_id;
      updatedNode.sort = dropnode.sort + 0.001;
    }
    console.log('🌲 树节点改变 - 移动节点:', draggedNode, '目标节点:', dropnode, '位置:', position, '更新后的节点:', updatedNode);
    // 调接口
    fetchSortTreeNode(updatedNode).then(res => {
      console.log('🌲 树节点改变 - 接口返回:', res);
      if (res?.code === 200) {
        // 先从原位置移除节点
        const treeWithoutDraggedNode = removeTreeNode(treeData, draggedNode.id);
        // 将节点插入到新位置
        let newTreeData: TreeNode[];
        if (position === 'top') {
          newTreeData = insertBeforeNode(treeWithoutDraggedNode, dropnode.id, updatedNode);
        } else if (position === 'bottom') {
          newTreeData = insertAfterNode(treeWithoutDraggedNode, dropnode.id, updatedNode);
        } else {
          newTreeData = treeWithoutDraggedNode;
        }
        console.log('🌲 树节点改变 - 移动节点完成:', newTreeData);
        // 更新树数据
        setTreeData(newTreeData);
        setSnackbar({ open: true, message: res?.message || '节点移动成功', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: res?.message || '接口返回失败', severity: 'error' });
      }
    }).catch(err => {
      console.error('🌲 树节点改变 - 接口调用失败:', err);
      setSnackbar({ open: true, message: err instanceof Error ? err.message : '接口调用失败', severity: 'error' });
    });
  }, [treeData]);

  useImperativeHandle(ref, () => ({
    handleDragRemoveNode,
    handleAddNode,
    handleMoveNode
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
                <DraggableTreeItem 
                  key={node.id} 
                  node={node} 
                  onDrop={handleAddNode}
                  setTreeData={setTreeData}
                  setSnackbar={setSnackbar}
                  fetchRemoveTreeNode={fetchRemoveTreeNode}
                  fetchAddFolderNode={fetchAddFolderNode}
                  fetchAddTreeNode={fetchAddTreeNode}
                  fetchRenameFolder={fetchRenameFolder}
                  fetchRenameNode={fetchRenameNode}
                />
              ))}
            </SimpleTreeView>
          )}
        </Box>
      </Paper>
      {snackbar.open && (
        <AlertMessage
          message={snackbar.message}
          severity={snackbar.severity}
        />
      )}
    </>
  );
});

TreeViewComponentReactDnd.displayName = 'TreeViewComponentReactDnd';

export default TreeViewComponentReactDnd;