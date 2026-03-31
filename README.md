# weather-outfit

天气数据拉取 + AI 穿搭建议卡片渲染工具。

使用 [Open-Meteo](https://open-meteo.com/) 获取天气数据，用 [Satori](https://github.com/vercel/satori) 渲染成精美 PNG 卡片。设计为由外部 AI Agent 调用——Agent 负责穿搭推荐和消息发送，本 skill 只负责数据和渲染。

## 工作流程

```
AI Agent（推理大脑）
  ├─ node scripts/fetch-weather.mjs   # 拉取天气数据 → weather.json
  ├─ Agent 推理穿搭 → 写 card-data.json
  ├─ node scripts/render-satori.mjs   # 渲染 PNG → stdout 输出路径
  └─ Agent 通过消息工具发送卡片
```

脚本只做**数据和渲染**——不调用 AI、不发消息、不内嵌任何用户信息。

## 脚本说明

### fetch-weather.mjs

从 Open-Meteo 拉取天气数据，写入 `preview/output/weather.json`。

```bash
node scripts/fetch-weather.mjs \
  --mode morning \        # morning（当前气温）| night（明日预报）
  --lat 35.68 \           # 纬度
  --lon 139.69 \          # 经度
  --location "东京"       # 显示名称
```

### render-satori.mjs

读取 `card-data.json`，渲染 2x 高清 PNG 卡片，stdout 输出文件路径。

```bash
node scripts/render-satori.mjs \
  --card preview/output/card-data.json \
  --out  preview/output/card.png        # 可选，默认 card-{mode}.png
```

Windows 系统字体目录默认为 `C:/Windows/Fonts`，如需更换使用 `--font-dir` 参数。需要包含 `PingFangSC-Regular.ttf`、`PingFangSC-Medium.ttf`、`PingFangSC-Semibold.ttf`。

## card-data.json 格式

由 Agent 在推理完成后写入，供 `render-satori.mjs` 读取：

```json
{
  "mode": "morning",
  "location": "东京",
  "date": "2026-04-01 周三",
  "weatherCode": 61,
  "temp": 17,
  "desc": "小雨",
  "max": 17, "min": 13,
  "hasRain": true, "hasSnow": false,
  "windMax": 15,
  "humidity": 87,
  "windSpeed": 3,
  "windDir": "东北",
  "uvLabel": "低",
  "rainProb": 90,
  "shoes": "防水运动鞋",
  "summary": null,
  "plans": [
    { "label": "A", "inner": { "items": ["卫衣"] }, "coat": "薄外套", "note": "温差大备外套" },
    { "label": "B", "inner": { "items": ["长袖衬衫"] }, "coat": "不带外套", "note": "室内久轻便优先" }
  ]
}
```

## 安装

```bash
npm install
```

**依赖：**
- Node.js 18+
- PingFang SC 字体（macOS 自带；Windows 位于 `C:/Windows/Fonts/`）
- Open-Meteo API — 免费，无需 API key，直连

## 文件结构

```
weather-outfit/
├── docs/design.md             # 设计文档
├── preview/
│   ├── card.html              # HTML 设计原型（仅参考）
│   └── output/                # 生成物目录，不进仓库
├── scripts/
│   ├── fetch-weather.mjs      # 天气数据拉取
│   └── render-satori.mjs      # 卡片渲染
├── .gitignore
└── README.md
```
