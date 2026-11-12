"""Build the map's day groups from the itinerary; fail if a stop lacks coordinates."""
from pathlib import Path
import re, html, json
ROOT=Path(__file__).resolve().parents[1]
s=(ROOT/'index.html').read_text()
coords=json.loads((ROOT/'map-coordinates.json').read_text())
places=[]; seen=set()
def text(x):return html.unescape(re.sub('<[^>]+>',' ',x)).strip()
for day,sec in re.findall(r'<section class="day" id="(d\d)">(.*?)</section>',s,re.S):
 for a in re.findall(r'<article.*?</article>',sec,re.S):
  def field(c):
   m=re.search(r'<div class="'+c+r'">(.*?)</div>',a,re.S)
   return text(m.group(1)) if m else ''
  name=re.sub(r'<span.*?</span>','',re.search(r'<div class="name">(.*?)</div>',a,re.S).group(1),flags=re.S)
  name=text(name); address=field('address'); time=field('time')
  if '편의점' in address:continue
  if 'Hotel Oriental' in name:
   if day=='d4' and time in ['10:00 전','13:15']:name='나리타국제공항'; address='千葉県成田市古込1-1'
   else:continue
  if day=='d4':continue
  key=(day,name)
  if key in seen:continue
  seen.add(key)
  matches=[k for k in coords if k in address]
  assert matches, (name,address)
  k=max(matches,key=len)
  places.append(dict(day=day,name=name,address=address,time=time,lat=coords[k][0],lng=coords[k][1],note=coords[k][2]))
places[:0]=[dict(day='base',name='Hotel Oriental Express Ginza West',address='東京都港区新橋4-10-2',time='숙소',lat=35.664818,lng=139.756195,note='기존 여행 지도 주소 좌표'),dict(day='base',name='나리타국제공항',address='千葉県成田市古込1-1',time='11/20 도착 · 11/23 귀국',lat=35.773689,lng=140.386032,note='공항 대표 위치 · 실제 터미널은 예약 확인')]
extras=[('산리오 우에노점','東京都台東区上野4-8-6',35.709614,139.773682),('닌교초 이마한 / 로티즈 하우스 · 이크스피어리 4F','千葉県浦安市舞浜1-4',35.63429,139.88556),('네무로 하나마루 · KITTE 마루노우치점','東京都千代田区丸の内2-7-2',35.679085,139.764679)]
for n,a,lat,lng in extras:places.append(dict(day='extra',name=n,address=a,time='추가 후보',lat=lat,lng=lng,note='건물 대표 위치 · 층·입구는 현장 확인'))
(ROOT/'map-data.js').write_text('window.TRIP_PLACES = '+json.dumps(places,ensure_ascii=False,indent=2)+';\n')
print(f'Generated {len(places)} map entries')

# Keep an importable copy for Google My Maps alongside the website map.
import xml.etree.ElementTree as ET
ns='http://www.opengis.net/kml/2.2'
ET.register_namespace('',ns)
def tag(n):return '{'+ns+'}'+n
kml=ET.Element(tag('kml')); document=ET.SubElement(kml,tag('Document'))
labels={'base':'숙소·공항','d1':'1일차 · 11/20','d2':'2일차 · 11/21','d3':'3일차 · 11/22','extra':'추가 후보'}
for day,label in labels.items():
 folder=ET.SubElement(document,tag('Folder'));ET.SubElement(folder,tag('name')).text=label
 for p in places:
  if p['day']!=day:continue
  mark=ET.SubElement(folder,tag('Placemark'));ET.SubElement(mark,tag('name')).text=p['name']
  ET.SubElement(mark,tag('description')).text=p['time']+' · '+p['address']+'\n'+p['note']
  point=ET.SubElement(mark,tag('Point'));ET.SubElement(point,tag('coordinates')).text=f"{p['lng']},{p['lat']},0"
ET.ElementTree(kml).write(ROOT/'tokyo-trip.kml',encoding='utf-8',xml_declaration=True)
