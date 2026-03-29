// js/client-dashboard.js
// Глобальні змінні для збереження вибору клієнта
window.selectedMasterId = null;
window.selectedDateValue = null;
window.selectedTimeValue = null;
// Додай це на самий початок js/client-dashboard.js
(function checkAuth() {
    const userId = localStorage.getItem('wella_glow_user_id');
    if (!userId) {
        window.location.href = 'login.html'; // Відправляємо на вхід, якщо немає сесії
    }
})();

// Далі твій звичайний код завантаження даних...

// 1. ПЕРЕВІРКА АВТОРИЗАЦІЇ ТА ПОЧАТКОВИЙ ЗАВАНТАЖЕННЯ
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('wella_glow_user_id');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    if (userId) {
        window.renderProfilePage();
    }
    // При завантаженні сторінки одразу показуємо профіль
    window.renderProfilePage();
});

// --- 1. ФУНКЦІЯ ПЕРЕМИКАННЯ АКТИВНОГО МЕНЮ ---
window.updateSidebar = function(activeId) {
    const links = {
        'profile': document.getElementById('nav-profile'),
        'booking': document.getElementById('nav-booking')
    };
    
    // Скидаємо всі стилі
    Object.values(links).forEach(link => {
        if (link) {
            link.classList.remove('text-white', 'border-l-2', 'border-rose-500', 'bg-rose-500/5', 'font-bold');
            link.classList.add('text-zinc-400');
            link.querySelector('i').classList.remove('text-rose-500');
        }
    });

    // Встановлюємо активний стиль
    const active = links[activeId];
    if (active) {
        active.classList.add('text-white', 'border-l-2', 'border-rose-500', 'bg-rose-500/5', 'font-bold');
        active.classList.remove('text-zinc-400');
        active.querySelector('i').classList.add('text-rose-500');
    }
};

async function loadHistory(clientId) {
    const { data: history } = await window.db
        .from('appointment_history')
        .select('*')
        .eq('client_id', clientId)
        .order('visit_date', { ascending: false });

    const container = document.getElementById('historyList');
    if (!history || history.length === 0) {
        container.innerHTML = '<p class="text-zinc-600 text-xs uppercase font-bold">У вас ще не було візитів</p>';
        return;
    }

    container.innerHTML = history.map(h => `
        <div class="flex justify-between items-center group">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center font-bold text-xs text-zinc-500 uppercase">
                    ${new Date(h.visit_date).getDate()}.${new Date(h.visit_date).getMonth() + 1}
                </div>
                <div>
                    <p class="text-sm font-bold text-white tracking-tight">${h.service_name}</p>
                    <p class="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Майстер: ${h.master_name} • ₴${h.price}</p>
                </div>
            </div>
            <button class="px-4 py-2 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition">Повторити</button>
        </div>
    `).join('');
}

// js/client-dashboard.js

// Додаємо стилі для пульсації статусів
const style = document.createElement('style');
style.textContent = `
    @keyframes status-pulse-emerald { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
    @keyframes status-pulse-amber { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
    @keyframes status-pulse-rose { 0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(244, 63, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); } }
    .pulse-confirmed { animation: status-pulse-emerald 2s infinite; }
    .pulse-pending { animation: status-pulse-amber 2s infinite; }
    .pulse-rejected { animation: status-pulse-rose 2s infinite; }
`;
document.head.appendChild(style);

window.renderProfilePage = async function() {
    window.updateSidebar('profile'); // Робимо вкладку активною в меню
    const main = document.querySelector('main');
    const userId = localStorage.getItem('wella_glow_user_id');

    // 1. Отримуємо дані (Клієнт, Історія, Відгуки, Всі записи без ліміту)
    const [clientRes, historyRes, reviewsRes, upcomingAppsRes] = await Promise.all([
        window.db.from('clients').select('*').eq('id', userId).single(),
        window.db.from('appointment_history').select('*').eq('client_id', userId).order('visit_date', { ascending: false }),
        window.db.from('reviews').select('*').eq('client_id', userId),
        window.db.from('appointments').select('*, staff(name)').eq('client_id', userId).neq('status', 'rejected').order('appointment_date', { ascending: true })
    ]);

    const client = clientRes.data;
    const history = historyRes.data || [];
    const reviews = reviewsRes.data || [];
    const upcomingApps = upcomingAppsRes.data || [];

    if (!client) return;

    // --- ЛОГІКА РАНГІВ ---
    let tier = { name: 'SILVER', color: 'zinc-400', icon: 'fa-medal', discount: '5%' };
    if (client.ltv >= 15000) tier = { name: 'PLATINUM', color: 'cyan-400', icon: 'fa-gem', discount: '15%' };
    else if (client.ltv >= 5000) tier = { name: 'GOLD', color: 'amber-500', icon: 'fa-crown', discount: '10%' };

    const firstName = client.full_name.split(' ')[0];

    main.innerHTML = `
        <!-- HEADER -->
        <header class="flex justify-between items-center mb-10">
            <div>
                <h2 class="text-2xl font-extrabold text-white tracking-tight leading-none">Вітаємо, ${firstName}! ✨</h2>
                <p class="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2 leading-none">Твій день для краси сьогодні</p>
            </div>
            <div class="px-4 py-2 bg-${tier.color}/10 border border-${tier.color}/20 rounded-xl">
                <span class="text-[10px] font-black text-${tier.color} uppercase tracking-widest">Статус: ${tier.name}</span>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- LEFT COLUMN: STATUS & BOOKING -->
            <div class="lg:col-span-1 space-y-6">
                
                <!-- LOYALTY CARD (ТВІЙ ОРИГІНАЛЬНИЙ СТИЛЬ) -->
                <div class="glass-panel p-6 rounded-[2rem] border-t-4 border-t-${tier.color} relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 w-32 h-32 bg-${tier.color}/10 rounded-full blur-3xl"></div>
                    <div class="flex justify-between items-start mb-10">
                        <div>
                            <p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest leading-none">Статус лояльності</p>
                            <h3 class="text-xl font-black text-${tier.color} mt-2 uppercase tracking-tighter leading-none">Glow ${tier.name} Member</h3>
                        </div>
                        <i class="fa-solid ${tier.icon} text-${tier.color} text-xl shadow-lg"></i>
                    </div>
                    
                    <div class="flex justify-between items-end">
                        <div>
                            <p class="text-3xl font-black text-white leading-none">${client.bonuses} <span class="text-xs font-bold text-zinc-600 ml-1 italic-none">балів</span></p>
                            <p class="text-[9px] text-zinc-500 mt-2 uppercase font-black leading-none">Знижка на послуги: ${tier.discount}</p>
                        </div>
                        <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                            <i class="fa-solid fa-qrcode text-zinc-400"></i>
                        </div>
                    </div>
                </div>

                <!-- QUICK BOOKING -->
                <div class="glass-panel p-6 rounded-[2.5rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 leading-none">Швидкий запис</h4>
                    <div class="space-y-4">
                        <button onclick="window.renderBookingPage()" class="neo-gradient w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-rose-500/10 mt-2 transition active:scale-95">
                            Забронювати візит
                        </button>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: HISTORY & REVIEWS -->
            <div class="lg:col-span-2 space-y-8">
                
                <!-- БЛОК ЗАПИСІВ (ТЕПЕР ЦИКЛОМ) -->
                ${upcomingApps.length > 0 ? upcomingApps.map(app => {
                    // Логіка статусів
                    let statusUI = { text: 'На розгляді', color: 'bg-amber-500', pulse: 'pulse-pending' };
                    if (app.status === 'confirmed') statusUI = { text: 'Підтверджено', color: 'bg-emerald-500', pulse: 'pulse-confirmed' };
                    if (app.status === 'rejected') statusUI = { text: 'Відхилено', color: 'bg-rose-500', pulse: 'pulse-rejected' };

                    return `
                    <div class="p-6 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/20 mb-4 shadow-xl relative overflow-hidden">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-xs font-black text-rose-500 uppercase tracking-widest leading-none">Найближчий запис</h4>
                            <span class="status-badge ${statusUI.color} ${statusUI.pulse} text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                                ${statusUI.text}
                            </span>
                        </div>
                        <div class="flex justify-between items-end">
                            <div class="flex gap-6 items-center">
                                <div class="text-center">
                                    <p class="text-2xl font-black text-white leading-none tracking-tighter">${new Date(app.appointment_date).getDate()}</p>
                                    <p class="text-[10px] text-zinc-500 font-bold uppercase mt-1 leading-none">${new Date(app.appointment_date).toLocaleString('uk-UA', {month: 'long'})}</p>
                                </div>
                                <div class="h-10 w-px bg-white/10"></div>
                                <div>
                                    <p class="text-base font-bold text-white tracking-tight leading-none">${app.service_name}</p>
                                    <p class="text-[11px] text-zinc-500 font-medium mt-2 italic-none">
                                        Майстер: <span class="text-zinc-300 font-bold">${app.staff?.name || '---'}</span> • ${app.appointment_time}
                                    </p>
                                </div>
                            </div>
                            <button onclick="window.cancelAppointment('${app.id}', '${userId}')" class="text-[9px] font-black text-zinc-400 hover:text-rose-500 uppercase tracking-widest transition-all">Скасувати</button>
                        </div>
                    </div>
                    `;
                }).join('') : ''}

                <!-- HISTORY -->
                <div class="glass-panel p-8 rounded-[2.5rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 leading-none">Історія моїх візитів</h4>
                    <div class="space-y-6">
                        ${history.map(h => `
                            <div class="flex justify-between items-center group">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center font-bold text-xs text-zinc-500 uppercase leading-none">
                                        ${new Date(h.visit_date).toLocaleDateString('uk-UA', {day: '2-digit', month: '2-digit'})}
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-white tracking-tight leading-none italic-none">${h.service_name}</p>
                                        <p class="text-[10px] text-zinc-500 mt-1 font-medium italic-none">Майстер: ${h.master_name} • ₴${h.price}</p>
                                    </div>
                                </div>
                                <button onclick="window.renderBookingPage()" class="px-4 py-2 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition">Повторити</button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- REVIEWS -->
                <div class="glass-panel p-8 rounded-[2.5rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 leading-none italic-none">Мої відгуки</h4>
                    <div class="space-y-4">
                        ${reviews.map(r => `
                            <div class="p-4 bg-white/2 rounded-2xl border border-white/5 relative">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="text-amber-500 text-[10px]">
                                        ${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}
                                    </div>
                                    <span class="text-[9px] text-zinc-600 font-bold uppercase tracking-widest italic-none">${new Date(r.created_at).toLocaleDateString('uk-UA')}</span>
                                </div>
                                <p class="text-xs text-zinc-300 font-medium leading-relaxed italic-none">«${r.comment}»</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

            </div>
        </div>
    `;
};

// --- ФУНКЦІЯ СКАСУВАННЯ ЗАПИСУ ---
window.cancelAppointment = async function(appointmentId, clientId) {
    if (!confirm("Ти дійсно хочеш скасувати цей запис?")) return;

    try {
        // 1. Видаляємо запис з таблиці appointments
        const { error: deleteError } = await window.db
            .from('appointments')
            .delete()
            .eq('id', appointmentId);

        if (deleteError) throw deleteError;

        // 2. Отримуємо поточне значення cancelled_appointments
        const { data: clientData, error: fetchError } = await window.db
            .from('clients')
            .select('cancelled_appointments')
            .eq('id', clientId)
            .single();

        if (fetchError) throw fetchError;

        // 3. Оновлюємо лічильник (+1)
        const currentCancelled = clientData.cancelled_appointments || 0;
        const { error: updateError } = await window.db
            .from('clients')
            .update({ cancelled_appointments: currentCancelled + 1 })
            .eq('id', clientId);

        if (updateError) throw updateError;

        alert("Запис скасовано. Сподіваємось побачитись наступного разу! ✨");
        window.renderProfilePage(); // Перемальовуємо сторінку

    } catch (err) {
        console.error("Помилка при скасуванні:", err.message);
        alert("Не вдалося скасувати запис. Спробуй пізніше.");
    }
};
async function loadReviews(clientId) {
    const { data: reviews } = await window.db
        .from('reviews')
        .select('*')
        .eq('client_id', clientId);

    const container = document.getElementById('myReviewsList');
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p class="text-zinc-600 text-xs uppercase font-bold">Ви ще не залишали відгуків</p>';
        return;
    }

    container.innerHTML = reviews.map(r => `
        <div class="p-4 bg-white/2 rounded-2xl border border-white/5">
            <div class="flex text-amber-500 text-[8px] gap-0.5 mb-2">
                ${Array(r.rating).fill('<i class="fa-solid fa-star"></i>').join('')}
            </div>
            <p class="text-xs text-zinc-300 font-medium leading-relaxed">${r.comment}</p>
        </div>
    `).join('');
}

function logout() {
    localStorage.removeItem('wella_glow_user_id');
    window.location.href = 'login.html';
}
// --- 2. ОНОВЛЕНИЙ РЕНДЕР СТОРІНКИ ЗАПИСУ ---
window.renderBookingPage = async function() {
    window.updateSidebar('booking'); // Робимо меню активним
    const main = document.querySelector('main');
    
    const { data: masters } = await window.db.from('staff').select('*').eq('is_active', true);

    main.innerHTML = `
        <header class="flex justify-between items-center mb-10">
            <div>
                <h2 class="text-2xl font-extrabold text-white tracking-tight">Бронювання візиту</h2>
                <p class="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2">Оберіть свого майстра та час</p>
            </div>
            <button onclick="window.renderProfilePage()" class="text-[10px] text-zinc-500 hover:text-white transition font-black uppercase tracking-widest">
                <i class="fa-solid fa-xmark mr-1"></i> Назад
            </button>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                
                <!-- КРОК 1: ПОСЛУГА -->
                <div class="glass-panel p-6 rounded-[2rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 text-rose-500">1. Оберіть послугу</h4>
                    <select id="selectService" class="input-dark w-full" onchange="window.updateSummary()">
                        <option value="0" data-price="0">Оберіть процедуру...</option>
                        <option value="Складне фарбування" data-price="2800">Складне фарбування (Wella) — ₴2,800</option>
                        <option value="Стрижка та укладка" data-price="850">Стрижка та укладка — ₴850</option>
                        <option value="Манікюр Lux" data-price="1100">Манікюр + Покриття — ₴1,100</option>
                    </select>
                </div>

                <!-- КРОК 2: МАЙСТЕР -->
                <div class="glass-panel p-6 rounded-[2rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 text-rose-500">2. Оберіть майстра</h4>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        ${masters?.map(m => `
                            <div onclick="window.loadMasterAvailability(this, '${m.id}', '${m.name}')" class="master-selector border border-white/5 p-4 rounded-2xl bg-white/2 hover:border-rose-500/50 transition cursor-pointer text-center">
                                <img src="https://ui-avatars.com/api/?name=${m.name.replace(' ','+')}&background=111113&color=fff" class="w-10 h-10 rounded-full mx-auto mb-2 border border-white/10">
                                <p class="text-[11px] font-bold text-white">${m.name}</p>
                                <p class="text-[8px] text-zinc-500 uppercase">${m.role || 'Майстер'}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- КРОК 3: КАЛЕНДАР (ДИНАМІЧНИЙ) -->
                <div id="calendarSection" class="glass-panel p-6 rounded-[2rem] opacity-30 pointer-events-none transition-all duration-500">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 text-rose-500">3. Доступні дати</h4>
                    <div id="calendarGrid" class="grid grid-cols-7 gap-2 text-center">
                        <!-- Дні завантажаться після вибору майстра -->
                        <p class="col-span-7 text-[10px] text-zinc-600 uppercase font-bold py-4">Спершу оберіть майстра</p>
                    </div>
                    
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mt-8 mb-4 text-rose-500">Доступний час</h4>
                    <div id="timeSlots" class="grid grid-cols-4 gap-2">
                        <!-- Час завантажиться після вибору дати -->
                    </div>
                </div>
            </div>

            <!-- SUMMARY -->
            <div class="lg:col-span-1">
                <div class="glass-panel p-8 rounded-[2.5rem] sticky top-10 border-t-4 border-t-rose-500">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 text-center leading-none">Ваше бронювання</h4>
                    <div class="space-y-4 mb-8">
                        <div class="flex justify-between text-[11px]"><span class="text-zinc-500 font-bold uppercase">Послуга</span><span id="sumService" class="text-white font-black">---</span></div>
                        <div class="flex justify-between text-[11px]"><span class="text-zinc-500 font-bold uppercase">Майстер</span><span id="sumMaster" class="text-white font-black">---</span></div>
                        <div class="flex justify-between text-[11px]"><span class="text-zinc-500 font-bold uppercase">Дата</span><span id="sumDate" class="text-white font-black">---</span></div>
                        <div class="h-px bg-white/5 my-4"></div>
                        <div class="flex justify-between items-center"><span class="text-sm font-black text-white uppercase tracking-tighter">До сплати</span><span id="sumPrice" class="text-2xl font-black text-emerald-400">₴0</span></div>
                    </div>
                    <button onclick="window.confirmBooking()" class="neo-gradient w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition active:scale-95">Підтвердити запис</button>
                </div>
            </div>
        </div>
    `;
};

// --- 3. ЗАВАНТАЖЕННЯ ГРАФІКА МАЙСТРА ---
window.loadMasterAvailability = async function(el, masterId, name) {
    // Стиль для вибраного майстра
    document.querySelectorAll('.master-selector').forEach(item => item.classList.remove('border-rose-500', 'bg-rose-500/10'));
    el.classList.add('border-rose-500', 'bg-rose-500/10');
    
    window.selectedMasterId = masterId;
    document.getElementById('sumMaster').innerText = name;

    // Активуємо секцію календаря
    const section = document.getElementById('calendarSection');
    section.classList.remove('opacity-30', 'pointer-events-none');

    // Отримуємо зміни майстра з таблиці staff_shifts (припускаємо, що така є)
    // Якщо немає таблиці, можна просто дозволити всі дні крім вихідних
    const { data: shifts } = await window.db.from('staff_shifts').select('shift_date').eq('staff_id', masterId);
    const availableDates = shifts?.map(s => s.shift_date) || [];

    renderCalendar(availableDates);
};

// --- 4. МАЛЮЄМО КАЛЕНДАР ---
function renderCalendar(availableDates) {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    days.forEach(d => grid.innerHTML += `<div class="text-[9px] font-black text-zinc-600 uppercase mb-2">${d}</div>`);

    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);

        // ПРАВИЛЬНЕ ФОРМУВАННЯ ДАТИ (локальне YYYY-MM-DD)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`; 

        // Перевіряємо чи є ця дата у масиві доступних дат від майстра
        const isAvailable = availableDates.includes(dateStr);
        
        grid.innerHTML += `
            <button 
                onclick="${isAvailable ? `window.selectDate(this, '${dateStr}')` : ''}" 
                class="calendar-day p-3 rounded-xl text-[11px] font-bold border border-white/5 transition
                ${isAvailable ? 'bg-white/5 text-white hover:border-rose-500' : 'opacity-10 cursor-not-allowed'}"
                ${!isAvailable ? 'disabled' : ''}>
                ${date.getDate()}
            </button>
        `;
    }
}

// --- ВИБІР ДАТИ ТА ПЕРЕВІРКА ВІЛЬНИХ СЛОТІВ ---
window.selectDate = async function(el, date) {
    // 1. Візуальний стиль вибраної дати
    document.querySelectorAll('.calendar-day').forEach(d => {
        d.classList.remove('bg-rose-500', 'text-white');
        d.classList.add('bg-white/5');
    });
    el.classList.add('bg-rose-500', 'text-white');
    el.classList.remove('bg-white/5');

    window.selectedDateValue = date;
    const timeGrid = document.getElementById('timeSlots');
    timeGrid.innerHTML = '<p class="col-span-4 text-[10px] text-zinc-600 uppercase font-bold animate-pulse">Перевірка часу...</p>';

    try {
        // 2. Отримуємо робочу зміну майстра
        const { data: shift } = await window.db
            .from('staff_shifts')
            .select('start_time, end_time')
            .eq('staff_id', window.selectedMasterId)
            .eq('shift_date', date)
            .single();

        // 3. Отримуємо вже існуючі записи (appointments) на цей день
        const { data: bookedSlots } = await window.db
            .from('appointments')
            .select('appointment_time')
            .eq('master_id', window.selectedMasterId)
            .eq('appointment_date', date)
            .not('status', 'eq', 'rejected'); // Не рахуємо відхилені записи

        if (!shift) {
            timeGrid.innerHTML = '<p class="col-span-4 text-[10px] text-rose-400 uppercase font-bold">Майстер вихідний у цей день</p>';
            return;
        }

        // 4. ГЕНЕРУЄМО СІТКУ ЧАСУ (наприклад, кожні 60 хв)
        const slots = [];
        let current = parseInt(shift.start_time.split(':')[0]);
        const end = parseInt(shift.end_time.split(':')[0]);

        while (current < end) {
            const timeStr = `${current}:00`;
            // Перевіряємо чи час заброньовано
            const isBooked = bookedSlots.some(b => b.appointment_time.startsWith(timeStr));
            slots.push({ time: timeStr, booked: isBooked });
            current++;
        }

        // 5. МАЛЮЄМО КНОПКИ ЧАСУ
        timeGrid.innerHTML = slots.map(s => `
            <button 
                onclick="${s.booked ? '' : 'window.selectTime(this)'}" 
                class="time-btn p-2 rounded-lg border border-white/5 text-[10px] font-black transition
                ${s.booked ? 'opacity-10 cursor-not-allowed bg-zinc-900' : 'bg-white/5 hover:border-rose-500 text-zinc-400'}"
                ${s.booked ? 'disabled' : ''}>
                ${s.time}
                ${s.booked ? '<span class="block text-[7px] text-rose-500">Зайнято</span>' : ''}
            </button>
        `).join('');

    } catch (err) {
        console.error(err);
        timeGrid.innerHTML = '<p class="text-xs text-rose-500">Помилка завантаження</p>';
    }

    window.updateSummary();
};

// Допоміжні змінні для збереження вибору
let selectedMasterId = null;
let selectedTimeValue = null;

function selectMaster(el, id, name) {
    document.querySelectorAll('.master-selector').forEach(item => item.classList.remove('border-rose-500', 'bg-rose-500/10'));
    el.classList.add('border-rose-500', 'bg-rose-500/10');
    selectedMasterId = id;
    document.getElementById('sumMaster').innerText = name;
}

// --- ВИБІР ЧАСУ ---
window.selectTime = function(el) {
    document.querySelectorAll('.time-btn').forEach(item => {
        item.classList.remove('bg-rose-500', 'text-white');
        item.classList.add('bg-white/5', 'text-zinc-400');
    });
    
    el.classList.add('bg-rose-500', 'text-white');
    el.classList.remove('bg-white/5', 'text-zinc-400');
    
    window.selectedTimeValue = el.innerText.split('\n')[0].trim(); 
    window.updateSummary(); // Оновлюємо підсумок
};

window.updateSummary = function() {
    // 1. Отримуємо дані про послугу
    const serviceSelect = document.getElementById('selectService');
    if (!serviceSelect) return;

    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    const serviceName = serviceSelect.value !== "0" ? serviceSelect.value : "---";
    const price = selectedOption ? selectedOption.dataset.price : 0;

    // 2. Отримуємо елементи підсумку
    const elSumService = document.getElementById('sumService');
    const elSumPrice = document.getElementById('sumPrice');
    const elSumDate = document.getElementById('sumDate');

    // 3. Відображаємо назву послуги та ціну
    if (elSumService) elSumService.innerText = serviceName;
    if (elSumPrice) elSumPrice.innerText = "₴" + (price || 0);
    
    // 4. Формуємо рядок дати та часу
    if (elSumDate) {
        let displayDate = "---";
        
        if (window.selectedDateValue) {
            // Форматуємо дату з 2026-03-31 у 31.03
            const d = new Date(window.selectedDateValue);
            displayDate = d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
        }

        const displayTime = window.selectedTimeValue ? " о " + window.selectedTimeValue : "";
        elSumDate.innerText = (window.selectedDateValue ? displayDate : "---") + displayTime;
    }
};

// --- ФІНАЛЬНА ФУНКЦІЯ ПІДТВЕРДЖЕННЯ ЗАПИСУ ---
window.confirmBooking = async function() {
    const clientId = localStorage.getItem('wella_glow_user_id');
    
    // 1. Отримуємо елемент селекту послуг
    const serviceSelect = document.getElementById('selectService');
    if (!serviceSelect) {
        console.error("Елемент #selectService не знайдено");
        return;
    }

    const serviceName = serviceSelect.value;
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    const price = selectedOption ? selectedOption.dataset.price : 0;

    // 2. ВАЛІДАЦІЯ: Перевіряємо, чи клієнт все обрав
    // Тепер ми беремо дату і час із ГЛОБАЛЬНИХ ЗМІННИХ, а не з інпутів
    if (serviceName === "0" || !window.selectedMasterId || !window.selectedDateValue || !window.selectedTimeValue) {
        alert("Будь ласка, оберіть послугу, майстра, дату та час візиту.");
        return;
    }

    // Блокуємо кнопку, щоб уникнути подвійних кліків
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "ОБРОБКА...";
    btn.disabled = true;

    try {
        // 3. ВІДПРАВКА В SUPABASE
        const { data, error } = await window.db
            .from('appointments')
            .insert([{
                client_id: clientId,
                master_id: window.selectedMasterId,
                service_name: serviceName,
                appointment_date: window.selectedDateValue,
                appointment_time: window.selectedTimeValue,
                price: parseInt(price),
                status: 'waiting' // Статус за замовчуванням "На розгляді"
            }]);

        if (error) throw error;

        // 4. УСПІХ
        alert("Запис успішно створено! Очікуйте на підтвердження адміністратором. ✨");
        
        // Очищаємо змінні перед поверненням
        window.selectedMasterId = null;
        window.selectedDateValue = null;
        window.selectedTimeValue = null;

        // Повертаємось у профіль
        window.renderProfilePage();

    } catch (err) {
        console.error("Помилка бронювання:", err.message);
        alert("Не вдалося створити запис: " + err.message);
        
        // Повертаємо кнопку в робочий стан
        btn.innerText = originalText;
        btn.disabled = false;
    }
};
