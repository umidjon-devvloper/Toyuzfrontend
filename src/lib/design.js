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
[data-toy="gallery"].toy-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
.toy-gimg{display:block;border-radius:14px;overflow:hidden;aspect-ratio:1;}
.toy-gimg img{width:100%;height:100%;object-fit:cover;}
.toy-map-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;background:#b08d57;color:#fff;text-decoration:none;font-weight:600;}
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
