import express from 'express';
import { getLiuRenByDate } from 'liuren-ts-lib';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';

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

// API: AI 分析
app.post('/api/analyze', async (req, res) => {
  try {
    const { year, month, day, hour, question } = req.body;
    const date = new Date(year, month - 1, day, hour || 0, 0);
    if (isNaN(date.getTime())) return res.status(400).json({ error: '日期时间无效' });

    const lr = getLiuRenByDate(date);
    const bz = lr.dateInfo.bazi;
    const sc = lr.sanChuan;
    const gs = (lr.siKe.ke1[0]||'').charAt(0);
    const zs = (lr.siKe.ke3[0]||'').charAt(0);
    const gJ = lr.siKe.ke1[1]||'', zJ = lr.siKe.ke3[1]||'';
    const tj = lr.tianDiPan.tianJiang;

    const promptData = {
      起课时间: lr.dateInfo.date,
      八字: bz,
      月将: lr.dateInfo.yuejiang,
      空亡: lr.dateInfo.kong,
      旬: lr.dateInfo.xun,
      驿马: lr.dateInfo.yima,
      课体: sc.keTi,
      初传: sc.chuChuan, 中传: sc.zhongChuan, 末传: sc.moChuan,
      干上神: `${gs}·${gJ}`,
      支上神: `${zs}·${zJ}`,
      贵人: Object.entries(tj).find(([_,v])=>v==='贵人')?.[0]||'?',
      青龙: Object.entries(tj).find(([_,v])=>v==='青龙')?.[0]||'',
      白虎: Object.entries(tj).find(([_,v])=>v==='白虎')?.[0]||'',
      关键神煞: lr.shenSha.filter(s=>['日德','日禄','天德','月德','天喜','劫煞','亡神','破碎','岁破','驿马'].includes(s.name)).map(s=>`${s.name}在${s.value}`)
    };

    const prompt = `你是大六壬断课专家，精通《大六壬指南》《大六壬大全》《毕法赋》。

以下是一课大六壬的完整排盘数据：
${JSON.stringify(promptData, null, 2)}

${question ? `求测问题：${question}` : '综合断课'}

请根据以上课盘进行专业断课，参考九宗门、三传、四课、神煞、天将等技法，给出一份完整的分析报告。

要求：
1. 先解读课体特征和核心格局
2. 分析三传脉络（初传发端→中传过程→末传结局）
3. 干支上神与求测问题的关联
4. 关键神煞和天将的影响
5. 给出综合判断和具体建议
6. 语言简洁有力，用词专业，不要模棱两可的废话
7. 控制在 500 字以内`;

    if (!DEEPSEEK_KEY) {
      return res.json({ content: null, fallback: true, reason: '未配置 DEEPSEEK_API_KEY' });
    }

    const aiResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text().catch(()=>'');
      return res.json({ content: null, fallback: true, reason: `AI API 错误: ${aiResp.status} ${errText}` });
    }

    const aiJson = await aiResp.json();
    const content = aiJson.choices?.[0]?.message?.content || '';
    res.json({ content, fallback: false });
  } catch (e) {
    res.json({ content: null, fallback: true, reason: e.message });
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
