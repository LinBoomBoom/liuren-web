# 部署到云服务器

## 方式一：Docker 部署（推荐）

### 1. 服务器安装 Docker
```bash
curl -fsSL https://get.docker.com | sh
```

### 2. 上传项目到服务器
```bash
scp -r liuren-web/ root@你的服务器IP:/opt/
```

### 3. 构建并启动
```bash
cd /opt/liuren-web
docker build -t liuren-web .
docker run -d -p 80:3000 --name liuren --restart always liuren-web
```

### 4. 访问
```
http://你的服务器IP
```

---

## 方式二：宝塔面板 + PM2

### 1. 宝塔面板安装 Node.js 版本管理器
### 2. 上传项目到 /www/wwwroot/liuren-web
### 3. 终端执行：
```bash
cd /www/wwwroot/liuren-web
npm install
npm install -g pm2
pm2 start server.js --name liuren
pm2 save
pm2 startup
```
### 4. 宝塔 → 网站 → 添加站点 → 反向代理到 localhost:3000

---

## 方式三：Railway / Render（免费托管）
直接连接 GitHub 仓库，自动部署。无需服务器。

---

## 环境变量
| 变量 | 默认值 | 说明 |
|:-----|:-----|:-----|
| PORT | 3000 | 服务端口 |

---

## 验证
```bash
curl http://localhost:3000/          # 返回 HTML 页面
curl -X POST http://localhost:3000/api/liuren \
  -H "Content-Type: application/json" \
  -d '{"year":2026,"month":6,"day":12,"hour":22,"minute":30}'
```
