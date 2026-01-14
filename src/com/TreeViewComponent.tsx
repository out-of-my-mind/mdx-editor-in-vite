import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { Paper, Box, Typography, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, AlertProps } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { useDrag, useDrop } from 'react-dnd';
import AlertMessage from './AlertMessage';
import '../styles/TreeView.css';

interface TreeViewComponentProps {
  onRemoveNode?: (nodeId: string) => void;
  onDropFromDataSource?: (item: any) => void;
}

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
const TreeViewComponentReactDnd = forwardRef<any, TreeViewComponentProps>(({ onRemoveNode, onDropFromDataSource }, ref) => {
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
  const fetchRemoveTreeNode = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/remove_tree_node?id=${id}`);
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
  // 移除树节点
  const handleRemoveNode = useCallback((nodeId: string) => {
    const removeNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter(node => node.id !== nodeId)
        .map(node => {
          if (node.items) {
            const newItems = removeNode(node.items);
            if (newItems !== node.items) {
              return { ...node, items: newItems };
            }
          }
          return node;
        });
    };
    fetchRemoveTreeNode(nodeId).then(res => {
      if (res?.code === 200) {
        setSnackbar({
          open: true,
          message: res?.message,
          severity: 'success'
        });
        const newTreeData = removeNode(treeData);
        console.log('🌲 树节点改变 - 删除节点:', nodeId, '当前树数据:', newTreeData);
        setTreeData(newTreeData);
      } else {
        setSnackbar({
          open: true,
          message: res?.message || '接口返回失败',
          severity: 'error'
        });
      }
    });
  }, [treeData]);
  
  // 处理添加节点到树中
  const handleAddNode = useCallback((item: any, dropnode: TreeNode, position: 'top' | 'bottom' | 'child' = 'child') => {
    // 生成唯一ID
    const generateUniqueId = () => {
      return `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };
    
    const newNode: TreeNode = {
      id: item.id || generateUniqueId(),
      text: item.text || '新节点',
      link: item.link || undefined,
      items: item.items ? [...item.items] : undefined
    };

    if (position === 'child' && dropnode) {
      // 添加为子节点
      const addToParent = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.id === dropnode.id) {
            console.log('🌲 树节点改变 - 父节点:', node)
            newNode.link = 
            return {
              ...node,
              items: [...(node.items || []), newNode]
            };
          }
          if (node.items) {
            return {
              ...node,
              items: addToParent(node.items)
            };
          }
          return node;
        });
      };
      setTreeData(prev => {
        const newTreeData = addToParent(prev);
        console.log('🌲 树节点改变 - 添加子节点:', newNode, '父节点ID:', parentId, '当前树数据:', newTreeData);
        return newTreeData;
      });
    } else if (position === 'top' && dropnode) {
      // 插入到目标节点上方
      const insertBefore = (nodes: TreeNode[]): TreeNode[] => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === dropnode.id) {
            const newNodes = [...nodes];
            newNodes.splice(i, 0, newNode);
            return newNodes;
          }
          if (nodes[i].items) {
            const newItems = insertBefore(nodes[i].items!);
            if (newItems !== nodes[i].items) {
              return [
                ...nodes.slice(0, i),
                { ...nodes[i], items: newItems },
                ...nodes.slice(i + 1)
              ];
            }
          }
        }
        return nodes;
      };
      setTreeData(prev => {
        const newTreeData = insertBefore(prev);
        console.log('🌲 树节点改变 - 插入到上方:', newNode, '参考节点:', dropnode, '当前树数据:', newTreeData);
        return newTreeData;
      });
    } else if (position === 'bottom' && dropnode) {
      // 插入到目标节点下方
      const insertAfter = (nodes: TreeNode[]): TreeNode[] => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === dropnode.id) {
            const newNodes = [...nodes];
            newNodes.splice(i + 1, 0, newNode);
            return newNodes;
          }
          if (nodes[i].items) {
            const newItems = insertAfter(nodes[i].items!);
            if (newItems !== nodes[i].items) {
              return [
                ...nodes.slice(0, i),
                { ...nodes[i], items: newItems },
                ...nodes.slice(i + 1)
              ];
            }
          }
        }
        return nodes;
      };
      setTreeData(prev => {
        const newTreeData = insertAfter(prev);
        console.log('🌲 树节点改变 - 插入到下方:', newNode, '参考节点:', dropnode, '当前树数据:', newTreeData);
        return newTreeData;
      });
    } else {
      // 添加到根节点
      setTreeData(prev => {
        const newTreeData = [...prev, newNode];
        console.log('🌲 树节点改变 - 添加根节点:', newNode, '当前树数据:', newTreeData);
        return newTreeData;
      });
    }
    // 通知父组件数据源项目已被使用
    if (onDropFromDataSource) {
      onDropFromDataSource(item);
    }
  }, [onDropFromDataSource]);

  useImperativeHandle(ref, () => ({
    handleRemoveNode,
    handleAddNode
  }));
  type dialogmode = 'child' | 'sibling' | 'rename';
  type dropPositionMode = 'top' | 'bottom' | 'child' | null;
  // 可拖拽和可放置的树节点组件
  const DraggableTreeItem: React.FC<{ node: TreeNode; onDrop: (item: any, dropnode: TreeNode, position: dropPositionMode) => void }> = ({ node, onDrop }) => {
    const isFolder = !!node.items;
    // 右键菜单状态
    const [contextMenu, setContextMenu] = useState<{
      mouseX: number;
      mouseY: number;
    } | null>(null);
    // 弹窗状态
    const [dialogOpen, setDialogOpen] = useState(false);
    const [nodeName, setNodeName] = useState('');
    
    const [dialogType, setDialogType] = useState<dialogmode>('child');

    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'tree_node',
      item: { 
        node, 
        source: 'tree',
        nodeId: node.id 
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }), [node]);

    // 拖拽位置状态
    const [dropPosition, setDropPosition] = useState<dropPositionMode>(null);
    const dropTargetRef = React.useRef<HTMLDivElement>(null);

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: ['data_source_item'],
      hover: (item: any, monitor) => {
        if (!monitor.canDrop()) return;
        
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset || !dropTargetRef.current) return;
        
        const hoverBoundingRect = dropTargetRef.current.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        
        // 检查鼠标是否在节点边界内
        const isInside = 
          clientOffset.x >= hoverBoundingRect.left &&
          clientOffset.x <= hoverBoundingRect.right &&
          clientOffset.y >= hoverBoundingRect.top &&
          clientOffset.y <= hoverBoundingRect.bottom;
        
        if (!isInside) {
          setDropPosition(null);
          return;
        }
        
        if(!node.link){
          setDropPosition('child');
        } else if (hoverClientY < hoverMiddleY - 10) {
          setDropPosition('top');
        } else if (hoverClientY > hoverMiddleY + 10) {
          setDropPosition('bottom');
        } else  {
          setDropPosition('bottom')
        }
      },
      drop: (item: any, monitor) => {
        if (item.source === 'datasource') {
          const position = dropPosition || null;
          console.log('🎯 拖拽位置:', position, '目标节点:', node.id);
          onDrop(item.item, node, position);
        }
        setDropPosition(null);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }), [node, onDrop, dropPosition]);

    // 当鼠标离开节点时清除位置状态
    React.useEffect(() => {
      if (!isOver) {
        setDropPosition(null);
      }
    }, [isOver]);

    // 合并拖拽和放置的 ref
    const combinedRef = (element: any) => {
      drag(element);
      drop(element);
      dropTargetRef.current = element;
    };

    // 处理右键点击
    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault();
      setContextMenu(
        contextMenu === null
          ? {
              mouseX: event.clientX + 2,
              mouseY: event.clientY - 6,
            }
          : null,
      );
    };

    // 关闭右键菜单
    const handleClose = () => {
      setContextMenu(null);
    };

    // 打开弹窗
    const handleOpenDialog = (type: dialogmode) => {
      setDialogType(type);
      setNodeName(type === 'rename' ? node.text : '');
      setDialogOpen(true);
      handleClose();
    };
    // 确认节点
    const handleConfirmAddNode = () => {
      if (!nodeName.trim()) {
        return;
      }
      const newNode: TreeNode = {
        id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: nodeName.trim(),
      };

      if (dialogType === 'child') {
        // 添加子节点
        const addChild = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(n => {
            if (n.id === node.id) {
              return {
                ...n,
                items: [...(n.items || []), newNode]
              };
            }
            if (n.items) {
              return {
                ...n,
                items: addChild(n.items)
              };
            }
            return n;
          });
        };
        setTreeData(prev => {
          const newTreeData = addChild(prev);
          console.log('🌲 树节点改变 - 右键添加子节点:', newNode, '父节点ID:', node.id, '当前树数据:', newTreeData);
          return newTreeData;
        });
      } else if(dialogType === 'sibling'){
        // 添加同级节点
        const addSibling = (nodes: TreeNode[]): TreeNode[] => {
          // 找到父节点并添加同级节点
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === node.id) {
              // 在当前节点后插入同级节点
              const newNodes = [...nodes];
              newNodes.splice(i + 1, 0, newNode);
              return newNodes;
            }
            if (nodes[i].items) {
              const newItems = addSibling(nodes[i].items!);
              if (newItems !== nodes[i].items) {
                return [
                  ...nodes.slice(0, i),
                  { ...nodes[i], items: newItems },
                  ...nodes.slice(i + 1)
                ];
              }
            }
          }
          return nodes;
        };
        setTreeData(prev => {
          const newTreeData = addSibling(prev);
          console.log('🌲 树节点改变 - 右键添加同级节点:', newNode, '参考节点ID:', node.id, '当前树数据:', newTreeData);
          return newTreeData;
        });
      } else if(dialogType === 'rename'){
        // 重命名节点
        const rename = (nodes: TreeNode[]): TreeNode[] => {
          // 找到父节点并添加同级节点
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === node.id) {
              // 在当前节点后插入同级节点
              const newNodes = [...nodes];
              newNodes.splice(i, 1, {...node, text: nodeName.trim()});
              return newNodes;
            }
            if (nodes[i].items) {
              const newItems = rename(nodes[i].items!);
              if (newItems !== nodes[i].items) {
                return [
                  ...nodes.slice(0, i),
                  { ...nodes[i], items: newItems },
                  ...nodes.slice(i + 1)
                ];
              }
            }
          }
          return nodes;
        };
        setTreeData(prev => {
          const newTreeData = rename(prev);
          console.log('🌲 树节点改变 - 右键添加同级节点:', newNode, '参考节点ID:', node.id, '当前树数据:', newTreeData);
          return newTreeData;
        });
      }
      setDialogOpen(false);
      setNodeName('');
    };

    // 关闭弹窗
    const handleCloseDialog = () => {
      setDialogOpen(false);
      setNodeName('');
    };

    return (
      <>
        <TreeItem
          itemId={node.id}
          label={
            <Box
              ref={combinedRef}
              onContextMenu={handleContextMenu}
              sx={{
                cursor: 'move',
                opacity: isDragging ? 0.5 : 1,
                backgroundColor: isOver ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                border: isOver ? '2px solid #1976d2' : 'none',
                borderRadius: '4px',
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                ...(dropPosition === 'top' && {
                  borderTop: '3px solid #1976d2',
                  borderRight: 'none',
                  borderBottom: 'none',
                  borderLeft: 'none',
                }),
                ...(dropPosition === 'bottom' && {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: '3px solid #1976d2',
                  borderLeft: 'none',
                }),
                ...(dropPosition === 'child' && {
                  border: '2px solid #1976d2',
                }),
              }}
            >
              {isFolder ? (
                <FolderIcon sx={{ mr: 1 }} />
              ) : (
                <BookmarkIcon sx={{ mr: 1 }} />
              )}
              {node.text}
              {isOver && (
                <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                  {dropPosition === 'top' ? '插入到上方' : dropPosition === 'bottom' ? '插入到下方' : '添加为子节点'}
                </Typography>
              )}
            </Box>
          }
          sx={{
            position: 'relative',
          }}
        >
          {node.items?.map((childNode) => (
            <DraggableTreeItem key={childNode.id} node={childNode} onDrop={handleAddNode} />
          ))}
        </TreeItem>
        
        {/* 右键菜单 */}
        <Menu
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined}
        >
          <MenuItem onClick={() => handleOpenDialog('child')}>
            <AddIcon sx={{ mr: 1 }} />
            添加子节点
          </MenuItem>
          <MenuItem onClick={() =>handleOpenDialog('sibling')}>
            <AddIcon sx={{ mr: 1 }} />
            添加同级节点
          </MenuItem>
          <MenuItem onClick={() => handleOpenDialog('rename')}>
            <DriveFileRenameOutlineIcon sx={{ mr: 1 }} />
            重命名
          </MenuItem>
        </Menu>
        
        {/* 节点名称输入弹窗 */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {dialogType === 'child' ? '添加子节点' : (dialogType === 'sibling' ? '添加同级节点': '重命名节点')}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="节点名称"
              type="text"
              fullWidth
              variant="outlined"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmAddNode();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>取消</Button>
            <Button 
              onClick={handleConfirmAddNode} 
              variant="contained"
              disabled={!nodeName.trim()}
            >
              确认
            </Button>
          </DialogActions>
        </Dialog>
       </>
    );
  };

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
                <DraggableTreeItem key={node.id} node={node} onDrop={handleAddNode} />
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