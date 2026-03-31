/**
 * WELLA GLOW CRM - CLIENT ENGINE v3.5
 * ПОВНА ЗБІРКА: Свайпи, Бонуси (Отримано/Недоступно), Запис, Відгуки, Toasts
 */

const userId = localStorage.getItem('wella_glow_user_id');
if (!userId) window.location.href = 'login.html';

// Глобальні змінні стану
window.selectedServiceId = null;
window.selectedServiceName = null;
window.selectedServicePrice = 0;
window.selectedMasterId = null;
window.selectedDateValue = null;
window.selectedTimeValue = null;

const truncate = (text, limit) => text && text.length > limit ? text.substring(0, limit) + "..." : text;

// 1. ГЛОБАЛЬНІ СТИЛІ (Toasts, Safe Areas, No Italics)
const injectGlowStyles = () => {
    if (document.getElementById('glow-app-styles')) return;
    const style = document.createElement('style');
    style.id = 'glow-app-styles';
    style.textContent = `
        :root { --sat: env(safe-area-inset-top); --sab: env(safe-area-inset-bottom); }
        * { font-style: normal !important; -webkit-tap-highlight-color: transparent !important; }
        
        /* Мобільна адаптація */
        @media (max-width: 1023px) {
            html, body { height: 100dvh; overflow: hidden; background-color: #050505; }
            #main-scroller section { height: 100dvh; padding-top: calc(20px + var(--sat)) !important; padding-bottom: calc(90px + var(--sab)) !important; }
            aside { bottom: calc(12px + var(--sab)) !important; left: 12px !important; right: 12px !important; width: auto !important; position: fixed !important; }
            .history-card-grid { display: grid !important; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; }
        }
        @media (min-width: 1024px) {
            aside { width: 16rem !important; left: 0 !important; top: 0 !important; height: 100% !important; border-radius: 0 !important; border-right: 1px solid rgba(255,255,255,0.05) !important; }
            .history-card-grid { display: flex; justify-content: space-between; align-items: center; }
        }

        /* Анімації статусів */
        @keyframes status-pulse-emerald { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); } 70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes status-pulse-amber { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); } 70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
        @keyframes pulse-blur { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }
        .pulse-confirmed { animation: status-pulse-emerald 2s infinite; }
        .pulse-pending { animation: status-pulse-amber 2s infinite; }
        .animate-flicker-blur { animation: pulse-blur 4s ease-in-out infinite; }

        /* Зірочки */
        .fa-star.text-amber-500 { color: #f59e0b !important; }
        .fa-star.text-zinc-800 { color: #27272a !important; }

        /* Навігація */
        .nav-active { background: rgba(255, 255, 255, 0.1) !important; color: white !important; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .nav-active i { color: #f43f5e !important; }
        .nav-inactive { color: #52525b; }

        /* Dropdown */
        .service-dropdown-list { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease; pointer-events: none; z-index: 100 !important; }
        .service-dropdown-list.open { max-height: 350px; opacity: 1; pointer-events: auto; }
        .category-btn.active { background: rgba(244, 63, 94, 0.2) !important; border-color: rgba(244, 63, 94, 0.5) !important; color: white !important; }

        /* Toasts */
        .toast-container { position: fixed; top: calc(20px + var(--sat)); left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column; gap: 10px; width: 90%; max-width: 350px; pointer-events: none; }
        .toast-item { background: rgba(20, 20, 22, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid #10b981; padding: 14px; border-radius: 18px; color: white; display: flex; align-items: center; gap: 12px; pointer-events: auto; animation: toast-in 0.4s forwards; }
        @keyframes toast-in { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
    `;
    document.head.appendChild(style);
};

// 2. СИСТЕМА TOAST (ЗАМІСТЬ ALERT)
window.showGlowToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'toast-container'; container.className = 'toast-container'; document.body.appendChild(container); }
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    if (type === 'error') toast.style.borderLeftColor = '#f43f5e';
    if (type === 'info') toast.style.borderLeftColor = '#3b82f6';
    toast.innerHTML = `<div class="text-lg"><i class="fa-solid ${type==='error'?'fa-circle-xmark text-rose-500':(type==='info'?'fa-circle-info text-blue-400':'fa-circle-check text-emerald-500')}"></i></div><div class="flex-1"><p class="text-[10px] font-black uppercase tracking-widest text-white leading-tight">${message}</p></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = '0.4s'; setTimeout(() => toast.remove(), 400); }, 3000);
};

// 3. НАВІГАЦІЯ ТА СВАЙПИ
window.scrollToPage = function(index) {
    const scroller = document.getElementById('main-scroller');
    if (scroller) scroller.scrollTo({ left: window.innerWidth * index, behavior: 'smooth' });
};

window.updateSidebarUI = function(index) {
    const ids = ['nav-profile', 'nav-booking', 'nav-bonuses'];
    ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('nav-active', i === index);
        el.classList.toggle('nav-inactive', i !== index);
        if (window.innerWidth >= 1024 && i === index) el.classList.add('border-l-4', 'border-rose-500');
        else el.classList.remove('border-l-4', 'border-rose-500');
    });
};

// 4. СТАРТ ТА ЗАВАНТАЖЕННЯ ДАНИХ
document.addEventListener('DOMContentLoaded', async () => {
    injectGlowStyles();
    const scroller = document.getElementById('main-scroller');
    if (scroller) { scroller.addEventListener('scroll', () => { const index = Math.round(scroller.scrollLeft / window.innerWidth); window.updateSidebarUI(index); }); }

    try {
        const [client, history, reviews, upcoming, services, bonusPrograms, bonusHistory] = await Promise.all([
            window.db.from('clients').select('*').eq('id', userId).single(),
            window.db.from('appointment_history').select('*, staff(name), services(name)').eq('client_id', userId).order('visit_date', { ascending: false }),
            window.db.from('reviews').select('*').eq('client_id', userId),
            window.db.from('appointments').select('*, staff(name)').eq('client_id', userId).neq('status', 'rejected').order('appointment_date', { ascending: true }),
            window.db.from('services').select('*').order('name'),
            window.db.from('bonus_programs').select('*').eq('is_active', true).order('required_visits', { ascending: true }),
            window.db.from('bonus_history').select('*').eq('client_id', userId).order('created_at', { ascending: false })
        ]);

        window.allServicesData = services.data;
        renderProfileSection(client.data, history.data, reviews.data, upcoming.data, bonusHistory.data);
        renderBookingSection();
        renderBonusesSection(client.data, bonusPrograms.data, bonusHistory.data, history.data, bonusHistory.data);
        window.updateSidebarUI(0);
    } catch (e) { console.error("Data error:", e); }
});

// 5. РЕНДЕР ПРОФІЛЮ
function renderProfileSection(client, history, reviews, upcoming, bonusHistory = []) {
    const container = document.getElementById('page-profile');
    const firstName = client.full_name.split(' ')[0];
    const actualBalance = bonusHistory.reduce((sum, t) => sum + t.amount, 0);
    let tier = { name: 'SILVER', color: 'zinc-400', icon: 'fa-medal' };
    if (client.ltv >= 5000) tier = { name: 'GOLD', color: 'amber-500', icon: 'fa-crown' };
    if (client.ltv >= 15000) tier = { name: 'PLATINUM', color: 'cyan-400', icon: 'fa-gem' };

    container.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <header><h2 class="text-2xl font-extrabold text-white tracking-tight leading-none">Вітаємо, ${firstName}! ✨</h2><p class="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2 leading-none">Твій день для краси сьогодні</p></header>

            <div class="glass-panel p-4 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border-t-4 border-t-${tier.color} relative overflow-hidden transition-all">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-${tier.color}/10 rounded-full blur-3xl animate-flicker-blur"></div>
                <div class="flex justify-between items-start mb-6 lg:mb-10">
                    <div><p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest leading-none">Статус лояльності</p><h3 class="text-lg lg:text-xl font-black text-${tier.color} mt-2 uppercase tracking-tighter leading-none">Glow ${tier.name} Member</h3></div>
                    <i class="fa-solid ${tier.icon} text-${tier.color} text-xl shadow-lg"></i>
                </div>
                <div class="flex justify-between items-end">
                    <p class="text-3xl lg:text-4xl font-black text-white leading-none">${actualBalance.toLocaleString()}<span class="text-xs font-bold text-zinc-600 ml-1">балів</span></p>
                    <div class="w-10 h-10 lg:w-14 lg:h-14 bg-white/5 rounded-xl lg:rounded-2xl flex items-center justify-center border border-white/5"><i class="fa-solid fa-qrcode text-zinc-400 text-xs lg:text-base"></i></div>
                </div>
            </div>

            <button onclick="window.scrollToPage(1)" class="neo-gradient w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-rose-500/10 active:scale-95 transition">Записатись зараз</button>

            <div class="space-y-4">
                ${upcoming.map(app => {
                    let st = { text: 'На розгляді', color: 'bg-amber-500', pulse: 'pulse-pending' };
                    if (app.status === 'confirmed') st = { text: 'Підтверджено', color: 'bg-emerald-500', pulse: 'pulse-confirmed' };
                    return `<div class="p-6 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/20 shadow-xl relative overflow-hidden">
                        <div class="flex justify-between items-center mb-4"><h4 class="text-xs font-black text-zinc-400 uppercase tracking-widest leading-none">Найближчий візит</h4><span class="status-badge ${st.color} ${st.pulse} text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">${st.text}</span></div>
                        <div class="flex justify-between items-end leading-none">
                            <div class="flex gap-6 items-center leading-none">
                                <div class="text-center leading-none"><p class="text-2xl font-black text-white leading-none">${new Date(app.appointment_date).getDate()}</p><p class="text-[10px] text-zinc-500 font-bold uppercase mt-1 leading-none">${new Date(app.appointment_date).toLocaleString('uk-UA', {month: 'long'})}</p></div>
                                <div class="h-10 w-px bg-white/10"></div>
                                <div><p class="text-base font-bold text-white tracking-tight leading-none">${app.service_name}</p><p class="text-[11px] text-zinc-500 font-medium mt-2">Майстер: <span class="text-zinc-300 font-bold">${app.staff?.name || '---'}</span> • ${app.appointment_time}</p></div>
                            </div>
                            <button onclick="window.cancelAppointment('${app.id}', '${userId}')" class="text-[9px] font-black text-zinc-500 hover:text-rose-500 uppercase tracking-widest transition-all">Скасувати</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <div class="glass-panel p-5 lg:p-8 rounded-[2.5rem]">
                <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 leading-none">Історія моїх візитів</h4>
                <div class="space-y-4">
                    ${history.map(h => {
                        const rev = reviews.find(r => r.appointment_id === h.id);
                        return `
                        <div class="review-container flex flex-col p-3 sm:p-4 bg-white/2 border border-white/5 rounded-2xl transition-all duration-300">
                            <div class="history-card-grid">
                                <div class="w-10 h-10 bg-zinc-900 rounded-xl flex flex-col items-center justify-center shrink-0 border border-white/5"><span class="text-[11px] font-black text-white leading-none">${new Date(h.visit_date).getDate()}</span><span class="text-[7px] font-bold text-zinc-500 uppercase mt-0.5">${new Date(h.visit_date).toLocaleString('uk-UA', {month: 'short'})}</span></div>
                                <div class="overflow-hidden px-1 flex flex-col justify-center">
                                    <p class="text-[12px] font-bold text-white truncate leading-none">${h.services?.name || 'Послуга'}</p>
                                    <div class="flex items-center gap-2 mt-2">
                                        ${rev ? `<div class="flex gap-0.5 text-amber-500 text-[7px]">${'★'.repeat(rev.rating)}</div><span class="text-[8px] text-zinc-500 truncate opacity-60">"${truncate(rev.comment, 15)}"</span>` : `<div class="flex gap-1.5 stars-row" onmouseleave="window.resetStars(this)">${[1, 2, 3, 4, 5].map(s => `<i class="fa-solid fa-star text-zinc-800 text-[10px] cursor-pointer transition duration-200" onmouseenter="window.hoverStars(this, ${s})" onclick="window.showReviewInput(this, ${s}, '${h.id}')"></i>`).join('')}</div>`}
                                    </div>
                                </div>
                                <button onclick="window.repeatBooking('${h.service_id}', '${h.master_id}')" class="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-tighter text-zinc-400 hover:text-white transition shrink-0">Повтор</button>
                            </div>
                            <div class="review-input-block hidden mt-3 pt-3 border-t border-white/5 animate-fade-in">
                                <div class="quick-replies hidden flex flex-wrap gap-1.5 mb-3">
                                    <button onclick="window.setQuickText(this, 'Все чудово!')" class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-bold text-zinc-400 hover:text-white transition">Все чудово!</button>
                                    <button onclick="window.setQuickText(this, 'Дуже задоволена')" class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-bold text-zinc-400 hover:text-white transition">Дуже задоволена</button>
                                </div>
                                <div class="flex gap-2"><input type="text" maxlength="100" placeholder="Ваш коментар..." class="input-dark flex-1 !py-2 !px-3 !text-[11px]"><button onclick="window.submitReview(this, '${h.id}', '${h.master_id}')" class="bg-emerald-500 hover:bg-emerald-400 text-white px-4 rounded-xl text-[9px] font-black uppercase transition">OK</button></div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// 6. РЕНДЕР БРОНЮВАННЯ
function renderBookingSection() {
    const container = document.getElementById('page-booking');
    container.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <h2 class="text-2xl font-extrabold text-white tracking-tight uppercase leading-none mb-10">Запис</h2>
            <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5">
                ${['all', 'Hair', 'Nail', 'Makeup'].map(cat => `<button onclick="window.filterByCategory('${cat}', this)" class="category-btn ${cat === 'all' ? 'active' : ''} px-5 py-2.5 rounded-xl border border-white/5 bg-white/2 text-[10px] font-black uppercase tracking-widest transition shrink-0">${cat === 'all' ? 'Всі' : cat}</button>`).join('')}
            </div>
            <div class="glass-panel p-6 rounded-[2rem] relative z-[100]"><h4 class="text-xs font-black text-rose-500 uppercase tracking-widest mb-6 leading-none">1. Послуга</h4><div class="relative"><div onclick="window.toggleServiceDropdown()" id="serviceSelector" class="input-dark w-full flex justify-between items-center cursor-pointer border border-white/10 hover:border-rose-500/50 transition"><span id="selectedServiceText" class="text-zinc-400">Оберіть процедуру...</span><i class="fa-solid fa-chevron-down text-[10px] text-zinc-600" id="dropdownArrow"></i></div><div id="serviceDropdownList" class="service-dropdown-list glass-panel absolute w-full mt-2 rounded-2xl border border-white/10 bg-[#0a0a0b] shadow-2xl"><div id="servicesItemsContainer" class="p-2 space-y-1"></div></div></div></div>
            <div id="mastersSection" class="glass-panel p-6 rounded-[2rem] opacity-30 pointer-events-none transition-all duration-500 relative z-40"><h4 class="text-xs font-black text-rose-500 uppercase tracking-widest mb-6 leading-none">2. Майстер</h4><div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="mastersGrid"></div></div>
            <div id="calendarSection" class="glass-panel p-6 rounded-[2rem] opacity-30 pointer-events-none transition-all duration-500 relative z-30"><h4 class="text-xs font-black text-rose-500 uppercase tracking-widest mb-6 leading-none">3. Дата та час</h4><div id="calendarGrid" class="grid grid-cols-7 gap-2 text-center text-[10px]"></div><div id="timeSlots" class="grid grid-cols-4 gap-2 mt-8"></div></div>
            <div class="glass-panel p-8 rounded-[2.5rem] border-t-4 border-t-rose-500 shadow-2xl">
                <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 text-center leading-none">Ваше бронювання</h4>
                <div class="space-y-4 mb-8">
                    <div class="flex justify-between text-[11px] font-bold"><span class="text-zinc-500 uppercase">Послуга</span><span id="sumService" class="text-white text-right">---</span></div>
                    <div class="flex justify-between text-[11px] font-bold"><span class="text-zinc-500 uppercase">Майстер</span><span id="sumMaster" class="text-white text-right">---</span></div>
                    <div class="flex justify-between text-[11px] font-bold"><span class="text-zinc-500 uppercase">Дата</span><span id="sumDate" class="text-white text-right">---</span></div>
                    <div class="h-px bg-white/5 my-4"></div>
                    <div class="flex justify-between items-center"><span class="text-sm font-black text-white uppercase tracking-tighter">Сума</span><span id="sumPrice" class="text-2xl font-black text-emerald-400">₴0</span></div>
                </div>
                <button onclick="window.confirmBooking()" class="neo-gradient w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl transition active:scale-95 italic-none">Підтвердити запис</button>
            </div>
        </div>`;
    window.renderServicesList('all');
}

// 7. РЕНДЕР БОНУСІВ (ВИПРАВЛЕНО activeProgs)
function renderBonusesSection(client, programs, bonusHistory, visitHistory) {
    const container = document.getElementById('page-bonuses');
    const countVisits = (cat) => visitHistory.filter(v => v.services?.category === cat).length;

    const balance = bonusHistory.reduce((sum, t) => sum + t.amount, 0);

    const earned = bonusHistory.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const spent = Math.abs(bonusHistory.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
    
    const activeProgs = [], lockedProgs = [];
    programs.forEach(p => {
        const count = countVisits(p.service_category);
        const isLocked = count < p.required_visits;
        const alreadyGot = bonusHistory.some(t => t.reason.trim().toLowerCase() === p.name.trim().toLowerCase());
        if (isLocked && !(p.program_type === 'once' && alreadyGot)) lockedProgs.push({...p, count});
        else activeProgs.push({...p, count, alreadyGot});
    });

    container.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <h2 class="text-xl font-extrabold text-white uppercase tracking-tighter leading-none mt-4">Бонусна програма</h2>
            <div class="glass-panel p-8 rounded-[2rem] border-t-2 border-t-rose-500 relative overflow-hidden shadow-2xl">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl animate-flicker-blur"></div>
                <p class="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Доступно зараз</p>
                <h3 class="text-5xl font-black text-white tracking-tighter">${balance.toLocaleString()}</h3>
            </div>
            <div class="space-y-4">
                <h4 class="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2">Твої привілеї</h4>
                ${activeProgs.map(p => {
                    let st = p.program_type === 'once' && p.alreadyGot ? { t: 'Отримано', c: 'text-blue-400 bg-blue-400/10', i: 'fa-check-double' } : { t: 'Активно', c: 'text-emerald-500 bg-emerald-500/10', i: 'fa-circle-check' };
                    return `<div class="glass-panel p-5 rounded-[2rem] border border-white/5 relative">
                        <div class="flex justify-between items-start mb-4"><span class="px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest ${st.c}">${st.t}</span><i class="fa-solid ${st.i} text-[10px] ${st.c.split(' ')[0]}"></i></div>
                        <p class="text-xs font-black text-white uppercase mb-1">${p.name}</p><p class="text-[10px] text-zinc-500 leading-relaxed">${p.description}</p>
                    </div>`;
                }).join('')}
            </div>
            ${lockedProgs.length ? `<div class="space-y-4"><h4 class="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">В процесі</h4>
                ${lockedProgs.map(p => `<div class="glass-panel p-5 rounded-[2rem] border border-white/5 relative opacity-40 grayscale">
                    <div class="flex justify-between items-start mb-4"><span class="px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400">Недоступно</span><i class="fa-solid fa-lock text-zinc-700 text-[10px]"></i></div>
                    <p class="text-xs font-black text-white uppercase mb-1">${p.name}</p>
                    <div class="mt-4 space-y-2"><div class="flex justify-between text-[9px] font-black uppercase text-rose-500"><span>Прогрес</span><span>${p.count}/${p.required_visits}</span></div><div class="h-1 w-full bg-zinc-900 rounded-full"><div class="h-full bg-rose-500" style="width: ${(p.count/p.required_visits)*100}%"></div></div></div>
                </div>`).join('')}</div>` : ''}
            <div class="space-y-4 pb-20"><h4 class="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Історія операцій</h4>
                ${bonusHistory.map(t => `<div class="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 transition"><div class="flex items-center gap-4"><i class="fa-solid ${t.amount > 0 ? 'fa-plus text-emerald-500' : 'fa-minus text-rose-500'} text-[10px]"></i><div><p class="text-xs font-bold text-white tracking-tight">${t.reason}</p><p class="text-[9px] text-zinc-600 font-black uppercase">${new Date(t.created_at).toLocaleDateString()}</p></div></div><p class="text-sm font-black ${t.amount > 0 ? 'text-emerald-400' : 'text-zinc-500'}">${t.amount > 0 ? '+' : ''}${t.amount}</p></div>`).join('')}
            </div>
        </div>`;
}

// 8. BOOKING HELPER FUNCTIONS
window.filterByCategory = (cat, btn) => { document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); window.renderServicesList(cat); if (!document.getElementById('serviceDropdownList').classList.contains('open')) window.toggleServiceDropdown(); };
window.renderServicesList = (cat) => {
    const services = cat === 'all' ? window.allServicesData : window.allServicesData.filter(s => s.category === cat);
    document.getElementById('servicesItemsContainer').innerHTML = services.map(s => `<div onclick="window.selectServiceUI('${s.id}', '${s.name}', ${s.price})" class="p-3 rounded-xl hover:bg-white/5 cursor-pointer flex justify-between items-center group"><span class="text-xs font-bold text-zinc-300 group-hover:text-white transition">${s.name}</span><span class="text-[10px] font-black text-zinc-500">₴${s.price}</span></div>`).join('');
};
window.toggleServiceDropdown = () => { document.getElementById('serviceDropdownList')?.classList.toggle('open'); document.getElementById('dropdownArrow')?.classList.toggle('rotate-180'); };
window.selectServiceUI = async function(id, name, price, preMasterId = null) {
    const textEl = document.getElementById('selectedServiceText'); if (textEl) { textEl.innerText = name; textEl.classList.add('text-white', 'font-extrabold'); }
    window.selectedServiceId = id; window.selectedServiceName = name; window.selectedServicePrice = price;
    document.getElementById('sumService').innerText = name; document.getElementById('sumPrice').innerText = "₴" + price;
    document.getElementById('serviceDropdownList')?.classList.remove('open');
    const mSection = document.getElementById('mastersSection'); mSection.classList.remove('opacity-30', 'pointer-events-none');
    document.getElementById('mastersGrid').innerHTML = `<p class="col-span-full text-center animate-pulse text-[10px] text-rose-500 font-bold py-4 uppercase">Шукаємо фахівців...</p>`;
    const { data: masters } = await window.db.from('staff_services').select('staff(*)').eq('service_id', id);
    document.getElementById('mastersGrid').innerHTML = masters.map(m => `<div id="master-card-${m.staff.id}" onclick="window.loadMasterAvailability(this, '${m.staff.id}', '${m.staff.name}')" class="master-selector border border-white/5 p-4 rounded-2xl bg-white/2 text-center transition cursor-pointer"><img src="https://ui-avatars.com/api/?name=${m.staff.name.replace(' ','+')}&background=111113&color=fff" class="w-10 h-10 rounded-full mx-auto mb-2 border border-white/10"><p class="text-[11px] font-bold text-white leading-none">${m.staff.name}</p><p class="text-[7px] text-zinc-600 uppercase mt-2">${m.staff.role || 'Майстер'}</p></div>`).join('');
    if (preMasterId) setTimeout(() => document.getElementById(`master-card-${preMasterId}`)?.click(), 150);
};
window.loadMasterAvailability = async function(el, mid, name) {
    document.querySelectorAll('.master-selector').forEach(i => i.classList.remove('border-rose-500', 'bg-rose-500/10')); el.classList.add('border-rose-500', 'bg-rose-500/10');
    window.selectedMasterId = mid; document.getElementById('sumMaster').innerText = name; document.getElementById('calendarSection').classList.remove('opacity-30', 'pointer-events-none');
    const { data: shifts } = await window.db.from('staff_shifts').select('shift_date').eq('staff_id', mid);
    const availableDates = (shifts || []).map(s => s.shift_date);
    const grid = document.getElementById('calendarGrid'); grid.innerHTML = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => `<div class="text-[8px] font-black text-zinc-700 uppercase mb-2">${d}</div>`).join('');
    const today = new Date(); for (let i = 0; i < 14; i++) {
        const date = new Date(); date.setDate(today.getDate() + i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const isAv = availableDates.includes(dateStr);
        grid.innerHTML += `<button onclick="${isAv ? `window.selectDate(this, '${dateStr}')` : ''}" class="calendar-day p-3 rounded-xl text-[10px] font-bold border border-white/5 transition ${isAv ? 'bg-white/5 text-white' : 'opacity-10'}">${date.getDate()}</button>`;
    }
};
window.selectDate = async function(el, date) {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('bg-rose-500', 'text-white')); el.classList.add('bg-rose-500', 'text-white'); window.selectedDateValue = date;
    const tGrid = document.getElementById('timeSlots'); tGrid.innerHTML = `<p class="col-span-4 text-[9px] animate-pulse text-zinc-500 uppercase font-black text-center py-4">Перевірка часу...</p>`;
    const [shift, booked] = await Promise.all([window.db.from('staff_shifts').select('start_time, end_time').eq('staff_id', window.selectedMasterId).eq('shift_date', date).single(), window.db.from('appointments').select('appointment_time').eq('master_id', window.selectedMasterId).eq('appointment_date', date).neq('status', 'rejected')]);
    if (!shift.data) { tGrid.innerHTML = `<p class="col-span-4 text-[9px] text-rose-500 font-bold uppercase text-center">Вихідний</p>`; return; }
    const start = parseInt(shift.data.start_time), end = parseInt(shift.data.end_time), bt = (booked.data || []).map(b => b.appointment_time.substring(0,5));
    tGrid.innerHTML = ''; for (let h = start; h < end; h++) {
        const time = `${h}:00`.padStart(5,'0'); const isB = bt.includes(time);
        tGrid.innerHTML += `<button onclick="${isB ? '' : `window.selectTime(this)`}" class="time-btn p-2 rounded-lg border border-white/5 text-[9px] font-black ${isB ? 'opacity-10 bg-zinc-900' : 'bg-white/5 hover:border-rose-500 text-zinc-400'}">${time}</button>`;
    }
    window.updateSummary();
};
window.selectTime = (el) => { document.querySelectorAll('.time-btn').forEach(i => i.classList.remove('bg-rose-500', 'text-white')); el.classList.add('bg-rose-500', 'text-white'); window.selectedTimeValue = el.innerText.trim(); window.updateSummary(); };
window.updateSummary = () => { const d = window.selectedDateValue; document.getElementById('sumDate').innerText = d ? `${d.split('-')[2]}.${d.split('-')[1]} ${window.selectedTimeValue || ''}` : '---'; };
window.confirmBooking = async function() {
    if (!window.selectedServiceId || !window.selectedMasterId || !window.selectedDateValue || !window.selectedTimeValue) return window.showGlowToast("Оберіть всі деталі запису", "error");
    const { error } = await window.db.from('appointments').insert([{ client_id: userId, master_id: window.selectedMasterId, service_id: window.selectedServiceId, service_name: window.selectedServiceName, appointment_date: window.selectedDateValue, appointment_time: window.selectedTimeValue, price: window.selectedServicePrice, status: 'waiting' }]);
    if (!error) { window.showGlowToast("Записано! ✨"); setTimeout(() => window.location.reload(), 1500); }
    else window.showGlowToast(error.message, "error");
};

// 9. REVIEWS, CANCELLATION, REPEAT
window.hoverStars = (el, r) => { el.closest('.stars-row').querySelectorAll('.fa-star').forEach((s, i) => { s.classList.toggle('text-amber-500', i < r); s.classList.toggle('text-zinc-800', i >= r); }); };
window.resetStars = (row) => { const ib = row.closest('.review-container').querySelector('.review-input-block'); if (ib.classList.contains('hidden')) row.querySelectorAll('.fa-star').forEach(s => { s.classList.remove('text-amber-500'); s.classList.add('text-zinc-800'); }); };
window.showReviewInput = (el, r, id) => { const parent = el.closest('.review-container'); const ib = parent.querySelector('.review-input-block'); ib.classList.remove('hidden'); ib.dataset.rating = r; if (r >= 4) ib.querySelector('.quick-replies').classList.remove('hidden'); else ib.querySelector('.quick-replies').classList.add('hidden'); parent.querySelectorAll('.fa-star').forEach((s, i) => { s.classList.toggle('text-amber-500', i < r); s.classList.toggle('text-zinc-800', i >= r); }); };
window.setQuickText = (btn, t) => { btn.closest('.review-input-block').querySelector('input').value = t; };
window.submitReview = async (btn, aid, mid) => {
    const parent = btn.closest('.review-container'); const r = parent.querySelector('.review-input-block').dataset.rating; const comm = parent.querySelector('input').value;
    const { error } = await window.db.from('reviews').insert([{ client_id: userId, appointment_id: aid, master_id: mid, rating: parseInt(r), comment: comm }]);
    if (!error) { window.showGlowToast("Відгук надіслано! Дякуємо ✨"); setTimeout(() => window.location.reload(), 1500); }
};
window.cancelAppointment = async (aid, cid) => {
    if (!confirm("Скасувати візит?")) return;
    const { data: cl } = await window.db.from('clients').select('cancelled_appointments').eq('id', cid).single();
    await window.db.from('appointments').delete().eq('id', aid);
    await window.db.from('clients').update({ cancelled_appointments: (cl.cancelled_appointments || 0) + 1 }).eq('id', cid);
    window.showGlowToast("Запис скасовано", "info"); setTimeout(() => window.location.reload(), 1500);
};
window.repeatBooking = (sid, mid) => {
    // 1. Переходимо на сторінку запису
    window.scrollToPage(1); 

    // Даємо невелику затримку, щоб сторінка прокрутилася
    setTimeout(() => {
        // 2. Шукаємо дані послуги, яку хочемо повторити
        const service = window.allServicesData.find(s => s.id === sid);
        if (!service) {
            window.showGlowToast("Послугу не знайдено в базі", "error");
            return;
        }

        // 3. Знаходимо кнопку категорії (Hair, Nail, Makeup) і натискаємо її
        // Шукаємо по тексту або по атрибуту onclick
        const categoryButtons = document.querySelectorAll('.category-btn');
        let targetBtn = null;

        categoryButtons.forEach(btn => {
            if (btn.getAttribute('onclick').includes(`'${service.category}'`)) {
                targetBtn = btn;
            }
        });

        if (targetBtn) {
            // Викликаємо функцію фільтрації категорій
            window.filterByCategory(service.category, targetBtn);
        }

        // 4. Обираємо саму послугу (з невеликою затримкою для рендеру списку)
        setTimeout(() => {
            window.selectServiceUI(sid, service.name, service.price, mid);
            window.showGlowToast("Дані візиту підтягнуто. Оберіть час! ✨", "info");
        }, 300);

    }, 500); 
};
