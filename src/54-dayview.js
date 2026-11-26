/* ===== Phone: Timesheets and Rota one day at a time (owner, 26 Nov 2026) =====
   On a phone the weekly grids (Member, Mon to Sun, totals) were wider than the screen. Here the same table shows the
   member, ONE day and the totals; a strip of the seven days above it picks the day. Nothing else changes: the cells are
   the same buttons as before. Wider screens are untouched. */
const DAYRX=/^(mon|tue|wed|thu|fri|sat|sun)/i;
function enhDay(){ if(innerWidth>600)return; const c=$('#main'); if(!c)return;
  const t=[...c.querySelectorAll('table')].find(x=>{ const th=x.querySelectorAll('thead tr:first-child th'); return th.length>=8&&[1,2,3,4,5,6,7].every(i=>DAYRX.test(th[i].textContent.trim())) }); if(!t)return;
  const th=[...t.querySelectorAll('thead tr:first-child th')].slice(1,8);
  let i=U.phDay; if(!(i>=0&&i<=6)){ i=th.findIndex(x=>x.classList.contains('tod')); if(i<0){ const dn=(new Date().getDay()+6)%7; i=U.phWk===undefined?dn:0 } }
  U.phDay=i; t.classList.add('dayone'); t.setAttribute('data-d',String(i));
  const lab=x=>{ const s=x.textContent.trim().replace(/\s+/g,' '); const m=/^([A-Za-z]{3})[a-z]*\s*(\d{1,2})?/.exec(s); return m?[m[1],m[2]||'']:[s.slice(0,3),''] };
  const strip=`<div class="dstrip" role="group" aria-label="Choose a day">${th.map((x,k)=>{ const [d,n]=lab(x); return `<button type="button" data-a="phDay" data-i="${k}" class="${k===i?'on':''}${x.classList.contains('tod')?' tod':''}" aria-pressed="${k===i}"><small>${esc(d)}</small><b>${esc(n)}</b></button>` }).join('')}</div>`;
  const host=t.closest('.card')||t.parentElement; if(host&&!c.querySelector('.dstrip'))host.insertAdjacentHTML('beforebegin',strip) }
A.phDay=d=>{ U.phDay=+d.i; render() };
AFTER.push(enhDay);
