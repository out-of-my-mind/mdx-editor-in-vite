### 安装 MariaDB
```
# 1. 更新软件包列表
sudo apt update

# 2. 安装 MariaDB 服务器和客户端
sudo apt install mariadb-server
```

### 运行初始安全配置
安装完成后，运行安全脚本以移除一些不安全默认设置（如匿名用户、测试数据库等），并增强 root 用户安全。  
sudo mysql_secure_installation


执行此脚本时，系统会询问你几个问题，请按需选择：

    Enter current password for root (enter for none): 初次安装直接按 回车。

    Switch to unix_socket authentication [Y/n]: 询问是否使用系统凭据认证（通常更安全），建议按 Y。

    Change the root password? [Y/n]: 是否修改root密码？初次安装可以直接按 n（因为此时密码为空），或者按 Y 设置一个强密码。

    Remove anonymous users? [Y/n]: 是否删除匿名用户？必须按 Y。

    Disallow root login remotely? [Y/n]: 是否禁止root远程登录？建议按 Y（除非你有远程管理需求）。

    Remove test database and access to it? [Y/n]: 是否删除测试数据库？建议按 Y。

    Reload privilege tables now? [Y/n]: 是否立即重载权限表？必须按 Y。


### 检查 MariaDB 服务是否正常运行
```
# 查看服务状态
sudo systemctl status mariadb
```
如果看到 Active: active (running) 的绿色字样，说明服务已成功启动并运行



### 使用
```
# 使用 sudo 直接登录（无需密码）
sudo mariadb

# 使用密码登录
mariadb -u root -p


连接后，可以像使用 MySQL 一样执行 SQL 命令
-- 1. 查看服务器上所有数据库
SHOW DATABASES;

# 要查看数据库中所有的用户
SELECT user, host FROM mysql.user;

-- 2. 创建一个新数据库
CREATE DATABASE mytestdb;

# 创建用户账号
CREATE USER 'myuser'@'localhost' IDENTIFIED BY 'password';
# 授予用户访问数据库
GRANT ALL PRIVILEGES ON mydatabase.* TO 'myuser'@'localhost';
# 应用权限更改
FLUSH PRIVILEGES;

-- 3. 切换到新建的数据库
USE mytestdb;

-- 4. 在新数据库中创建一个表
CREATE TABLE users (id INT, name VARCHAR(20));

-- 5. 向表中插入一条数据
INSERT INTO users VALUES (1, '张三');

-- 6. 查询表中的数据
SELECT * FROM users;


# 方法：将SQL文件内容通过管道符(<)传递给客户端
mariadb -u root -p 数据库名 < /路径/文件名.sql

# 查看特定用户的权限
SHOW GRANTS FOR 'username'@'host'
```

### 修改
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf

### 重启服务
sudo systemctl restart mariadb.service

```
-- 删除旧的权限（如果需要的话）
DROP USER 'fabric'@'192.168.18.20';

-- 创建允许从客户端IP连接的用户
CREATE USER 'fabric'@'192.168.18.6' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON fabric.* TO 'fabric'@'192.168.18.6';
FLUSH PRIVILEGES;

-- 或者允许从整个网段连接（更方便）
CREATE USER 'fabric'@'192.168.18.%' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON fabric.* TO 'fabric'@'192.168.18.%';
FLUSH PRIVILEGES;
```
