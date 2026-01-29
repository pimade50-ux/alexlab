// === КОНФИГУРАЦИЯ ===
const TG_BOT_LINK = "https://t.me/neiromagic_st_bot";
const MAX_CREDITS = 5;
const tg = window.Telegram.WebApp; 
tg.expand();

// === 1. ЖИВОЙ ФОН ===
const canvas = document.getElementById('neural-canvas'); const ctx = canvas.getContext('2d');
let pts = []; function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();
class Pt { constructor() { this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height; this.vx=(Math.random()-0.5)*0.3; this.vy=(Math.random()-0.5)*0.3; } upd() { this.x+=this.vx; this.y+=this.vy; if(this.x<0||this.x>canvas.width)this.vx*=-1; if(this.y<0||this.y>canvas.height)this.vy*=-1; } }
for(let i=0;i<25;i++) pts.push(new Pt());
function anim() { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#00D9FF'; for(let p of pts) { p.upd(); ctx.beginPath(); ctx.arc(p.x,p.y,1,0,7); ctx.fill(); for(let p2 of pts){ let d=Math.hypot(p.x-p2.x,p.y-p2.y); if(d<100){ctx.strokeStyle=`rgba(0,217,255,${1-d/100})`; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();}}} requestAnimationFrame(anim); } anim();

// === 2. ИНТЕРФЕЙС ===
function getCredits() { let c = parseInt(localStorage.getItem('alex_credits')); return isNaN(c) ? 5 : c; }
function updateUI() { const c = getCredits(); document.getElementById('credits-val').innerText = `${c}/5`; document.getElementById('limit-overlay').style.display = c <= 0 ? 'flex' : 'none'; }
function switchTab(t) { document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(p=>p.classList.remove('active')); document.getElementById('tab-btn-'+t).classList.add('active'); document.getElementById('pane-'+t).classList.add('active'); if(tg.HapticFeedback)tg.HapticFeedback.selectionChanged();}
function showToast(m) { const t=document.getElementById('toast'); t.innerText=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000); if(tg.HapticFeedback)tg.HapticFeedback.notificationOccurred('success');}

// === 3. ЧАТ С АЛЕКСОМ (МЯГКИЕ ПРОДАЖИ) ===
let userName = localStorage.getItem('user_name') || "";
let userGender = localStorage.getItem('user_gender') || "unknown";
const chatBox = document.getElementById('chat-box');

// Приветствие
if(!userName) {
    chatBox.innerHTML = `<div class="msg-row"><img src="founder.jpg" class="alex-avatar"><div class="msg alex">Йо! 👋 Я цифровой клон Алекса. Как к тебе обращаться?</div></div>`;
} else {
    chatBox.innerHTML = `<div class="msg-row"><img src="founder.jpg" class="alex-avatar"><div class="msg alex">С возвращением, ${userName}! ⚡ Какой план на сегодня?</div></div>`;
}

async function sendChat() {
    const inp = document.getElementById('chat-input'); const txt = inp.value.trim(); if(!txt) return;
    chatBox.innerHTML += `<div class="msg user">${txt}</div>`; chatBox.scrollTop = chatBox.scrollHeight; inp.value = '';

    if (!userName) {
        userName = txt; localStorage.setItem('user_name', userName);
        const last = userName.toLowerCase().slice(-1);
        userGender = (['а', 'я', 'и'].includes(last)) ? "female" : "male";
        localStorage.setItem('user_gender', userGender);
        const welcome = userGender === "female" ? `Рад знакомству, ${userName}! ✨ Я тут, чтобы помочь тебе с креативом.` : `Принято, ${userName}! 🤝 Давай сотворим что-нибудь мощное.`;
        setTimeout(() => { chatBox.innerHTML += `<div class="msg-row"><img src="founder.jpg" class="alex-avatar"><div class="msg alex">${welcome}</div></div>`; chatBox.scrollTop = chatBox.scrollHeight; }, 700);
        return;
    }

    const loadID = 'l-' + Date.now();
    chatBox.innerHTML += `<div class="msg-row" id="${loadID}"><img src="founder.jpg" class="alex-avatar"><div class="msg alex"><div class="loader" style="width:20px;height:20px;border-width:2px;"></div></div></div>`; chatBox.scrollTop = chatBox.scrollHeight;

    const personality = userGender === "female" ? `Общайся с девушкой (${userName}). Будь галантным, но профессиональным.` : `Общайся с парнем (${userName}). Будь как бро, используй сленг.`;
    
    // !!! ОБНОВЛЕННЫЙ ПРОМПТ SOFT SELL !!!
    const sys = {
        role:"system", 
        content:`Ты Алекс, основатель ALEX:LAB. ${personality} Твоя главная цель — быть полезным экспертом и другом. 
        1. НЕ продавай курс или услуги в лоб. Это запрещено.
        2. Если спросят "как научиться делать так же" или "где ты учился" — тогда мягко упомяни курс (https://telegra.ph/Flagmanskij-kurs-Nejromagiya-10-01-21).
        3. Если спросят "как сделать такой сайт" или про бизнес — тогда упомяни, что делаешь такие решения под ключ (14990р).
        4. В остальных случаях просто отвечай на вопросы по нейросетям, помогай с промптами и шути.`
    };

    try {
        const r = await fetch('https://text.pollinations.ai/', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages:[sys, {role:"user",content:txt}], model:'openai'}) });
        const ans = await r.text();
        document.getElementById(loadID).innerHTML = `<img src="founder.jpg" class="alex-avatar"><div class="msg alex">${marked.parse(ans)}</div>`;
    } catch(e) { document.getElementById(loadID).remove(); showToast("Сбой связи..."); }
    chatBox.scrollTop = chatBox.scrollHeight;
}

// === 4. ПОМОЩНИК ===
const styles = { cyberpunk: "cyberpunk style, neon lights, 8k", realism: "professional photo, 85mm", cinema: "cinematic shot, epic light", disney: "pixar 3d render, cute", anime: "studio ghibli style", fantasy: "dark fantasy, magic", oil: "oil painting", pixel: "pixel art", architecture: "modern architecture", mystic: "mystical, tarot" };
function buildPrompt() {
    const id = document.getElementById('helper-idea').value; const st = document.getElementById('helper-style').value;
    if(!id) return showToast("⚠️ Напиши идею!");
    document.getElementById('prompt-input').value = `${id}, ${styles[st]}, masterpiece`;
    showToast("✅ Промпт перенесен!"); switchTab('art');
}

// === 5. ГЕНЕРАТОР (С КНОПКАМИ ДЕЙСТВИЙ) ===
let lastImageUrl = ""; // Для сохранения ссылки

async function generate() {
    const c = getCredits(); if(c<=0) return;
    const pr = document.getElementById('prompt-input').value; if(!pr) return alert("Поле пустое!");
    localStorage.setItem('alex_credits', c-1); updateUI(); if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

    const btn = document.getElementById('gen-btn'); const res = document.getElementById('result-area');
    btn.disabled = true; btn.innerText = "🔮 МАГИЯ..."; 
    res.innerHTML = '<div style="text-align:center"><div class="loader"></div><div style="font-size:10px;margin-top:10px;color:#00D9FF">Рисуем...</div></div>';
    document.getElementById('promo-box').style.display='none';

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(pr)}?model=${document.getElementById('model-select').value}&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random()*1e6)}`;
    
    // Используем fetch для получения BLOB (нужно для скачивания)
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        lastImageUrl = objectUrl; // Сохраняем для действий

        const img = new Image();
        img.src = objectUrl;
        img.className = 'generated-img';
        
        img.onload = () => { 
            res.innerHTML=''; 
            res.appendChild(img);
            
            // ДОБАВЛЯЕМ КНОПКИ
            const actions = document.createElement('div');
            actions.className = 'action-btn-row';
            actions.innerHTML = `
                <button class="icon-btn" onclick="downloadResult()">💾</button>
                <button class="icon-btn" onclick="shareResult()">📤</button>
            `;
            res.appendChild(actions);

            btn.disabled=false; btn.innerText="ЕЩЕ РАЗ"; 
            document.getElementById('promo-box').style.display='block'; 
            if(tg.HapticFeedback)tg.HapticFeedback.notificationOccurred('success'); 
            document.getElementById('promo-box').scrollIntoView({behavior:"smooth"});
        };
    } catch(e) {
        res.innerText="Ошибка загрузки. Попробуй ещё раз."; 
        btn.disabled=false; 
        localStorage.setItem('alex_credits', c); 
        updateUI();
    }
}

// Функции действий
function downloadResult() {
    if(!lastImageUrl) return;
    const a = document.createElement('a');
    a.href = lastImageUrl;
    a.download = `alex_art_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("💾 Сохранено!");
}

async function shareResult() {
    if(!lastImageUrl) return;
    try {
        const response = await fetch(lastImageUrl);
        const blob = await response.blob();
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        if (navigator.share) {
            await navigator.share({ files: [file] });
        } else {
            showToast("⚠️ Шеринг не поддерживается");
        }
    } catch (e) { showToast("Ошибка шеринга"); }
}

// === 6. ВИРАЛЬНОСТЬ ===
function share() { tg.openTelegramLink(`https://t.me/share/url?url=${TG_BOT_LINK}&text=Зацени этот AI генератор!`); setTimeout(() => { localStorage.setItem('alex_credits', 10); updateUI(); alert("🔋 +5 ЗАРЯДОВ!"); }, 5000); }

updateUI();