### 备份当前配置
sudo cp /etc/resolv.conf /etc/resolv.conf.backup

### 配置可靠的 DNS 服务器
sudo tee /etc/resolv.conf <<EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 114.114.114.114
nameserver 223.5.5.5
search localdomain
EOF