# 设计文档

## 核心原则

**脚本只是工具层。** 只负责天气数据拉取和卡片渲染，不做其他任何事。

调用方（AI Agent）负责：
- 传入位置参数
- 结合对用户的了解推理穿搭方案
- 写入 `card-data.json`
- 通过自己的消息渠道发送渲染好的卡片

这样设计使 skill 保持无状态、与用户无关、可复用。

---

## 数据流

```
fetch-weather.mjs
  --lat / --lon / --location / --mode
        │
        ▼
  weather.json   ←── 调用方读取
        │
  （调用方推理穿搭，写 card-data.json）
        │
        ▼
render-satori.mjs
  --card card-data.json
        │
        ▼
  card-{mode}.png  ←── 路径输出到 stdout
```

---

## 天气数据

**数据源：** [Open-Meteo](https://open-meteo.com/) — 免费，无需 API key，直连。

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=<lat>
  &longitude=<lon>
  &current=temperature_2m,weathercode,windspeed_10m,winddirection_10m,relativehumidity_2m,uv_index
  &daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max
  &timezone=auto
  &forecast_days=2
```

主要字段：
- `current.temperature_2m` — 当前气温
- `daily.temperature_2m_max/min` — 当日最高/最低气温
- `daily.weathercode` — [WMO 天气代码](https://open-meteo.com/en/docs#weathervariables)
- `daily.precipitation_probability_max` — 降水概率
- `daily.windspeed_10m_max` — 最大风速

`--mode morning` 输出当前气温；`--mode night` 输出明日预报。

---

## 穿搭推荐规则（供调用方参考）

以下规则不在脚本中强制执行，作为调用方 prompt 约束的参考：

1. **方案数量**：固定 2 套（A 偏厚实，B 偏轻便）；大风（>30km/h）或下雪时增加第 3 套
2. **内搭厚度**：由最高气温决定（最热时的舒适状态）
3. **外套厚度**：由温差决定（温差越大外套越厚）
4. **鞋子**：雨天防水、雪天防滑、寒冷厚底、其他运动鞋
5. **说明**：每套方案配一句简短的场景说明

---

## 卡片渲染

**技术栈：** [Satori](https://github.com/vercel/satori) → SVG + [@resvg/resvg-js](https://github.com/nicolo-ribaudo/resvg-js) → PNG

- 纯 Node.js，无浏览器依赖
- 2x 缩放：`fitTo: { mode: "zoom", value: 2 }`
- 字体：PingFang SC（Regular / Medium / SemiBold），通过 `--font-dir` 指定目录

**卡片区块：**
1. Header — 地点 + 日期
2. 主天气 — 大字温度 + 天气图标（Lucide 风格内联 SVG）
3. 天气描述行 — 天气状况 + 最高/最低气温
4. 气象四宫格 — 湿度 / 风力 / 紫外线 / 降水率
5. 穿搭方案 — Plan A / Plan B 竖排卡片（内搭 / 外套 / 鞋子 / 说明）
6. 底部署名

**配色主题：** 深蓝灰渐变，随天气代码略有变化（晴天偏暖蓝，雷雨偏深紫）。

---

## 文件说明

| 文件 | 职责 |
|------|------|
| `scripts/fetch-weather.mjs` | 拉取 Open-Meteo 天气数据，输出 `preview/output/weather.json` |
| `scripts/render-satori.mjs` | 读取 `card-data.json`，渲染 PNG，stdout 输出路径 |
| `preview/card.html` | HTML 设计原型，仅供视觉参考，不参与运行时流程 |
| `preview/output/` | 运行时生成物目录，已加入 .gitignore |
