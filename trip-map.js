(function () {
  'use strict';
  const days = {all:'전체',base:'숙소·공항',d1:'11/20 금',d2:'11/21 토',d3:'11/22 일',extra:'추가 후보'};
  const colors = {base:'#8000FF',d1:'#004CFF',d2:'#FF0000',d3:'#008A00',extra:'#FF7600'};
  const places = window.TRIP_PLACES;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = p => p.mapUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name+' '+p.address);
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
        const marker=L.marker([p.lat,p.lng],{title:group.map(p=>p.name).join(' / '),icon:L.divIcon({className:'pin',html:'',iconSize:[22,22],iconAnchor:[11,11]})}).addTo(markers).bindPopup(group.map(popup).join('<hr>'));
        marker.on('add',()=>{marker.getElement().style.background=colors[p.day];});
        marker.getElement().style.background=colors[p.day];
        if(group.some(p=>p.id==='afuri-harajuku')) marker.bindTooltip('🍜 AFURI Harajuku',{permanent:true,direction:'top',offset:[0,-10],className:'afuri-label'});
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
  const focusAfuri = () => {
    select('d2');
    const p=places.find(p=>p.id==='afuri-harajuku');
    if(map&&p){map.setView([p.lat,p.lng],16);markers.eachLayer(marker=>{if(marker.getLatLng().lat===p.lat&&marker.getLatLng().lng===p.lng)marker.openPopup();});}
  };
  const afuriButton=document.createElement('button');afuriButton.type='button';afuriButton.textContent='🍜 AFURI 바로 보기';afuriButton.addEventListener('click',focusAfuri);document.getElementById('filters').append(afuriButton);
  if(new URLSearchParams(location.search).get('place')==='afuri')focusAfuri();else select('all');
}());
