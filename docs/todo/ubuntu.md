### 查看端口占用情况
sudo lsof -i :8188  

sudo ss -tuln | grep 3306

### 创建文件夹快捷方式
ln -s /home/yourusername/Documents ~/Desktop/Documents_Shortcut

```
find /path/to/search -type d -name "folderName"
/path/to/search是要进行搜索的路径，可以改为需要搜索的目录路径；folderName是要查找的文件夹的名称，可以改为需要查找的文件夹名。该命令会递归地在指定路径下搜索并显示所有匹配的文件夹
```