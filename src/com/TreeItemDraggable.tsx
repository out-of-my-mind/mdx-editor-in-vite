import React, { useState } from 'react';
import { Box, Typography, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { TreeItem } from '@mui/x-tree-view';
import FolderIcon from '@mui/icons-material/Folder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AddIcon from '@mui/icons-material/Add';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { useDrag, useDrop } from 'react-dnd';
import { TreeNode, TreeFolder } from './TreeViewComponent';
import { generateUniqueId, calculateSortValue, renameTreeNode } from '../utils/treeUtils';

// 定义组件接口
interface DraggableTreeItemProps {
  node: TreeNode;
  onDrop: (item: any, dropnode: TreeNode, position: dropPositionMode) => void;
  setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  setSnackbar: (snackbar: { open: boolean; message: string; severity: 'success' | 'error' }) => void;
  fetchRemoveTreeNode: (note: TreeNode) => Promise<any>;
  fetchAddFolderNode: (note: TreeFolder) => Promise<any>;
  fetchAddTreeNode: (note: TreeNode) => Promise<any>;
  fetchRenameFolder: (note: TreeFolder) => Promise<any>;
  fetchRenameNode: (nodeId: string, name: string) => Promise<any>;
}

// 定义类型
export type dialogmode = 'child' | 'sibling' | 'rename';
export type dropPositionMode = 'top' | 'bottom' | 'child' | null;

// 可拖拽和可放置的树节点组件
const DraggableTreeItem: React.FC<DraggableTreeItemProps> = ({
  node,
  onDrop,
  setTreeData,
  setSnackbar,
  fetchRemoveTreeNode,
  fetchAddFolderNode,
  fetchAddTreeNode,
  fetchRenameFolder,
  fetchRenameNode
}) => {
  const isFolder = !node.noteId;
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nodeName, setNodeName] = useState<{ title?: string, link_txt?: string }>({ title: '' });
  
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
    accept: ['data_source_item', 'tree_node'],
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
      
      // 如果是树节点之间的拖拽，只允许在节点之间插入，不允许添加为子节点
      if (item.source === 'tree') {
        if (hoverClientY < hoverMiddleY - 10) {
          setDropPosition('top');
        } else if (hoverClientY > hoverMiddleY + 10) {
          setDropPosition('bottom');
        } else {
          setDropPosition('bottom');
        }
      } else if (item.source === 'datasource') {
        // 如果是数据源拖拽，可以添加为子节点
        if(!node.link){
          setDropPosition('child');
        } else if (hoverClientY < hoverMiddleY - 10) {
          setDropPosition('top');
        } else if (hoverClientY > hoverMiddleY + 10) {
          setDropPosition('bottom');
        } else  {
          setDropPosition('bottom')
        }
      }
    },
    drop: (item: any, monitor) => {
      const position = dropPosition || null;
      console.log('🎯 拖拽位置:', position, '目标节点:', node.id, '来源:', item.source);
      
      if (item.source === 'datasource') {
        onDrop(item, node, position);
      } else if (item.source === 'tree') {
        onDrop(item, node, position);
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

  // 处理删除节点
  const handleRemoveNode = () => {
    const removeNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter(n => n.id !== node.id)
        .map(n => {
          if (n.items) {
            const newItems = removeNode(n.items);
            if (newItems !== n.items) {
              return { ...n, items: newItems };
            }
          }
          return n;
        });
    };
    
    fetchRemoveTreeNode(node).then(res => {
      console.log('🌲 树节点改变 - 接口返回:', res);
      if (res?.code === 200) {
        setTreeData(prev => {
          const newTreeData = removeNode(prev);
          console.log('🌲 树节点改变 - 删除节点:', node.id, '当前树数据:', newTreeData);
          return newTreeData;
        });
        setSnackbar({ open: true, message: res?.message, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: res?.message || '接口返回失败', severity: 'error' });
      }
    }).catch(err => {
      console.error('🌲 树节点改变 - 接口调用失败:', err);
      setSnackbar({ open: true, message: err instanceof Error ? err.message : '接口调用失败', severity: 'error' });
    });
  }
  // 打开弹窗
  const handleOpenDialog = (type: dialogmode) => {
    setDialogType(type);
    console.log('打开弹窗，点击节点', node)
    setNodeName(type === 'rename' ? { title: node.text, link_txt: node.link_txt || '' } : {  });
    setDialogOpen(true);
    handleClose();
  };
  // 确认节点
  const handleConfirmAddNode = () => {
    console.log('确认添加节点', nodeName);
    if (!nodeName.title || !nodeName.title.trim() || (dialogType !== 'child' && node.isTop && (!nodeName.link_txt || !nodeName.link_txt.trim()))) {
      return;
    }
    const newNode: TreeNode = {
      id: generateUniqueId(),
      text: nodeName.title.trim(),
      items: [],
      link: nodeName.link_txt || undefined,
      folderId: node.folderId,
      parent_id: node.parent_id,
      sort: 0
    };
    const newFolder: TreeFolder = {
      id: generateUniqueId(),
      title: nodeName.title.trim(),
      linkTxt: nodeName.link_txt || undefined,
    };
    if (dialogType === 'child') { // 添加子节点
      const addChild = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(n => {
          if (n.id === node.id) {
            if (n.isTop) {
              newNode.parent_id = undefined;
            } else {
              newNode.parent_id = n.id;
            }
            newNode.sort = calculateSortValue(n);
            fetchAddTreeNode(newNode).then(res => {
              if (res?.code === 200) {
                setSnackbar({ open: true, message: res?.message, severity: 'success' });
              } else {
                setSnackbar({ open: true, message: res?.message || '接口返回失败', severity: 'error' });
              }
            }).catch(err => {
              console.error('🌲 树节点改变 - 接口调用失败:', err);
              setSnackbar({ open: true, message: err instanceof Error ? err.message : '接口调用失败', severity: 'error' });
            });
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
    } else if(dialogType === 'sibling'){ // 添加同级节点
      const addSibling = (nodes: TreeNode[]): TreeNode[] => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === node.id) { // 在当前节点后插入同级节点
            const newNodes = [...nodes];
            newNode.sort = Number(nodes[i].sort) + 0.001;
            if (node.isTop) { // 添加根目录
              console.log('添加根目录');
              fetchAddFolderNode(newFolder).then(res => {
                if (res?.code === 200) {
                  newNodes.splice(i + 1, 0, newNode);
                  setSnackbar({ open: true, message: res?.message, severity: 'success' });
                } else {
                  setSnackbar({ open: true, message: res?.message || '接口返回失败', severity: 'error' });
                }
              }).catch(err => {
                console.error('🌲 树节点改变 - 接口调用失败:', err);
                setSnackbar({ open: true, message: err instanceof Error ? err.message : '接口调用失败', severity: 'error' });
              });
            } else { 
              console.log('这次只是移动顺序', nodeName, node);
              fetchAddTreeNode(newNode).then(res => {
                if (res?.code === 200) {
                  newNodes.splice(i + 1, 0, newNode);
                  setSnackbar({ open: true, message: res?.message, severity: 'success' });
                } else {
                  setSnackbar({ open: true, message: res?.message || '接口返回失败', severity: 'error' });
                }
              }).catch(err => {
                console.error('🌲 树节点改变 - 接口调用失败:', err);
                setSnackbar({ open: true, message: err instanceof Error ? err.message : '接口调用失败', severity: 'error' });
              });
            }
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
    } else if(dialogType === 'rename'){ // 重命名节点
      if (node.isTop) {
        fetchRenameFolder({
          id: node.id,
          title: nodeName.title.trim(),
          linkTxt: nodeName.link_txt || undefined,
        }).then(res => {
          if (res?.code === 200) {
            setTreeData(prev => {
              const newTreeData = renameTreeNode(prev, node.id, newNode.text);
              console.log('🌲 树节点改变 - 右键添加同级节点:', newNode, '参考节点ID:', node.id, '当前树数据:', newTreeData);
              return newTreeData;
            });
            setSnackbar({ open: true, message: res?.message, severity: 'success' });
          } else {
            setSnackbar({ open: true, message: res?.message || '接口返回失败', severity: 'error' });
          }
        }).catch(err => {
          console.error('🌲 树节点改变 - 接口调用失败:', err);
          setSnackbar({ open: true, message: err instanceof Error ? err.message : '接口调用失败', severity: 'error' });
        });
      } else {
        fetchRenameNode(node.id, nodeName.title.trim()).then(res => {
          if (res?.code === 200) {
            setTreeData(prev => {
              const newTreeData = renameTreeNode(prev, node.id, newNode.text);
              console.log('🌲 树节点改变 - 右键添加同级节点:', newNode, '参考节点ID:', node.id, '当前树数据:', newTreeData);
              return newTreeData;
            });
            setSnackbar({ open: true, message: res?.message, severity: 'success' });
          } else {
            setSnackbar({ open: true, message: res?.message || '接口返回失败', severity: 'error' });
          }
        }).catch(err => {
         setSnackbar({ open: true, message: err instanceof Error ? err.message : '接口调用失败', severity: 'error' });
        })
      }
      setDialogOpen(false);
      setNodeName({ });
    }
  }
  // 关闭弹窗
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNodeName({ });
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
          <DraggableTreeItem 
            key={childNode.id} 
            node={childNode} 
            onDrop={onDrop}
            setTreeData={setTreeData}
            setSnackbar={setSnackbar}
            fetchRemoveTreeNode={fetchRemoveTreeNode}
            fetchAddFolderNode={fetchAddFolderNode}
            fetchAddTreeNode={fetchAddTreeNode}
            fetchRenameFolder={fetchRenameFolder}
            fetchRenameNode={fetchRenameNode}
          />
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
        {isFolder && (
          <MenuItem onClick={() => handleOpenDialog('child')}>
            <AddIcon sx={{ mr: 1 }} />
            添加子节点
          </MenuItem>
        )}
        {isFolder && (
          <MenuItem onClick={() => handleOpenDialog('sibling')}>
            <AddIcon sx={{ mr: 1 }} />
            添加同级节点
          </MenuItem>
        )}
        <MenuItem onClick={() => handleOpenDialog('rename')}>
          <DriveFileRenameOutlineIcon sx={{ mr: 1 }} />
          重命名
        </MenuItem>
        <MenuItem onClick={() => handleRemoveNode()}>
          <DriveFileRenameOutlineIcon sx={{ mr: 1 }} />
          删除
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
            value={nodeName.title || ''}
            onChange={(e) => setNodeName({...nodeName, title: e.target.value})}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirmAddNode();
              }
            }}
          />
          {((dialogType === 'sibling' || dialogType === 'rename') && node.isTop) && (<TextField
            autoFocus
            margin="dense"
            label="链接名"
            type="text"
            fullWidth
            variant="outlined"
            value={nodeName.link_txt || ''}
            onChange={(e) => setNodeName({...nodeName, link_txt: e.target.value})}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirmAddNode();
              }
            }}
          />)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button 
            onClick={handleConfirmAddNode} 
            variant="contained"
            disabled={!nodeName?.title && Boolean(node.parent_id ? !nodeName?.link_txt : nodeName.link_txt)}
          >
            确认
          </Button>
        </DialogActions>
      </Dialog>
     </>
  );
};

export default DraggableTreeItem;