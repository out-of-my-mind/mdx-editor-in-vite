import React from 'react';
import { Box, Typography } from '@mui/material';
import { TreeItem } from '@mui/x-tree-view';
import FolderIcon from '@mui/icons-material/Folder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { TreeNode } from './TreeViewComponent';

// 定义组件接口
interface TreeItemNoDragProps {
  node: TreeNode;
}

// 无拖拽功能的树节点组件
const TreeItemNoDrag: React.FC<TreeItemNoDragProps> = ({
  node
}) => {
  const isFolder = !!node.items;

  // 处理节点点击
  const handleNodeClick = () => {
    console.log('点击节点:', node);
  };

  return (
    <>
      <TreeItem
        itemId={node.id}
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '4px 0',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
            onClick={handleNodeClick}
          >
            {isFolder ? (
              <FolderIcon fontSize="small" />
            ) : (
              <BookmarkIcon fontSize="small" />
            )}
            <Typography variant="body2">
              {node.text}
            </Typography>
          </Box>
        }
      >
        {node.items?.map((childNode) => (
          <TreeItemNoDrag
            key={childNode.id}
            node={childNode}
          />
        ))}
      </TreeItem>
    </>
  );
};

export default TreeItemNoDrag;