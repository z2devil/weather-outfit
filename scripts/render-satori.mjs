/**
 * render-satori.mjs
 * 接收 cardData JSON 文件路径，渲染 PNG
 * 用法（脚本）: node scripts/render-satori.mjs --card preview/output/card-data.json --out preview/output/card.png
 * 用法（模块）: import { renderCard } from './render-satori.mjs'
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const FONT_DIR = arg('--font-dir', 'C:/Windows/Fonts');
const FONT_R = readFileSync(`${FONT_DIR}/PingFangSC-Regular.ttf`);
const FONT_M = readFileSync(`${FONT_DIR}/PingFangSC-Medium.ttf`);
const FONT_S = readFileSync(`${FONT_DIR}/PingFangSC-Semibold.ttf`);

// ─── Lucide 图标定义（与官方完全一致）────────────────────────
const ICONS = {
  mapPin:    ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  sun:       ['M12 2v2','M12 20v2','M4.93 4.93l1.41 1.41','M17.66 17.66l1.41 1.41','M2 12h2','M20 12h2','M6.34 17.66l-1.41 1.41','M19.07 4.93l-1.41 1.41',{c:1,cx:12,cy:12,r:4}],
  cloud:     ['M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'],
  cloudRain: ['M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25','M8 19v2','M8 13v2','M16 19v2','M16 13v2','M12 21v2','M12 15v2'],
  cloudDrizzle: ['M20 16.2A4.5 4.5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.2','M8 19v1','M8 23v1','M12 21v1','M12 17v1','M16 19v1','M16 23v1'],
  cloudSnow: ['M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25','M8 15h.01','M8 19h.01','M12 17h.01','M12 21h.01','M16 15h.01','M16 19h.01'],
  cloudLightning: ['M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9','M13 11l-4 6h6l-4 6'],
  droplets:  ['M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z','M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97'],
  wind:      ['M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2','M9.6 4.6A2 2 0 1 1 11 8H2','M12.6 19.4A2 2 0 1 0 14 16H2'],
  eye:       ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z',{c:1,cx:12,cy:12,r:3}],
  umbrella:  ['M23 12a11.05 11.05 0 0 0-22 0z','M12 13v7a3 3 0 0 1-6 0'],
  shirt:     ['M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z'],
  layers:    ['M12 2 2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5'],
  footprints:['M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5c0 1.1-.17 2.3-.5 3.2C9.1 9.1 9 9.5 9 10v6','M10 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0z','M20 16v-2.38C20 11.5 21.03 10.5 21 8c-.03-2.72-1.49-6-4.5-6C14.63 2 14 3.8 14 5c0 1.1.17 2.3.5 3.2.4.9.5 1.3.5 1.8v6','M18 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'],
  minusCircle: ['M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z','M8 12h8'],
};

function ico(name, color, size, sw = 1.5) {
  const defs = ICONS[name] || ICONS.cloud;
  const children = defs.map(d =>
    typeof d === 'string'
      ? { type: 'path', props: { d, fill: 'none' } }
      : { type: 'circle', props: { cx: d.cx, cy: d.cy, r: d.r, fill: 'none' } }
  );
  return {
    type: 'svg',
    props: {
      xmlns: 'http://www.w3.org/2000/svg',
      width: size, height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      'stroke-width': String(sw),
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      style: { flexShrink: 0 },
      children,
    },
  };
}

function theme(code) {
  if (code === 0)               return { bgFrom:'#0a1628', bgTo:'#1a2f5a', accent:'#60a5fa' };
  if (code <= 2)                return { bgFrom:'#0d1f3c', bgTo:'#1e3a6e', accent:'#93c5fd' };
  if (code === 3)               return { bgFrom:'#111827', bgTo:'#1f2937', accent:'#9ca3af' };
  if (code >= 71 && code <= 77) return { bgFrom:'#0c2a4a', bgTo:'#1a4a7a', accent:'#bae6fd' };
  if (code >= 95)               return { bgFrom:'#1a0a3a', bgTo:'#2d1060', accent:'#c4b5fd' };
  return { bgFrom:'#0f1b35', bgTo:'#1a3060', accent:'#60a5fa' };
}

function weatherIconName(code) {
  if (code === 0)               return 'sun';
  if (code <= 2)                return 'cloud';
  if (code === 3)               return 'cloud';
  if (code >= 51 && code <= 67) return 'cloudRain';
  if (code >= 71 && code <= 77) return 'cloudSnow';
  if (code >= 80 && code <= 82) return 'cloudDrizzle';
  if (code >= 95)               return 'cloudLightning';
  return 'cloud';
}

function el(type, style, children) {
  const ch = Array.isArray(children) ? children.filter(Boolean) : children;
  return { type, props: { style: { display: 'flex', ...style }, children: ch } };
}
function span(text, style = {}) {
  return { type: 'span', props: { style, children: String(text) } };
}

function buildCard(d) {
  const { location, date, weatherCode, temp, desc, max, min,
          humidity, windSpeed, windDir, uvLabel, rainProb, plans, shoes } = d;

  const t           = theme(weatherCode);
  const weatherIcon = weatherIconName(weatherCode);

  const metrics = [
    { label:'湿度',   value:`${humidity}%`,                icon: 'droplets' },
    { label:'风力',   value:`${windSpeed}km/h ${windDir}`, icon: 'wind' },
    { label:'紫外线', value: uvLabel,                      icon: 'eye' },
    { label:'降水率', value:`${rainProb}%`,                icon: 'umbrella' },
  ];
  const metricCells = metrics.map((m, i) =>
    el('div', {
      flexDirection:'column', alignItems:'center', justifyContent:'center',
      flex: 1, gap: 6,
      borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
      padding: '12px 4px',
    }, [
      ico(m.icon, 'rgba(255,255,255,0.5)', 14, 1.6),
      span(m.value, { fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }),
    ])
  );

  const planCards = plans.map((p, i) => {
    const letter   = ['A', 'B', 'C'][i];
    const topText  = p.inner?.items?.[0] || p.top || '';
    const hasCoat  = p.coat && p.coat !== '不带外套';
    const coatText = hasCoat ? p.coat : '不带外套';
    const coatColor= hasCoat ? '#fff' : 'rgba(255,255,255,0.28)';
    const coatIconName = hasCoat ? 'layers' : 'minusCircle';
    const tagBg    = i === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(96,165,250,0.15)';
    const tagColor = i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(144,194,255,0.9)';
    const tagBorder= i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(144,194,255,0.25)';

    const clothingRow = (iconName, text, color, sw = 1.5, fontSize = 14) =>
      el('div', { flexDirection:'row', alignItems:'center', gap: 10 }, [
        ico(iconName, color, 18, sw),
        span(text, { fontSize, fontWeight: fontSize > 13 ? 500 : 400, color }),
      ]);

    return el('div', {
      flexDirection: 'column',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: '14px 16px',
      gap: 0,
    }, [
      el('div', { marginBottom: 12 }, [
        el('div', {
          display: 'flex', padding: '3px 9px', borderRadius: 10,
          background: tagBg, border: `1px solid ${tagBorder}`,
        }, [
          span(`PLAN ${letter}`, { fontSize: 10, fontWeight: 600, color: tagColor, letterSpacing: 1 }),
        ]),
      ]),
      el('div', { flexDirection:'column', gap: 10 }, [
        clothingRow('shirt', topText, '#fff', 1.5, 15),
        clothingRow(coatIconName, coatText, coatColor, 1.5, 13),
        clothingRow('footprints', shoes || '运动鞋', 'rgba(255,255,255,0.5)', 1.5, 13),
      ]),
      el('div', { marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.1)' }, [
        span(`· ${p.note || ''}`, { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 300 }),
      ]),
    ]);
  });

  return el('div', {
    width: 400,
    flexDirection: 'column',
    background: `linear-gradient(145deg, ${t.bgFrom} 0%, ${t.bgTo} 100%)`,
    padding: '28px 24px 24px',
    fontFamily: '"PingFang SC"',
    gap: 0,
  }, [
    el('div', { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }, [
      el('div', { flexDirection:'row', alignItems:'center', gap: 5 }, [
        ico('mapPin', 'rgba(255,255,255,0.6)', 14, 1.8),
        span(location, { fontSize: 14, fontWeight: 500, color: '#fff' }),
      ]),
      span(date, { fontSize: 12, color: 'rgba(255,255,255,0.4)' }),
    ]),
    el('div', { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingRight: 8, marginBottom: 4 }, [
      span(String(temp) + '°', { fontSize: 80, fontWeight: 200, color: '#fff', lineHeight: 1, letterSpacing: -2 }),
      ico(weatherIcon, 'rgba(255,255,255,0.28)', 64, 1.1),
    ]),
    el('div', { flexDirection:'row', alignItems:'baseline', gap: 8, marginBottom: 24 }, [
      span(desc, { fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }),
      span(`最低${min}° / 最高${max}°`, { fontSize: 12, color: 'rgba(255,255,255,0.5)' }),
    ]),
    el('div', {
      flexDirection:'row',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      marginBottom: 20,
    }, metricCells),
    el('div', { flexDirection:'row', alignItems:'center', gap: 10, marginBottom: 12 }, [
      span('今日穿搭', { fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }),
      el('div', { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }, []),
    ]),
    el('div', { flexDirection:'column', gap: 10 }, planCards),
    el('div', { justifyContent:'center', marginTop: 16 }, [
      span('by 白羊 🐏', { fontSize: 11, color: 'rgba(255,255,255,0.18)' }),
    ]),
  ]);
}

export async function renderCard(cardData, outputPath) {
  const node = buildCard(cardData);
  const svg = await satori(node, {
    width: 400,
    fonts: [
      { name: 'PingFang SC', data: FONT_R, weight: 400, style: 'normal' },
      { name: 'PingFang SC', data: FONT_M, weight: 500, style: 'normal' },
      { name: 'PingFang SC', data: FONT_S, weight: 600, style: 'normal' },
    ],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: 'zoom', value: 2 } });
  writeFileSync(outputPath, resvg.render().asPng());
  return outputPath;
}

// ── 独立脚本运行时：从 card-data.json 渲染，输出 PNG 路径到 stdout
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const cardArg = args[args.indexOf('--card') + 1] || join(__dir, '../preview/output/card-data.json');
  const outArg  = args[args.indexOf('--out') + 1];

  const cardData = JSON.parse(readFileSync(cardArg, 'utf-8'));
  const mode     = cardData.mode || 'morning';
  const outPath  = outArg || join(__dir, `../preview/output/card-${mode}.png`);

  await renderCard(cardData, outPath);
  console.log(outPath);  // 输出 PNG 路径，供白羊读取
}
