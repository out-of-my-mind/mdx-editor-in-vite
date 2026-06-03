const TOKEN_KEY = 'auth_token';

// 存储 token
export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// 获取 token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// 删除 token（登出）
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// 检查是否已登录
export const isAuthenticated = () => {
  return !!getToken();
};
