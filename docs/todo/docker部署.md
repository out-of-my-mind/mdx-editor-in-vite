## 第一步安装 Docker
### 1. 更新软件包索引并安装依赖
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

### 2. 添加 Docker 的官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

### 3. 设置稳定版仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

### 4. 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

### 5. 启动 Docker 并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

### 6. 验证安装
sudo docker --version


## 建议安装 Docker Compose
### 下载最新版本的 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

### 授予执行权限
sudo chmod +x /usr/local/bin/docker-compose

### 创建符号链接（可选，为了在任何路径下直接使用 docker-compose 命令）
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

### 验证安装
docker-compose --version



## 第二步设置环境
### 将当前用户加入docker组，这样就不必每次都使用sudo
```
sudo groupadd docker
sudo usermod -aG docker $USER
# 需要重新登录用户使配置生效
```
### 配置镜像源
```
/etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://registry.docker-cn.com"
  ]
}
```

### 检查容器是否运行
```
docker ps
# 查看全部容器
docker ps -a
```

### 检查容器端口映射
docker port custom-svn

### 检查服务是否监听所有接口
netstat -tlnp | grep :80
netstat -tlnp | grep :3690

### 在容器内安装 netstat
docker exec -it custom-svn apt-get install -y net-tools
### 安装 curl
docker exec -it custom-svn apt-get update && apt-get install -y curl



### 重启 Docker 服务
```
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 清理未完成的镜像
sudo docker system prune -f



### 获取宿主机在 Docker 网络中的 IP
查看 Docker 默认网桥网关 IP   
ip addr show docker0 | grep inet   
通常为 172.17.0.1 或 172.18.0.1    

或使用
docker network inspect bridge | grep Gateway


### 查看容器IP
docker inspect <容器名 >