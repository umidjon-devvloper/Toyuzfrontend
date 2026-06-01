// Dizaynni (DB'dagi HTML/CSS kod) to'liq, izolyatsiyalangan HTML hujjatga aylantiradi.
// Bu hujjat <iframe srcDoc> ichida ko'rsatiladi — shuning uchun dizayn CSS/JS si
// ilovaning qolgan qismiga ta'sir qilmaydi. Ham public sahifa, ham admin preview shuni ishlatadi.

const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// {{token}} larni matn qiymatlari bilan almashtirish (HTML-escape qilingan holda)
export function fillTemplate(html, data) {
  return String(html || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    data[key] != null ? escapeHtml(data[key]) : ""
  );
}

// Sana + soatni birlashtirib, teskari sanoq nishon vaqtini (ms) hisoblaydi
export function computeTarget(dateStr, timeStr) {
  if (!dateStr) return Date.now();
  const d = new Date(dateStr);
  const [hh, mm] = String(timeStr || "18:00").split(":").map((x) => parseInt(x, 10));
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.getTime();
}

// Matn placeholder'lari uchun ko'rinadigan qiymatlar
export function templateData(inv = {}) {
  const dateStr = inv.weddingDate
    ? new Date(inv.weddingDate).toLocaleDateString("uz", { day: "numeric", month: "long", year: "numeric" })
    : "";
  return {
    groomName: inv.groomName || "",
    brideName: inv.brideName || "",
    weddingDate: dateStr,
    weddingTime: inv.weddingTime || "",
    venueName: inv.venueName || "",
    address: inv.address || "",
    description: inv.description || "",
    mapLink: inv.mapLink || "",
  };
}

// Widget'lar uchun standart (default) CSS — dizayn o'z CSS'i bilan ustidan yozishi mumkin
const BASE_CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;}
body{font-family:'Inter',system-ui,sans-serif;}
[data-toy="cover"].toy-cover{background-size:cover;background-position:center;}
[data-toy="countdown"].toy-countdown{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;}
.toy-cd-box{min-width:64px;padding:12px 10px;border-radius:14px;background:rgba(0,0,0,.06);text-align:center;}
.toy-cd-num{font-size:28px;font-weight:700;line-height:1;}
.toy-cd-lbl{font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:.7;margin-top:6px;}
/* Galereya — markazdan boshlanadigan gorizontal karusel (snap bilan) */
[data-toy="gallery"].toy-gallery{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:6px 50%;scrollbar-width:none;}
[data-toy="gallery"].toy-gallery::-webkit-scrollbar{display:none;}
.toy-gimg{flex:0 0 auto;width:76%;max-width:340px;scroll-snap-align:center;border-radius:18px;overflow:hidden;aspect-ratio:4/5;box-shadow:0 12px 30px -10px rgba(0,0,0,.35);}
.toy-gimg img{width:100%;height:100%;object-fit:cover;display:block;}
.toy-map-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;background:#b08d57;color:#fff;text-decoration:none;font-weight:600;}
/* Iframe ichidagi musiqa tugmasi */
.toy-music-btn{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:46px;height:46px;border-radius:999px;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;background:rgba(20,16,10,.55);color:#fff;backdrop-filter:blur(6px);box-shadow:0 6px 18px rgba(0,0,0,.3);transition:transform .15s;}
.toy-music-btn:hover{transform:scale(1.08);}
.toy-music-btn svg{width:22px;height:22px;}
.toy-music-btn.playing{animation:toySpin 6s linear infinite;}
@keyframes toySpin{to{transform:rotate(360deg);}}
`;

// Iframe ichida ishlaydigan runtime: cover/gallery/map/countdown widget'larini to'ldiradi
const RUNTIME = `
(function(){
  var D = window.__TOY__ || {};
  var imgs = D.images || [];
  function q(sel){return Array.prototype.slice.call(document.querySelectorAll(sel));}
  q('[data-toy="cover"]').forEach(function(el){ if(imgs[0]){ el.style.backgroundImage='url("'+imgs[0]+'")'; el.classList.add('toy-cover'); }});
  q('[data-toy="gallery"]').forEach(function(el){
    el.classList.add('toy-gallery');
    el.innerHTML = imgs.map(function(u){return '<a class="toy-gimg" href="'+u+'" target="_blank" rel="noreferrer"><img loading="lazy" src="'+u+'" alt=""></a>';}).join('');
    // Galereya markazdan boshlanadi (o'rtadagi rasm ko'rinadi)
    requestAnimationFrame(function(){
      var mid = Math.floor(imgs.length/2);
      var item = el.children[mid];
      if(item){ el.scrollLeft = item.offsetLeft - (el.clientWidth/2) + (item.clientWidth/2); }
    });
  });
  q('[data-toy="map"]').forEach(function(el){
    if(D.mapLink){ el.innerHTML = '<a class="toy-map-btn" href="'+D.mapLink+'" target="_blank" rel="noreferrer">📍 Xaritada ochish</a>'; }
  });
  var cd = q('[data-toy="countdown"]');
  if(cd.length){
    var target = D.target || Date.now();
    function pad(n){return (n<10?'0':'')+n;}
    function tick(){
      var diff = Math.max(0, target - Date.now());
      var d=Math.floor(diff/86400000), h=Math.floor(diff/3600000)%24, m=Math.floor(diff/60000)%60, s=Math.floor(diff/1000)%60;
      var box=function(v,l){return '<div class="toy-cd-box"><div class="toy-cd-num">'+pad(v)+'</div><div class="toy-cd-lbl">'+l+'</div></div>';};
      var html=box(d,'Kun')+box(h,'Soat')+box(m,'Daqiqa')+box(s,'Soniya');
      cd.forEach(function(n){ n.classList.add('toy-countdown'); n.innerHTML=html; });
    }
    tick(); setInterval(tick,1000);
  }

  // ===== MUSIQA — ochilishi bilan avtomatik ijro (iframe ichida ishonchli) =====
  if(D.music){
    // Dizayn ichidagi boshqa audio bo'lsa — to'xtatamiz (ikki marta ijro bo'lmasligi uchun)
    q('audio').forEach(function(a){ try{a.pause();}catch(e){} });
    var audio = new Audio(D.music);
    audio.loop = true;
    var playing = false;
    var btn = document.createElement('button');
    btn.className = 'toy-music-btn';
    btn.setAttribute('aria-label','Musiqa');
    var ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    var ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';
    function render(){ btn.innerHTML = playing ? ICON_ON : ICON_OFF; btn.classList.toggle('playing', playing); }
    function start(){ audio.play().then(function(){ playing=true; render(); }).catch(function(){}); }
    function toggle(){ if(playing){ audio.pause(); playing=false; render(); } else { start(); } }
    audio.addEventListener('pause', function(){ playing=false; render(); });
    audio.addEventListener('play', function(){ playing=true; render(); });
    btn.addEventListener('click', function(e){ e.stopPropagation(); toggle(); });
    render();
    document.body.appendChild(btn);

    // 1) Darhol urinib ko'ramiz (Telegram WebView / oldin ruxsat berilgan bo'lsa ishlaydi)
    start();
    // 2) Aks holda — birinchi teginishda (iframe ichida) ishga tushadi
    var unlock = function(){ if(!playing){ start(); } if(playing){ off(); } };
    var off = function(){ ['pointerdown','touchstart','click','keydown','scroll'].forEach(function(ev){ document.removeEventListener(ev, unlock, true); }); };
    ['pointerdown','touchstart','click','keydown','scroll'].forEach(function(ev){ document.addEventListener(ev, unlock, true); });
  }
})();
`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Great+Vibes&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`;

// To'liq, o'zicha ishlaydigan HTML hujjat (iframe srcDoc uchun)
export function buildPreviewDoc(design, inv) {
  const filled = fillTemplate(design?.html, templateData(inv));
  const runtimeData = {
    images: inv.images || [],
    mapLink: inv.mapLink || "",
    target: computeTarget(inv.weddingDate, inv.weddingTime),
    music: inv.music?.url || "",
  };
  // </script> ni JSON ichida buzilmasligi uchun ehtiyot chorasi
  const dataJson = JSON.stringify(runtimeData).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${FONTS}
<style>${BASE_CSS}${design?.css || ""}</style>
</head>
<body>
${filled}
<script>window.__TOY__=${dataJson};</script>
<script>${RUNTIME}</script>
</body>
</html>`;
}
