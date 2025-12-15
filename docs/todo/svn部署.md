```
# 使用阿里云镜像
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# 更换为国内APT源
RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list


# 安装必要的软件
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl \
    apache2 \
    apache2-utils \
    libapache2-mod-svn \
    subversion

# 启用必要的Apache模块
RUN a2enmod dav_svn auth_digest

# 首先创建所有必要的目录
RUN mkdir -p /var/lock/apache2 /var/run/apache2 /var/opt/svn

# 设置目录权限
RUN chown -R www-data:www-data /var/opt/svn

# 复制Apache的SVN站点配置文件
COPY dav_svn.conf /etc/apache2/sites-available/dav_svn.conf

# 启用站点并设置权限
RUN a2dissite 000-default.conf && \
    a2ensite dav_svn.conf

# 暴露80端口
EXPOSE 80

# 启动Apache并保持在前台运行
CMD ["apache2ctl", "-D", "FOREGROUND"]
```


### 停止容器
docker stop custom-svn

### 删除宿主机上的 passwd 目录
sudo rm -rf /home/fc/docker/svn/passwd

### 重新启动容器
docker start custom-svn

### 现在添加用户 创建密码文件（应该是文件而不是目录）
```
sudo htpasswd -cb /home/fc/docker/svn/passwd root root123
# 添加新用户（不要使用 -c 参数，否则会覆盖文件）
sudo htpasswd -b /home/fc/docker/svn/passwd user1 password1
sudo htpasswd -b /home/fc/docker/svn/passwd user2 password2
```
### 查看所有用户
cat /home/fc/docker/svn/passwd


```
docker run -d \
  --name custom-svn \
  --restart unless-stopped \
  -p 80:80 \
  -p 3690:3690 \
  -v /home/fc/docker/svn/data:/var/opt/svn \
  -v /home/fc/docker/svn/passwd:/etc/subversion/passwd \
  my-svn
```
--restart 选项说明：

    no - 不自动重启（默认）

    always - 总是重启

    unless-stopped - 除非手动停止，否则总是重启（推荐）

    on-failure - 只在失败时重启
    

### 使用 root 用户测试SVN
svn list http://localhost/svn/my-repo --username root


### 安装 SVN 客户端
sudo apt install -y subversion
### 验证安装
svn --version

### 仓库检出
svn checkout http://localhost/svn/comline-log /home/fc/文档/svn/comline-log
### 添加新文件
svn add /path/to/local/copy/newfile.txt
### 提交更改
svn commit -m "提交说明" /path/to/local/copy
### 简写
svn ci -m "提交说明" /path/to/local/copy
```
命令	说明
svn checkout URL	检出仓库
svn update	更新代码
svn status	查看状态
svn add 文件	添加文件
svn commit -m "说明"	提交更改
svn diff	查看差异
svn log	查看日志
svn info	查看信息
svn revert 文件	撤销更改
```

### 方法一：修复仓库权限
#### 进入容器
docker exec -it custom-svn /bin/bash
#### 修复仓库权限
chown -R www-data:www-data /var/opt/svn/comline-log
chmod -R 775 /var/opt/svn/comline-log
#### 特别修复 db 目录的权限
chmod 775 /var/opt/svn/comline-log/db
chmod 666 /var/opt/svn/comline-log/db/txn-current-lock 2>/dev/null || true
#### 退出容器
exit

### 方法二：在宿主机修复权限
#### 检查宿主机映射的目录
ls -la /home/fc/docker/svn/data/comline-log/
#### 修复权限（因为目录映射，在宿主机修改也会生效）
sudo chown -R 33:33 /home/fc/docker/svn/data/comline-log/
sudo chmod -R 775 /home/fc/docker/svn/data/comline-log/



```
# 创建提交钩子，为了触发jenkins自动构建
# 钩子文件位置：/var/opt/svn/comline-log/hooks/
# 初始模板文件 post-commit.tmpl
# 复制一份作为钩子，文件不带后缀名
cp post-commit.tmpl post-commit
# 下面是文件内容

#!/bin/bash

REPOS="$1"
REV="$2"

JENKINS_URL="http://172.17.0.3:8080"
JENKINS_USER="admin"
JENKINS_API_TOKEN="113b4866e2a7747caf658a6f351c53a335"
JOB_NAME="comline-log"

CRUMB=$(curl -s -u "${JENKINS_USER}:${JENKINS_API_TOKEN}" \
  "${JENKINS_URL}/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)")

curl -X POST \
  -u "${JENKINS_USER}:${JENKINS_API_TOKEN}" \
  -H "$CRUMB" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "SVN_REVISION=${REV}" \
  "${JENKINS_URL}/job/${JOB_NAME}/build"

```