import { TreeNode } from '../com/TreeViewComponent';

// 生成唯一ID
export const generateUniqueId = (): string => {
  return crypto.randomUUID();
};

// 递归查找树节点
export const findTreeNode = (nodes: TreeNode[], nodeId: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.items) {
      const found = findTreeNode(node.items, nodeId);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// 递归修改树节点
export const updateTreeNode = (
  nodes: TreeNode[],
  nodeId: string,
  updateFn: (node: TreeNode) => TreeNode
): TreeNode[] => {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return updateFn(node);
    }
    if (node.items) {
      return {
        ...node,
        items: updateTreeNode(node.items, nodeId, updateFn)
      };
    }
    return node;
  });
};

// 递归添加子节点
export const addChildNode = (
  nodes: TreeNode[],
  parentId: string,
  newNode: TreeNode
): TreeNode[] => {
  return nodes.map(node => {
    if (node.id === parentId) {
      return {
        ...node,
        items: [...(node.items || []), newNode]
      };
    }
    if (node.items) {
      return {
        ...node,
        items: addChildNode(node.items, parentId, newNode)
      };
    }
    return node;
  });
};

// 递归添加同级节点（插入到参考节点之后）
export const addSiblingNode = (
  nodes: TreeNode[],
  referenceId: string,
  newNode: TreeNode
): TreeNode[] => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === referenceId) {
      const newNodes = [...nodes];
      newNodes.splice(i + 1, 0, newNode);
      return newNodes;
    }
    if (nodes[i].items) {
      const newItems = addSiblingNode(nodes[i].items!, referenceId, newNode);
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

// 递归插入节点到参考节点之前
export const insertBeforeNode = (
  nodes: TreeNode[],
  referenceId: string,
  newNode: TreeNode
): TreeNode[] => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === referenceId) {
      const newNodes = [...nodes];
      newNodes.splice(i, 0, newNode);
      return newNodes;
    }
    if (nodes[i].items) {
      const newItems = insertBeforeNode(nodes[i].items!, referenceId, newNode);
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

// 递归插入节点到参考节点之后
export const insertAfterNode = (
  nodes: TreeNode[],
  referenceId: string,
  newNode: TreeNode
): TreeNode[] => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === referenceId) {
      const newNodes = [...nodes];
      newNodes.splice(i + 1, 0, newNode);
      return newNodes;
    }
    if (nodes[i].items) {
      const newItems = insertAfterNode(nodes[i].items!, referenceId, newNode);
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

// 递归删除树节点
export const removeTreeNode = (nodes: TreeNode[], nodeId: string): TreeNode[] => {
  return nodes
    .filter(node => node.id !== nodeId)
    .map(node => {
      if (node.items) {
        const newItems = removeTreeNode(node.items, nodeId);
        if (newItems !== node.items) {
          return { ...node, items: newItems };
        }
      }
      return node;
    });
};

// 递归重命名树节点
export const renameTreeNode = (
  nodes: TreeNode[],
  nodeId: string,
  newText: string
): TreeNode[] => {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        text: newText
      };
    }
    if (node.items) {
      return {
        ...node,
        items: renameTreeNode(node.items, nodeId, newText)
      };
    }
    return node;
  });
};

// 计算新节点的排序值
export const calculateSortValue = (
  referenceNode: TreeNode
): number => {
  if (referenceNode.items && referenceNode.items.length > 0) {
    return referenceNode.items[referenceNode.items.length - 1].sort + 0.0001;
  }
  return referenceNode.sort + 0.0001;
};
