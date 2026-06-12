import express from 'express';
import { getLiuRenByDate } from 'liuren-ts-lib';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// API: 排盘
app.post('/api/liuren', (req, res) => {
  try {
    const { year, month, day, hour, minute } = req.body;
    const date = new Date(year, month - 1, day, hour || 0, minute || 0);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: '日期时间无效' });
    }
    
    const result = getLiuRenByDate(date);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: 快捷排盘（当前时间）
app.get('/api/liuren/now', (req, res) => {
  try {
    const result = getLiuRenByDate(new Date());
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 首页
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🔮 大六壬排盘服务已启动: http://localhost:${PORT}`);
});
