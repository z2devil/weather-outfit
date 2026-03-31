/**
 * fetch-weather.mjs
 * 只负责拉取天气数据，输出到 JSON 文件
 * 用法: node scripts/fetch-weather.mjs [--mode morning|night]
 * 输出: preview/output/weather.json
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dir, '../preview/output');
const OUTPUT_PATH = join(OUTPUT_DIR, 'weather.json');

// ─── 参数解析（由调用方传入，skill 本身不持有任何用户信息）───
function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const LAT      = parseFloat(arg('--lat',      '30.47'));
const LON      = parseFloat(arg('--lon',      '114.43'));
const LOCATION = arg('--location', '未知位置');

const WMO_DESC = {
  0:'晴', 1:'大部晴朗', 2:'局部多云', 3:'阴天',
  45:'有雾', 48:'雾凇',
  51:'小毛毛雨', 53:'中毛毛雨', 55:'大毛毛雨',
  61:'小雨', 63:'中雨', 65:'大雨',
  71:'小雪', 73:'中雪', 75:'大雪',
  80:'阵雨', 81:'中阵雨', 82:'强阵雨',
  95:'雷阵雨', 96:'冰雹雷雨', 99:'强冰雹雷雨',
};
const WMO_EMOJI = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌧️',61:'🌦️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
};
const SNOW_CODES = new Set([71,73,75]);
const RAIN_CODES = new Set([51,53,55,61,63,65,80,81,82,95,96,99]);

function uvLevel(uv) {
  if (uv <= 2) return { label: '低' };
  if (uv <= 5) return { label: '中' };
  if (uv <= 7) return { label: '高' };
  if (uv <= 10) return { label: '很高' };
  return { label: '极高' };
}

function windDir(deg) {
  const dirs = ['北','东北','东','东南','南','西南','西','西北'];
  return dirs[Math.round(deg / 45) % 8];
}

function parseDay(daily, i) {
  const code = daily.weathercode[i];
  return {
    min:      Math.round(daily.temperature_2m_min[i]),
    max:      Math.round(daily.temperature_2m_max[i]),
    code,
    desc:     WMO_DESC[code] || '未知',
    emoji:    WMO_EMOJI[code] || '🌤️',
    hasRain:  RAIN_CODES.has(code) || daily.precipitation_probability_max[i] > 40,
    hasSnow:  SNOW_CODES.has(code),
    rainProb: daily.precipitation_probability_max[i],
    windMax:  Math.round(daily.windspeed_10m_max[i]),
    uvMax:    uvLevel(daily.uv_index_max?.[i] ?? 0),
  };
}

const mode = arg('--mode', 'morning');

const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  `&current=temperature_2m,weathercode,windspeed_10m,winddirection_10m,relative_humidity_2m,uv_index` +
  `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max,uv_index_max` +
  `&timezone=Asia%2FShanghai&forecast_days=2`;

const res = await fetch(url);
if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
const data = await res.json();

const today    = parseDay(data.daily, 0);
const tomorrow = parseDay(data.daily, 1);
const day      = mode === 'night' ? tomorrow : today;

const current = {
  temp:     Math.round(data.current.temperature_2m),
  code:     data.current.weathercode,
  desc:     WMO_DESC[data.current.weathercode] || '未知',
  emoji:    WMO_EMOJI[data.current.weathercode] || '🌤️',
  wind:     Math.round(data.current.windspeed_10m),
  windDir:  windDir(data.current.winddirection_10m),
  humidity: data.current.relative_humidity_2m,
  uv:       uvLevel(data.current.uv_index ?? 0),
};

const WEEKDAY_ZH = ['周日','周一','周二','周三','周四','周五','周六'];
const now = new Date();
const mm  = String(now.getMonth() + 1).padStart(2, '0');
const dd  = String(now.getDate()).padStart(2, '0');
const dateStr = `${now.getFullYear()}-${mm}-${dd} ${WEEKDAY_ZH[now.getDay()]}`;

const output = {
  mode,
  location: LOCATION,
  date: dateStr,
  current,
  today,
  tomorrow,
  day,  // 当前 mode 对应的那天（morning→today，night→tomorrow）
  fetchedAt: new Date().toISOString(),
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
