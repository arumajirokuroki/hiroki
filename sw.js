const V='gacha-v33';
const CORE=['./','index.html','manifest.webmanifest','mascot.png','mascot_body.png','mascot_arm.png','belly_logo.png','menu_bg.jpg','menu_bgm.mp3','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET') return;
  const u=new URL(r.url);
  const font=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(u.origin!==location.origin&&!font) return;
  /* audio is requested in byte ranges (iOS Safari always does); answer those from the cache with a proper 206 */
  if(r.headers.has('range')&&u.origin===location.origin){
    e.respondWith(caches.match(r.url).then(async m=>{
      if(!m) return fetch(r);
      const buf=await m.arrayBuffer();
      const g=/bytes=(\d*)-(\d*)/.exec(r.headers.get('range'))||[];
      let st=g[1]?+g[1]:0,en=g[2]?+g[2]:buf.byteLength-1;
      if(!g[1]&&g[2]){st=Math.max(0,buf.byteLength-+g[2]);en=buf.byteLength-1}
      en=Math.min(en,buf.byteLength-1);
      return new Response(buf.slice(st,en+1),{status:206,statusText:'Partial Content',headers:{'Content-Type':m.headers.get('Content-Type')||'audio/mpeg','Content-Range':'bytes '+st+'-'+en+'/'+buf.byteLength,'Content-Length':String(en-st+1)}});
    }));
    return;
  }
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(ch=>ch.put('index.html',c));return x}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>{
    const net=fetch(r).then(x=>{if(x&&(x.ok||x.type==='opaque')){const c=x.clone();caches.open(V).then(ch=>ch.put(r,c))}return x}).catch(()=>hit);
    return hit||net;
  }));
});
