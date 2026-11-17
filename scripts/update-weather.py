"""Fetch forecasts at build time so phones need no external API connection."""
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from datetime import datetime, timezone
import json, re, time
ROOT=Path(__file__).resolve().parents[1]
FIELDS=['weather_code','temperature_2m_max','temperature_2m_min','precipitation_probability_max','wind_speed_10m_max']
LOCATIONS={'tokyo':(35.6762,139.6503),'disney':(35.6267,139.8851)}
path=ROOT/'weather-data.js'
previous={}
if path.exists():
 previous=json.loads(path.read_text().split(' = ',1)[1].rstrip(';\n'))
result=dict(previous)
errors=[]
for key,(lat,lng) in LOCATIONS.items():
 params=urlencode(dict(latitude=lat,longitude=lng,daily=','.join(FIELDS),timezone='Asia/Tokyo',forecast_days=16,wind_speed_unit='ms'))
 try:
  for attempt in range(3):
   try:
    with urlopen(Request('https://api.open-meteo.com/v1/forecast?'+params,headers={'User-Agent':'TokyoTripWeather/1.0'}),timeout=25) as response:data=json.load(response)
    break
   except Exception:
    if attempt==2:raise
    time.sleep(2)
  daily=data['daily'];assert all(len(daily[f])==len(daily['time']) for f in FIELDS)
  now=int(datetime.now(timezone.utc).timestamp()*1000)
  stamps={date:now for date in daily['time']}
  old=previous.get(key,{})
  for i,date in enumerate(old.get('daily',{}).get('time',[])):
   if date not in daily['time']:
    daily['time'].append(date)
    for f in FIELDS:daily[f].append(old['daily'][f][i])
    stamps[date]=old.get('dateStamps',{}).get(date,old['fetchedAt'])
  result[key]=dict(fetchedAt=now,daily=daily,dateStamps=stamps)
 except Exception as exc:errors.append(f'{key}: {exc}')
if not all(key in result for key in LOCATIONS):raise RuntimeError('; '.join(errors))
path.write_text('window.TRIP_WEATHER = '+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n')
# Embed the same forecast directly in HTML, including for disabled JavaScript.
s=(ROOT/'index.html').read_text()
from zoneinfo import ZoneInfo
names={'tokyo':'도쿄','disney':'디즈니씨·마이하마'}
def condition(code):
 if code==0:return '☀️ 맑음'
 if code in (1,2):return '🌤️ 구름 조금'
 if code==3:return '☁️ 흐림'
 if code in (45,48):return '🌫️ 안개'
 if code in (51,53,55,56,57):return '🌦️ 이슬비'
 if code in (61,63,65,66,67,80,81,82):return '🌧️ 비'
 if code in (71,73,75,77,85,86):return '🌨️ 눈'
 if code in (95,96,99):return '⛈️ 뇌우'
 return '날씨 정보 없음'
def number(value,suffix):return f'{round(value)}{suffix}' if isinstance(value,(int,float)) else '정보 없음'
def replace(m):
 card=m[0];date=m['date'];key=m['key'];cache=result[key];d=cache['daily']
 if date not in d['time']:return card
 i=d['time'].index(date)
 summary=f"{names[key]} · {condition(d['weather_code'][i])} · 최저 {number(d['temperature_2m_min'][i],'°C')} / 최고 {number(d['temperature_2m_max'][i],'°C')} · 강수확률 {number(d['precipitation_probability_max'][i],'%')}"
 if key=='disney':summary+=f" · 최대풍속 {number(d['wind_speed_10m_max'][i],'m/s')}"
 stamp=datetime.fromtimestamp(cache['dateStamps'][date]/1000,ZoneInfo('Asia/Tokyo')).strftime('%m/%d %H:%M')
 card=re.sub(r'(<div class="weather-summary">).*?(</div>)',lambda x:x[1]+summary+x[2],card)
 card=re.sub(r'(<div class="weather-meta">).*?(</div>)',lambda x:x[1]+f'예보 조회 {stamp} (도쿄 시간) · 예보는 바뀔 수 있어요.'+x[2],card)
 return card
s=re.sub(r'<div class="trip-weather" data-trip-weather="(?P<date>[^"]+)" data-weather-location="(?P<key>[^"]+)".*?</noscript></div>',replace,s)
s=s.replace('날씨 자동 표시에는 자바스크립트가 필요합니다.','저장된 예보를 표시하고 있습니다.')
(ROOT/'index.html').write_text(s)
print('Saved Tokyo and DisneySea forecasts; embedded weather in HTML.')
if errors:print('Retained previous forecast for failed locations:', '; '.join(errors))
