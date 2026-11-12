(function () {
  'use strict';
  const days = {all:'전체',base:'숙소·공항',d1:'11/20 금',d2:'11/21 토',d3:'11/22 일',extra:'추가 후보'};
  const colors = {base:'#7c3aed',d1:'#2563eb',d2:'#e05b43',d3:'#16a34a',extra:'#c18a00'};
  const places = window.TRIP_PLACES;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = p => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name+' '+p.address);
  const popup = p => '<b>'+escape(p.name)+'</b><br>'+escape(days[p.day]+' · '+p.time)+'<br>'+escape(p.address)+'<br><a target="_blank" rel="noopener" href="'+escape(url(p))+'">Google 지도·길찾기 ↗</a>';
  let map, markers;
  if (window.L) {
    map = L.map('map',{scrollWheelZoom:false}).setView([35.676,139.75],12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
    markers = L.layerGroup().addTo(map);
  }
  const buttons = {};
  function select(day) {
    Object.entries(buttons).forEach(([key,button])=>button.setAttribute('aria-pressed',String(day===key)));
    const visible = places.filter(p=>day==='all'||p.day===day);
    document.getElementById('status').textContent = visible.length+'개 장소 · '+(map?'핀이나 목록을 누르면 주소와 길찾기를 볼 수 있어요.':'지도를 불러오지 못했어요. 아래 목록의 Google 지도 링크를 이용하세요.');
    const list = document.getElementById('places');
    list.replaceChildren();
    if (markers) markers.clearLayers();
    const grouped = new Map();
    visible.forEach(p=>{
      const key=p.lat+','+p.lng;
      if (!grouped.has(key)) grouped.set(key,[]);
      grouped.get(key).push(p);
    });
    const markerByKey = new Map();
    if(map){
      grouped.forEach((group,key)=>{
        const p=group[0];
        const marker=L.marker([p.lat,p.lng],{title:group.map(p=>p.name).join(' / '),icon:L.divIcon({className:'pin',html:'',iconSize:[16,16],iconAnchor:[8,8]})}).addTo(markers).bindPopup(group.map(popup).join('<hr>'));
        marker.on('add',()=>{marker.getElement().style.background=colors[p.day];});
        marker.getElement().style.background=colors[p.day];
        markerByKey.set(key,marker);
      });
      if(visible.length) map.fitBounds(visible.map(p=>[p.lat,p.lng]),{padding:[28,28],maxZoom:15});
    }
    visible.forEach(p=>{
      const button=document.createElement(map?'button':'a');
      button.className='place';
      button.innerHTML='<small style="color:'+colors[p.day]+'">'+escape(days[p.day]+' · '+p.time)+'</small>'+escape(p.name);
      if(map) button.addEventListener('click',()=>{map.setView([p.lat,p.lng],16);markerByKey.get(p.lat+','+p.lng).openPopup();});
      else {button.href=url(p);button.target='_blank';button.rel='noopener';}
      list.append(button);
    });
  }
  Object.entries(days).forEach(([key,label])=>{
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.addEventListener('click',()=>select(key));buttons[key]=button;
    document.getElementById('filters').append(button);
  });
  select('all');
}());
