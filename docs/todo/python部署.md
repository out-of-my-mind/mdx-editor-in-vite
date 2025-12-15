```
FROM python:3.11.7-slim-bookworm

# 安装系统依赖（如果 mariadb 需要）
RUN apt-get update && apt-get install -y \
    gcc \
    libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖（使用国内镜像加速）
RUN pip install --no-cache-dir \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    --trusted-host pypi.tuna.tsinghua.edu.cn \
    -r requirements.txt

# 复制应用代码（.dockerignore 会过滤不需要的文件）
# 只复制 Python 代码文件，排除不必要的文件
COPY ./code/ .

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 暴露端口
# EXPOSE 8000

# 设置入口点为 uvicorn
# ENTRYPOINT ["uvicorn"]

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8188"]
```

```
docker run -d \
  --name python-api \
  -p 8188:8188 \
  my-python11 \
  uvicorn main:app --host 0.0.0.0 --port 8188 --reload
```