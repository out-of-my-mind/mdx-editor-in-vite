```
# nginx/Dockerfile
FROM nginx:alpine

# 安装OpenSSH服务器
RUN apk update && apk add --no-cache \
    openssh \
    openssh-server-pam \
    && rm -rf /var/cache/apk/*

# 配置SSH
RUN mkdir -p /run/openrc \
    && touch /run/openrc/softlevel \
    && mkdir -p /var/run/sshd \
    && ssh-keygen -A

# 创建root用户的.ssh目录
RUN mkdir -p /root/.ssh \
    && chmod 700 /root/.ssh

# 设置SSH配置（允许root登录但禁用密码认证，启用密钥认证）
RUN sed -i 's/#PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/#PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config \
    && sed -i 's/#AuthorizedKeysFile.*/AuthorizedKeysFile .ssh\/authorized_keys/' /etc/ssh/sshd_config

# 删除默认nginx配置
RUN rm /etc/nginx/conf.d/default.conf

# 创建网站目录
RUN mkdir -p /usr/share/nginx/html

# 复制自定义配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制SSH公钥（需要先创建authorized_keys文件）
COPY authorized_keys /root/.ssh/authorized_keys
RUN chmod 600 /root/.ssh/authorized_keys

# 暴露端口：80(nginx) 和 22(ssh)
EXPOSE 80 22

# 创建启动脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

‵‵‵
# 末尾加 :ro 会清空覆盖   -v /xxx:/xxxx:ro

docker run -d \
  --name web-nginx \
  -p 8000:80 \
  -p 2222:22 \
  -v /home/fc/docker/nginx/web-dist-volume:/usr/share/nginx/html \
  --restart unless-stopped \
  nginx-ssh

```

### 将文件拷进来之后设置权限
docker exec web-nginx chown root:root /root/.ssh/authorized_keys
docker exec web-nginx chmod 600 /root/.ssh/authorized_keys

