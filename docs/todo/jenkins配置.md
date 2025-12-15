### Dockerfile文件
```
# 使用 Ubuntu 22.04 LTS 作为基础镜像
FROM ubuntu:22.04

# 1. 更新并安装必要工具
RUN apt-get update && apt-get install -y \
    bash \
    locales \
    fontconfig \
    libfreetype6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. 正确配置locale（修复部分）
# 启用并生成zh_CN.UTF-8和en_US.UTF-8
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    sed -i '/zh_CN.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen

# 3. 设置环境变量（同时支持中英文）
ENV LANG=zh_CN.UTF-8 \
    LANGUAGE=zh_CN:zh \
    LC_ALL=zh_CN.UTF-8 \
    # 添加备用英文配置
    LANG_BAK=en_US.UTF-8

# 4. 复制JDK tar包
COPY openjdk-17.0.2_linux-x64_bin.tar.gz /tmp/

# 5. 解压并设置Java
RUN mkdir -p /opt/java && \
    tar -xzf /tmp/openjdk-17.0.2_linux-x64_bin.tar.gz -C /opt/java --strip-components=1 && \
    rm /tmp/openjdk-17.0.2_linux-x64_bin.tar.gz

# 6. 设置环境变量
ENV JAVA_HOME=/opt/java
ENV PATH=$JAVA_HOME/bin:$PATH

# 7. 验证Java和locale
RUN java -version && \
    echo "Locale check:" && \
    locale && \
    echo "UTF-8 test: 中文测试" && \
    echo -e "\nLocale available:" && \
    locale -a

# 8. 可选：安装中文字体（如果需要显示中文）
RUN apt-get update && apt-get install -y \
    wget \
    xz-utils \
    openssh-client \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    ttf-wqy-zenhei \
    && rm -rf /var/lib/apt/lists/*


# 下载 Node.js 22.12 的二进制文件并解压
RUN wget https://nodejs.org/dist/v22.12.0/node-v22.12.0-linux-x64.tar.xz
RUN tar -xJf node-v22.12.0-linux-x64.tar.xz
RUN cd node-v22.12.0-linux-x64 && cp -r * /usr/local/

# 清理文件和缓存
RUN rm -rf node-v22.12.0-linux-x64* && apt-get clean && rm -rf /var/lib/apt/lists/*

# 9. 复制jenkins.war并设置启动
WORKDIR /app
COPY jenkins.war /app/

# 10. 创建一个启动脚本，确保环境变量正确传递
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'export LANG=zh_CN.UTF-8' >> /app/start.sh && \
    echo 'export LC_ALL=zh_CN.UTF-8' >> /app/start.sh && \
    echo 'java -jar jenkins.war --httpPort=8080' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 8080
CMD ["/app/start.sh"]
```

### 执行文件
docker build -t my-java17-jenkins .


# 1. 在容器内安装 Java 17
docker exec -it temp-jenkins apt-get update && apt-get install -y openjdk-17-jre-headless
# 2. 使用 Java 17 运行 Jenkins
docker exec -it temp-jenkins /usr/lib/jvm/java-17-openjdk-amd64/bin/java -jar /app/jenkins.war --httpPort=8080


docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -v jenkins_home:/var/jenkins_home \
  -v /home/fc/docker/python3.11/code:/root/.jenkins/workspace/python-api \
  my-jenkins
