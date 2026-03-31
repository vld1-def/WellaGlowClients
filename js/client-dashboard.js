/**
 * WELLA GLOW CRM - CLIENT SIDE ENGINE
 * Version: 2.5 (Mobile Optimized SPA)
 */

// 1. ГЛОБАЛЬНІ ЗМІННІ ТА ІНІЦІАЛІЗАЦІЯ
const userId = localStorage.getItem('wella_glow_user_id');
window.selectedServiceId = null;
window.selectedServiceName = null;
window.selectedServicePrice = 0;
window.selectedMasterId = null;
window.selectedDateValue = null;
window.selectedTimeValue = null;

// Перевірка авторизації
if (!userId) {
    window.location.href = 'login.html';
}

// 2. СТИЛІ (RESET & ANIMATIONS)
const injectStyles = () => {
    if (document.getElementById('glow-app-styles')) return;
    const style = document.createElement('style');
    style.id = 'glow-app-styles';
    style.textContent = `
        /* Видалення курсиву */
        * { font-style: normal !important; }
        
        /* Анімації статусів */
        @keyframes status-pulse-emerald { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); } 70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes status-pulse-amber { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); } 70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
        @keyframes pulse-blur { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }
        
        .pulse-confirmed { animation: status-pulse-emerald 2s infinite; }
        .pulse-pending { animation: status-pulse-amber 2s infinite; }
        .animate-flicker-blur { animation: pulse-blur 4s ease-in-out infinite; }
        
        /* Dropdown */
        .service-dropdown-list { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease; pointer-events: none; }
        .service-dropdown-list.open { max-height: 350px; opacity: 1; pointer-events: auto; overflow-y: auto; }
        
        .category-btn.active { background: rgba(244, 63, 94, 0.2) !important; border-color: #f43f5e !important; color: white !important; }
        .nav-active { background: rgba(244, 63, 94, 0.1) !important; color: #f43f5e !important; }
        .nav-inactive { color: #52525b; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
    `;
    document.head.appendChild(style);
};

// 3. ДОПОМІЖНІ ФУНКЦІЇ
const truncate = (text, limit) => text && text.length > limit ? text.substring(0, limit) + "..." : text;

window.logout = function() {
    localStorage.removeItem('wella_glow_user_id');
    window.location.href = 'login.html';
};

// 4. ЛОГІКА НАВІГАЦІЇ (SPA)
window.scrollToPage = function(index) {
    const scroller = document.getElementById('main-scroller');
    if (scroller) {
        scroller.scrollTo({ left: window.innerWidth * index, behavior: 'smooth' });
        window.updateNav(index);
    }
};

window.updateNav = function(index) {
    const ids = ['btn-profile', 'btn-booking', 'btn-bonuses'];
    ids.forEach((id, i) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.toggle('nav-active', i === index);
            btn.classList.toggle('nav-inactive', i !== index);
        }
    });
};

// 5. ЗАВАНТАЖЕННЯ ДАНИХ (MAIN)
document.addEventListener('DOMContentLoaded', async () => {
    injectStyles();
    
    // Показуємо скелетон/лоадер
    document.getElementById('page-profile').innerHTML = `<div class="flex items-center justify-center h-64"><i class="fa-solid fa-circle-notch animate-spin text-rose-500 text-2xl"></i></div>`;

    try {
        const [client, history, reviews, upcoming, services, masters, bonusPrograms, bonusHistory] = await Promise.all([
            window.db.from('clients').select('*').eq('id', userId).single(),
            window.db.from('appointment_history').select('*, staff(name), services(name)').eq('client_id', userId).order('visit_date', { ascending: false }),
            window.db.from('reviews').select('*').eq('client_id', userId),
            window.db.from('appointments').select('*, staff(name)').eq('client_id', userId).neq('status', 'rejected').order('appointment_date', { ascending: true }),
            window.db.from('services').select('*').order('name'),
            window.db.from('staff').select('*').eq('is_active', true),
            window.db.from('bonus_programs').select('*').eq('is_active', true),
            window.db.from('bonus_history').select('*').eq('client_id', userId).order('created_at', { ascending: false })
        ]);

        window.allServicesData = services.data;
        window.allMastersData = masters.data;

        renderProfileSection(client.data, history.data, reviews.data, upcoming.data);
        renderBookingSection();
        renderBonusesSection(client.data, bonusPrograms.data, bonusHistory.data, history.data);
        
        window.updateNav(0);
    } catch (err) {
        console.error("Критична помилка завантаження:", err);
    }
});

function renderProfileSection(client, history, reviews, upcoming) {
    const container = document.getElementById('page-profile');
    const firstName = client.full_name.split(' ')[0];
    
    let tier = { name: 'SILVER', color: 'zinc-400', icon: 'fa-medal' };
    if (client.ltv >= 15000) tier = { name: 'PLATINUM', color: 'cyan-400', icon: 'fa-gem' };
    else if (client.ltv >= 5000) tier = { name: 'GOLD', color: 'amber-500', icon: 'fa-crown' };

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in">
            <header class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-extrabold text-white tracking-tight italic-none">Вітаємо, ${firstName}! ✨</h2>
                    <p class="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2 leading-none italic-none">Твій день для краси сьогодні</p>
                </div>
                <button onclick="logout()" class="text-zinc-700 hover:text-rose-500 transition"><i class="fa-solid fa-power-off"></i></button>
            </header>

            <!-- КАРТКА ЛОЯЛЬНОСТІ -->
            <div class="glass-panel p-6 rounded-[2rem] border-t-4 border-t-${tier.color} relative overflow-hidden transition-all duration-500">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-${tier.color}/10 rounded-full blur-3xl"></div>
                <div class="flex justify-between items-start mb-10">
                    <div>
                        <p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest leading-none italic-none">Статус лояльності</p>
                        <h3 class="text-xl font-black text-${tier.color} mt-2 uppercase tracking-tighter leading-none italic-none">Glow ${tier.name} Member</h3>
                    </div>
                    <i class="fa-solid ${tier.icon} text-${tier.color} text-xl shadow-lg"></i>
                </div>
                
                <div class="flex justify-between items-end">
                    <p class="text-3xl font-black text-white leading-none italic-none">${client.bonuses} <span class="text-xs font-bold text-zinc-600 ml-1 italic-none">балів</span></p>
                    <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                        <i class="fa-solid fa-qrcode text-zinc-400"></i>
                    </div>
                </div>
            </div>

            <!-- ОРИГІНАЛЬНА КНОПКА ЗАПИСУ -->
            <button onclick="window.scrollToPage(1)" class="neo-gradient w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-rose-500/10 mt-2 transition active:scale-95 italic-none">
                Записатись зараз
            </button>

            <!-- Найближчі візити -->
            <div class="space-y-4">
                ${upcoming.map(app => {
                    let st = { text: 'На розгляді', color: 'bg-amber-500', pulse: 'pulse-pending' };
                    if (app.status === 'confirmed') st = { text: 'Підтверджено', color: 'bg-emerald-500', pulse: 'pulse-confirmed' };
                    return `
                    <div class="p-6 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/20 shadow-xl relative overflow-hidden">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-xs font-black text-zinc-400 uppercase tracking-widest leading-none italic-none">Найближчий візит</h4>
                            <span class="status-badge ${st.color} ${st.pulse} text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic-none">${st.text}</span>
                        </div>
                        <div class="flex justify-between items-end leading-none">
                            <div class="flex gap-6 items-center">
                                <div class="text-center leading-none">
                                    <p class="text-2xl font-black text-white italic-none">${new Date(app.appointment_date).getDate()}</p>
                                    <p class="text-[10px] text-zinc-500 font-bold uppercase mt-1 italic-none">${new Date(app.appointment_date).toLocaleString('uk-UA', {month: 'long'})}</p>
                                </div>
                                <div class="h-10 w-px bg-white/10"></div>
                                <div>
                                    <p class="text-base font-bold text-white tracking-tight leading-none italic-none">${app.service_name}</p>
                                    <p class="text-[11px] text-zinc-500 font-medium mt-2 italic-none">Майстер: <span class="text-zinc-300 font-bold italic-none">${app.staff?.name || '---'}</span> • ${app.appointment_time}</p>
                                </div>
                            </div>
                            <button onclick="window.cancelAppointment('${app.id}', '${userId}')" class="text-[9px] font-black text-zinc-500 hover:text-rose-500 uppercase tracking-widest transition-all italic-none">Скасувати</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <!-- Історія візитів -->
            <div class="glass-panel p-8 rounded-[2.5rem]">
                <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 leading-none italic-none">Історія моїх візитів</h4>
                <div class="space-y-10 italic-none">
                    ${history.map(h => {
                        const review = reviews.find(r => r.appointment_id === h.id);
                        return `
                        <div class="review-container flex flex-col italic-none">
                            <div class="flex items-center justify-between gap-4 italic-none">
                                <div class="flex items-center gap-4 shrink-0 italic-none">
                                    <div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center font-bold text-xs text-zinc-500 uppercase italic-none">
                                        ${new Date(h.visit_date).toLocaleDateString('uk-UA', {day: '2-digit', month: '2-digit'})}
                                    </div>
                                    <div class="min-w-[140px] italic-none">
                                        <p class="text-sm font-bold text-white tracking-tight leading-none italic-none">${h.services?.name || 'Послуга'}</p>
                                        <p class="text-[10px] text-zinc-600 mt-1 font-medium italic-none">Майстер: ${h.staff?.name || 'Майстер'}</p>
                                    </div>
                                </div>
                                <div class="flex-1 flex justify-center">
                                    ${review ? `
                                        <div class="flex flex-col items-center gap-1 italic-none">
                                            <div class="flex gap-0.5 text-amber-500 text-[8px] italic-none">
                                                ${'<i class="fa-solid fa-star"></i>'.repeat(review.rating)}
                                            </div>
                                            <p class="text-[9px] text-zinc-500 font-medium italic-none truncate w-full text-center px-2">${truncate(review.comment, 20)}</p>
                                        </div>
                                    ` : `
                                        <div class="flex gap-1.5 stars-row italic-none" onmouseleave="window.resetStars(this)">
                                            ${[1, 2, 3, 4, 5].map(star => `<i class="fa-solid fa-star text-zinc-800 text-[10px] cursor-pointer transition duration-200" onmouseenter="window.hoverStars(this, ${star})" onclick="window.showReviewInput(this, ${star}, '${h.id}')"></i>`).join('')}
                                        </div>
                                    `}
                                </div>
                                <button onclick="window.repeatBooking('${h.service_id}', '${h.master_id}')" class="px-4 py-2 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition italic-none shrink-0">Повторити</button>
                            </div>
                            <div class="review-input-block hidden mt-3 pt-3 border-t border-white/5 italic-none">
                                <div class="quick-replies hidden flex flex-wrap gap-2 mb-3 italic-none">
                                    <button onclick="window.setQuickText(this, 'Все чудово!')" class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-zinc-400 hover:text-white transition italic-none">Все чудово!</button>
                                    <button onclick="window.setQuickText(this, 'Дуже задоволена')" class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-zinc-400 hover:text-white transition italic-none">Дуже задоволена</button>
                                </div>
                                <div class="flex gap-2 italic-none">
                                    <input type="text" maxlength="100" placeholder="Ваш коментар..." class="input-dark flex-1 !py-2 !px-3 !text-[11px] italic-none">
                                    <button onclick="window.submitReview(this, '${h.id}', '${h.master_id}')" class="bg-emerald-500 hover:bg-emerald-400 text-white px-5 rounded-xl text-[9px] font-black uppercase tracking-widest transition italic-none">OK</button>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}
// --- СЕКЦІЯ 2: ЗАПИС ---
function renderBookingSection() {
    const container = document.getElementById('page-booking');
    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-black text-white uppercase tracking-tighter mb-8">Бронювання</h2>
            
            <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                ${['all', 'Hair', 'Nail', 'Makeup'].map(cat => `<button onclick="window.filterByCategory('${cat}', this)" class="category-btn ${cat === 'all' ? 'active' : ''} px-4 py-2 rounded-xl border border-white/5 bg-white/2 text-[9px] font-black uppercase tracking-widest transition shrink-0">${cat === 'all' ? 'Всі' : cat}</button>`).join('')}
            </div>

            <div class="glass-panel p-5 rounded-[2rem] relative z-dropdown">
                <h4 class="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">1. Послуга</h4>
                <div class="relative">
                    <div onclick="window.toggleServiceDropdown()" class="input-dark w-full flex justify-between items-center cursor-pointer">
                        <span id="selectedServiceText" class="text-zinc-400 text-xs">Оберіть процедуру...</span>
                        <i class="fa-solid fa-chevron-down text-[10px] text-zinc-600" id="dropdownArrow"></i>
                    </div>
                    <div id="serviceDropdownList" class="service-dropdown-list glass-panel absolute w-full mt-2 rounded-2xl border border-white/10 bg-[#0a0a0b] shadow-2xl">
                        <div id="servicesItemsContainer" class="p-2 space-y-1"></div>
                    </div>
                </div>
            </div>

            <div id="mastersSection" class="glass-panel p-5 rounded-[2rem] opacity-30 pointer-events-none transition-all duration-500">
                <h4 class="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">2. Майстер</h4>
                <div class="grid grid-cols-2 gap-3" id="mastersGrid"></div>
            </div>

            <div id="calendarSection" class="glass-panel p-5 rounded-[2rem] opacity-30 pointer-events-none transition-all duration-500">
                <h4 class="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">3. Дата та час</h4>
                <div id="calendarGrid" class="grid grid-cols-7 gap-1 text-center text-[10px]"></div>
                <div id="timeSlots" class="grid grid-cols-3 gap-2 mt-6"></div>
            </div>

            <div class="glass-panel p-6 rounded-[2.5rem] border-t-4 border-t-rose-500 shadow-2xl">
                <div class="space-y-3 mb-6">
                    <div class="flex justify-between text-[10px] font-bold"><span class="text-zinc-500 uppercase">Послуга</span><span id="sumService" class="text-white">---</span></div>
                    <div class="flex justify-between text-[10px] font-bold"><span class="text-zinc-500 uppercase">Майстер</span><span id="sumMaster" class="text-white">---</span></div>
                    <div class="flex justify-between text-[10px] font-bold"><span class="text-zinc-500 uppercase">Дата</span><span id="sumDate" class="text-white">---</span></div>
                    <div class="h-px bg-white/5 my-2"></div>
                    <div class="flex justify-between items-center"><span class="text-xs font-black text-white uppercase">Сума</span><span id="sumPrice" class="text-xl font-black text-emerald-400">₴0</span></div>
                </div>
                <button onclick="window.confirmBooking()" class="neo-gradient w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white">Записатись</button>
            </div>
        </div>
    `;
    window.renderServicesList('all');
}

function renderBonusesSection(client, programs, bonusHistory, visitHistory) {
    const container = document.getElementById('page-bonuses');
    const balance = client?.bonuses || 0;

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in">
            <!-- Зменшений заголовок -->
            <div class="mt-4">
                <h2 class="text-xl font-extrabold text-white uppercase tracking-tighter leading-none italic-none">Бонусна програма</h2>
                <p class="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-2 leading-none italic-none">Твої накопичення та привілеї</p>
            </div>
            
            <!-- Баланс -->
            <div class="glass-panel p-8 rounded-[2rem] border-t-2 border-t-rose-500 relative overflow-hidden shadow-2xl">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl animate-flicker-blur"></div>
                <p class="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic-none">Доступно зараз</p>
                <h3 class="text-5xl font-black text-white tracking-tighter italic-none">${balance.toLocaleString()}</h3>
            </div>

            <!-- Привілеї -->
            <div class="space-y-4">
                <h4 class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 italic-none">Доступні привілеї</h4>
                ${programs.map(p => {
                    const alreadyGot = bonusHistory.some(t => t.reason.toUpperCase() === p.name.toUpperCase());
                    const status = alreadyGot ? { t: 'Нараховано', c: 'text-blue-400 bg-blue-400/10' } : { t: 'Активний', c: 'text-emerald-500 bg-emerald-500/10' };
                    return `
                    <div class="glass-panel p-5 rounded-[2rem] border border-white/5 relative">
                        <div class="flex justify-between items-start mb-4">
                            <span class="px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest ${status.c} italic-none">${status.t}</span>
                            <i class="fa-solid fa-circle-check text-emerald-500 text-[10px]"></i>
                        </div>
                        <p class="text-xs font-black text-white uppercase mb-1 italic-none">${p.name}</p>
                        <p class="text-[10px] text-zinc-500 leading-relaxed italic-none">${p.description}</p>
                    </div>`;
                }).join('')}
            </div>

            <!-- ПОВЕРНЕНО: ІСТОРІЯ ТРАНЗАКЦІЙ -->
            <div class="space-y-4">
                <h4 class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 italic-none">Історія операцій</h4>
                <div class="space-y-3">
                    ${bonusHistory.length > 0 ? bonusHistory.map(t => `
                        <div class="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 group hover:border-white/10 transition italic-none">
                            <div class="flex items-center gap-4 italic-none">
                                <div class="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center italic-none">
                                    <i class="fa-solid ${t.amount > 0 ? 'fa-plus text-emerald-500' : 'fa-minus text-rose-500'} text-[10px]"></i>
                                </div>
                                <div class="italic-none">
                                    <p class="text-xs font-bold text-white tracking-tight italic-none leading-none">${t.reason}</p>
                                    <p class="text-[9px] text-zinc-600 font-black uppercase mt-1.5 italic-none leading-none">${new Date(t.created_at).toLocaleDateString('uk-UA')}</p>
                                </div>
                            </div>
                            <p class="text-sm font-black ${t.amount > 0 ? 'text-emerald-400' : 'text-zinc-500'} italic-none">
                                ${t.amount > 0 ? '+' : ''}${t.amount}
                            </p>
                        </div>
                    `).join('') : '<p class="text-zinc-700 text-[10px] font-black uppercase text-center py-10 italic-none">Транзакцій поки немає</p>'}
                </div>
            </div>
        </div>
    `;
}

// 6. BOOKING LOGIC FUNCTIONS
window.filterByCategory = function(category, btn) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.renderServicesList(category);
    if (!document.getElementById('serviceDropdownList').classList.contains('open')) window.toggleServiceDropdown();
};

window.renderServicesList = function(category) {
    const container = document.getElementById('servicesItemsContainer');
    const services = category === 'all' ? window.allServicesData : window.allServicesData.filter(s => s.category === category);
    container.innerHTML = services.map(s => `<div onclick="window.selectServiceUI('${s.id}', '${s.name}', ${s.price})" class="p-3 rounded-xl hover:bg-white/5 cursor-pointer flex justify-between items-center group"><span class="text-xs font-bold text-zinc-300 group-hover:text-white transition">${s.name}</span><span class="text-[10px] font-black text-zinc-500">₴${s.price}</span></div>`).join('');
};

window.toggleServiceDropdown = () => {
    document.getElementById('serviceDropdownList').classList.toggle('open');
    document.getElementById('dropdownArrow').classList.toggle('rotate-180');
};

window.selectServiceUI = async function(id, name, price, preMasterId = null) {
    document.getElementById('selectedServiceText').innerText = name;
    document.getElementById('selectedServiceText').classList.add('text-white', 'font-extrabold');
    window.selectedServiceId = id;
    window.selectedServiceName = name;
    window.selectedServicePrice = price;
    document.getElementById('sumService').innerText = name;
    document.getElementById('sumPrice').innerText = "₴" + price;
    window.toggleServiceDropdown();
    
    // Активуємо майстрів
    const mSection = document.getElementById('mastersSection');
    const mGrid = document.getElementById('mastersGrid');
    mSection.classList.remove('opacity-30', 'pointer-events-none');
    mGrid.innerHTML = `<p class="col-span-full text-center animate-pulse text-[10px] text-rose-500 font-bold py-4 uppercase">Шукаємо фахівців...</p>`;

    const { data: masters } = await window.db.from('staff_services').select('staff(*)').eq('service_id', id);
    mGrid.innerHTML = masters.map(m => `<div id="master-card-${m.staff.id}" onclick="window.loadMasterAvailability(this, '${m.staff.id}', '${m.staff.name}')" class="master-selector border border-white/5 p-4 rounded-2xl bg-white/2 text-center group transition cursor-pointer"><img src="https://ui-avatars.com/api/?name=${m.staff.name.replace(' ','+')}&background=111113&color=fff" class="w-10 h-10 rounded-full mx-auto mb-2 border border-white/10"><p class="text-[11px] font-bold text-white leading-none">${m.staff.name}</p><p class="text-[7px] text-zinc-600 uppercase mt-2">${m.staff.role || 'Майстер'}</p></div>`).join('');

    if (preMasterId) setTimeout(() => document.getElementById(`master-card-${preMasterId}`)?.click(), 150);
};

window.loadMasterAvailability = async function(el, masterId, name) {
    document.querySelectorAll('.master-selector').forEach(i => i.classList.remove('border-rose-500', 'bg-rose-500/10'));
    el.classList.add('border-rose-500', 'bg-rose-500/10');
    window.selectedMasterId = masterId;
    document.getElementById('sumMaster').innerText = name;
    document.getElementById('calendarSection').classList.remove('opacity-30', 'pointer-events-none');

    const { data: shifts } = await window.db.from('staff_shifts').select('shift_date').eq('staff_id', masterId);
    renderCalendar(shifts?.map(s => s.shift_date) || []);
};

function renderCalendar(availableDates) {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].forEach(d => grid.innerHTML += `<div class="text-[8px] font-black text-zinc-700 uppercase mb-2">${d}</div>`);

    const today = new Date();
    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        const isAv = availableDates.includes(dateStr);
        grid.innerHTML += `<button onclick="${isAv ? `window.selectDate(this, '${dateStr}')` : ''}" class="calendar-day p-3 rounded-xl text-[10px] font-bold border border-white/5 transition ${isAv ? 'bg-white/5 text-white' : 'opacity-10'}">${date.getDate()}</button>`;
    }
}

window.selectDate = async function(el, date) {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('bg-rose-500', 'text-white'));
    el.classList.add('bg-rose-500', 'text-white');
    window.selectedDateValue = date;
    const tGrid = document.getElementById('timeSlots');
    tGrid.innerHTML = `<p class="col-span-3 text-[9px] animate-pulse text-zinc-500 uppercase font-black text-center py-4">Перевірка часу...</p>`;

    const [shift, booked] = await Promise.all([
        window.db.from('staff_shifts').select('start_time, end_time').eq('staff_id', window.selectedMasterId).eq('shift_date', date).single(),
        window.db.from('appointments').select('appointment_time').eq('master_id', window.selectedMasterId).eq('appointment_date', date).neq('status', 'rejected')
    ]);

    if (!shift.data) { tGrid.innerHTML = `<p class="col-span-3 text-[9px] text-rose-500 font-bold uppercase text-center">Вихідний</p>`; return; }

    const start = parseInt(shift.data.start_time), end = parseInt(shift.data.end_time);
    const bt = booked.data.map(b => b.appointment_time.substring(0,5));
    tGrid.innerHTML = '';
    for (let h = start; h < end; h++) {
        const time = `${h}:00`.padStart(5,'0');
        const isB = bt.includes(time);
        tGrid.innerHTML += `<button onclick="${isB ? '' : `window.selectTime(this)`}" class="p-2 rounded-lg border border-white/5 text-[9px] font-black ${isB ? 'opacity-10 bg-zinc-900' : 'bg-white/5 hover:border-rose-500'}">${time}</button>`;
    }
    window.updateSummary();
};

window.selectTime = function(el) {
    document.querySelectorAll('.time-btn').forEach(i => i.classList.remove('bg-rose-500'));
    el.classList.add('bg-rose-500');
    window.selectedTimeValue = el.innerText.trim();
    window.updateSummary();
};

window.updateSummary = function() {
    document.getElementById('sumDate').innerText = window.selectedDateValue ? `${window.selectedDateValue.split('-')[2]}.${window.selectedDateValue.split('-')[1]} ${window.selectedTimeValue || ''}` : '---';
};

window.confirmBooking = async function() {
    if (!window.selectedServiceId || !window.selectedMasterId || !window.selectedDateValue || !window.selectedTimeValue) return alert("Заповніть всі кроки");
    const { error } = await window.db.from('appointments').insert([{ client_id: userId, master_id: window.selectedMasterId, service_id: window.selectedServiceId, service_name: window.selectedServiceName, appointment_date: window.selectedDateValue, appointment_time: window.selectedTimeValue, price: window.selectedServicePrice, status: 'waiting' }]);
    if (!error) { alert("Успішно записано!"); window.location.reload(); }
};

window.repeatBooking = (sid, mid) => { window.scrollToPage(1); window.selectServiceUI(sid, 'Завантаження...', 0, mid); };

// 7. REVIEW SYSTEM FUNCTIONS
window.hoverStars = (el, r) => { const row = el.closest('.stars-row'); row.querySelectorAll('.fa-star').forEach((s, i) => s.classList.toggle('text-amber-500', i < r)); };
window.resetStars = (row) => { const inp = row.closest('.review-container').querySelector('.review-input-block'); if (inp.classList.contains('hidden')) row.querySelectorAll('.fa-star').forEach(s => s.classList.remove('text-amber-500')); };
window.showReviewInput = (el, r, id) => { const parent = el.closest('.review-container'); const ib = parent.querySelector('.review-input-block'); const qr = parent.querySelector('.quick-replies'); ib.classList.remove('hidden'); ib.dataset.rating = r; if (r >= 4) qr.classList.remove('hidden'); else qr.classList.add('hidden'); };
window.setQuickText = (btn, t) => { btn.closest('.review-input-block').querySelector('input').value = t; };
window.submitReview = async (btn, aid, mid) => {
    const parent = btn.closest('.review-container');
    const r = parent.querySelector('.review-input-block').dataset.rating;
    const comm = parent.querySelector('input').value;
    const { error } = await window.db.from('reviews').insert([{ client_id: userId, appointment_id: aid, master_id: mid, rating: parseInt(r), comment: comm }]);
    if (!error) { parent.innerHTML = `<div class="p-4 text-center text-[9px] text-emerald-500 font-black uppercase tracking-widest">Дякуємо за відгук!</div>`; setTimeout(() => window.renderProfilePage(), 2000); }
};

window.cancelAppointment = async (aid, cid) => {
    if (!confirm("Скасувати?")) return;
    const { data } = await window.db.from('clients').select('cancelled_appointments').eq('id', cid).single();
    await window.db.from('appointments').delete().eq('id', aid);
    await window.db.from('clients').update({ cancelled_appointments: (data.cancelled_appointments || 0) + 1 }).eq('id', cid);
    window.renderProfilePage();
};
