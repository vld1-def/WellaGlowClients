// js/client-dashboard.js
// Глобальні змінні для зберігання вибору
window.selectedServiceId = null;
window.selectedServiceName = null;
window.selectedServicePrice = 0;
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
// 1. Отримуємо ID користувача на самому початку
const userId = localStorage.getItem('wella_glow_user_id');

// 2. Одразу перевіряємо авторизацію
if (!userId) {
    window.location.href = 'login.html';
}

// 3. Допоміжні стилі (пульсація)
if (!document.getElementById('status-styles')) {
    const style = document.createElement('style');
    style.id = 'status-styles';
    style.textContent = `
        @keyframes status-pulse-emerald { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes status-pulse-amber { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
        @keyframes status-pulse-rose { 0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(244, 63, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); } }
        .pulse-confirmed { animation: status-pulse-emerald 2s infinite; }
        .pulse-pending { animation: status-pulse-amber 2s infinite; }
        .pulse-rejected { animation: status-pulse-rose 2s infinite; }
    `;
    document.head.appendChild(style);
}
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

// 5. ОНОВЛЕННЯ САЙДБАРУ
window.updateSidebar = function(activeId) {
    const links = { 'profile': document.getElementById('nav-profile'), 'booking': document.getElementById('nav-booking') };
    Object.values(links).forEach(link => {
        if (!link) return;
        link.classList.remove('text-white', 'border-l-2', 'border-rose-500', 'bg-rose-500/5', 'font-bold');
        link.classList.add('text-zinc-400');
        const icon = link.querySelector('i');
        if (icon) icon.classList.remove('text-rose-500');
    });
    const active = links[activeId];
    if (active) {
        active.classList.add('text-white', 'border-l-2', 'border-rose-500', 'bg-rose-500/5', 'font-bold');
        active.classList.remove('text-zinc-400');
        const icon = active.querySelector('i');
        if (icon) icon.classList.add('text-rose-500');
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

// Знайти цей рядок у Promise.all:
window.db.from('appointment_history')
    .select('*, staff(name), services(name)') // Підтягуємо імена з таблиць staff та services
    .eq('client_id', userId)
    .order('visit_date', { ascending: false })
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
    window.updateSidebar('profile');
    const main = document.querySelector('main');
    const userId = localStorage.getItem('wella_glow_user_id');

    // 1. Отримуємо всі дані одним запитом
    const [clientRes, historyRes, reviewsRes, upcomingAppsRes] = await Promise.all([
        window.db.from('clients').select('*').eq('id', userId).single(),
        window.db.from('appointment_history').select('*, staff(name), services(name)').eq('client_id', userId).order('visit_date', { ascending: false }),
        window.db.from('reviews').select('*').eq('client_id', userId),
        window.db.from('appointments').select('*, staff(name)').eq('client_id', userId).neq('status', 'rejected').order('appointment_date', { ascending: true })
    ]);

    const client = clientRes.data;
    const history = historyRes.data || [];
    const reviews = reviewsRes.data || []; // Існуючі відгуки для перевірки
    const upcomingApps = upcomingAppsRes.data || [];

    if (!client) return;

    // --- ЛОГІКА РАНГІВ ЛОЯЛЬНОСТІ ---
    let tier = { name: 'SILVER', color: 'zinc-400', icon: 'fa-medal', discount: '5%' };
    if (client.ltv >= 15000) {
        tier = { name: 'PLATINUM', color: 'cyan-400', icon: 'fa-gem', discount: '15%' };
    } else if (client.ltv >= 5000) {
        tier = { name: 'GOLD', color: 'amber-500', icon: 'fa-crown', discount: '10%' };
    }

    const firstName = client.full_name.split(' ')[0];

    main.innerHTML = `
        <!-- HEADER -->
        <header class="flex justify-between items-center mb-10">
            <div>
                <h2 class="text-2xl font-extrabold text-white tracking-tight leading-none italic-none">Вітаємо, ${firstName}! ✨</h2>
                <p class="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2 leading-none italic-none">Твій день для краси сьогодні</p>
            </div>
            <div class="px-4 py-2 bg-${tier.color}/10 border border-${tier.color}/20 rounded-xl transition-all duration-500">
                <span class="text-[10px] font-black text-${tier.color} uppercase tracking-[0.2em] italic-none">Статус: ${tier.name}</span>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- LEFT COLUMN -->
            <div class="lg:col-span-1 space-y-6">
                <!-- LOYALTY CARD -->
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
                        <div>
                            <p class="text-3xl font-black text-white leading-none italic-none">${client.bonuses} <span class="text-xs font-bold text-zinc-600 ml-1 italic-none">балів</span></p>
                            <p class="text-[9px] text-zinc-500 mt-2 uppercase font-black leading-none italic-none">Знижка на послуги: ${tier.discount}</p>
                        </div>
                        <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                            <i class="fa-solid fa-qrcode text-zinc-400"></i>
                        </div>
                    </div>
                </div>

                <!-- QUICK BOOKING -->
                <div class="glass-panel p-6 rounded-[2.5rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 leading-none italic-none text-zinc-500">Дії</h4>
                    <button onclick="window.renderBookingPage()" class="neo-gradient w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-rose-500/10 mt-2 transition active:scale-95 italic-none">
                        Записатись зараз
                    </button>
                </div>
            </div>

            <!-- RIGHT COLUMN -->
            <div class="lg:col-span-2 space-y-8">
                
                <!-- НАЙБЛИЖЧІ ЗАПИСИ (ЦИКЛОМ) -->
                ${upcomingApps.length > 0 ? upcomingApps.map(app => {
                    let statusUI = { text: 'На розгляді', color: 'bg-amber-500', pulse: 'pulse-pending' };
                    if (app.status === 'confirmed') statusUI = { text: 'Підтверджено', color: 'bg-emerald-500', pulse: 'pulse-confirmed' };
                    if (app.status === 'rejected') statusUI = { text: 'Відхилено', color: 'bg-rose-500', pulse: 'pulse-rejected' };

                    return `
                    <div class="p-6 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/20 mb-4 shadow-xl relative overflow-hidden animate-fade-in">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-xs font-black text-rose-500 uppercase tracking-widest leading-none italic-none">Найближчий візит</h4>
                            <span class="status-badge ${statusUI.color} ${statusUI.pulse} text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic-none">
                                ${statusUI.text}
                            </span>
                        </div>
                        <div class="flex justify-between items-end">
                            <div class="flex gap-6 items-center">
                                <div class="text-center leading-none">
                                    <p class="text-2xl font-black text-white tracking-tighter italic-none">${new Date(app.appointment_date).getDate()}</p>
                                    <p class="text-[10px] text-zinc-500 font-bold uppercase mt-1 italic-none">${new Date(app.appointment_date).toLocaleString('uk-UA', {month: 'long'})}</p>
                                </div>
                                <div class="h-10 w-px bg-white/10"></div>
                                <div>
                                    <p class="text-base font-bold text-white tracking-tight leading-none italic-none">${app.service_name}</p>
                                    <p class="text-[11px] text-zinc-500 font-medium mt-2 italic-none">
                                        Майстер: <span class="text-zinc-300 font-bold">${app.staff?.name || '---'}</span> • ${app.appointment_time}
                                    </p>
                                </div>
                            </div>
                            <button onclick="window.cancelAppointment('${app.id}', '${userId}')" class="text-[9px] font-black text-zinc-500 hover:text-rose-500 uppercase tracking-widest transition-all italic-none">Скасувати</button>
                        </div>
                    </div>
                    `;
                }).join('') : ''}

                <!-- ІСТОРІЯ ВІЗИТІВ + ВІДГУКИ -->
                <div class="glass-panel p-8 rounded-[2.5rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 leading-none italic-none">Історія моїх візитів</h4>
                    <div class="space-y-10">
                        ${history.length > 0 ? history.map(h => {
                            // Перевіряємо, чи вже був відгук для цього візиту
                            const hasReview = reviews.some(r => r.appointment_id === h.id);

                            return `
                            <div class="review-container flex flex-col">
                                <div class="flex justify-between items-center group">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center font-bold text-xs text-zinc-500 uppercase italic-none">
                                            ${new Date(h.visit_date).toLocaleDateString('uk-UA', {day: '2-digit', month: '2-digit'})}
                                        </div>
                                        <div>
                                            <p class="text-sm font-bold text-white tracking-tight leading-none italic-none">${h.services?.name || 'Послуга'}</p>
                                            <p class="text-[10px] text-zinc-500 mt-1 font-medium italic-none">Майстер: ${h.staff?.name || 'Майстер'} • ₴${h.price}</p>
                                        </div>
                                    </div>
                                    <button onclick="window.renderBookingPage('${h.service_id}', '${h.master_id}')" class="px-4 py-2 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition italic-none">Повторити</button>
                                </div>

                                <!-- СЕКЦІЯ ВІДГУКУ -->
                                <div class="mt-4 pt-4 border-t border-white/5">
                                    ${hasReview ? `
                                        <div class="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest italic-none">
                                            <i class="fa-solid fa-check-circle"></i> Відгук залишено
                                        </div>
                                    ` : `
                                        <div class="flex items-center gap-3">
                                            <span class="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic-none">Ваша оцінка:</span>
                                            <div class="flex gap-1.5 stars-row">
                                                ${[1, 2, 3, 4, 5].map(star => `
                                                    <i class="fa-solid fa-star text-zinc-800 text-[10px] cursor-pointer hover:text-amber-500 transition duration-300" 
                                                       onclick="window.showReviewInput(this, ${star}, '${h.id}')"></i>
                                                `).join('')}
                                            </div>
                                        </div>
                                        <div class="review-input-block hidden mt-3 animate-fade-in">
                                            <div class="flex gap-2">
                                                <input type="text" placeholder="Що вам сподобалось? (необов'язково)..." 
                                                       class="input-dark flex-1 !py-2 !px-4 !text-[11px] italic-none">
                                                <button onclick="window.submitReview(this, '${h.id}', '${h.master_id}')" 
                                                        class="bg-emerald-500 hover:bg-emerald-400 text-white px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition active:scale-95 italic-none">
                                                    OK
                                                </button>
                                            </div>
                                        </div>
                                    `}
                                </div>
                            </div>
                            `;
                        }).join('') : '<p class="text-zinc-600 text-xs font-bold uppercase text-center italic-none">У вас ще не було візитів</p>'}
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
// --- 1. ПЕРЕРОБЛЕНА ФУНКЦІЯ ЗАПИСУ (З ПІДТРИМКОЮ ПОВТОРУ) ---
window.renderBookingPage = async function(preServiceId = null, preMasterId = null) {
    window.updateSidebar('booking');
    const main = document.querySelector('main');
    const { data: allServices } = await window.db.from('services').select('*').order('name');

    main.innerHTML = `
        <header class="flex justify-between items-center mb-10">
            <div>
                <h2 class="text-2xl font-extrabold text-white tracking-tight leading-none">Бронювання візиту</h2>
                <p class="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2 leading-none">Оберіть час для вашого запису</p>
            </div>
            <button onclick="window.renderProfilePage()" class="text-[10px] text-zinc-500 hover:text-white transition font-black uppercase tracking-widest">
                <i class="fa-solid fa-xmark mr-1"></i> Назад
            </button>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <div class="glass-panel p-6 rounded-[2rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 text-rose-500">1. Оберіть послугу</h4>
                    <select id="selectService" class="input-dark w-full" onchange="window.filterMastersByService(this)">
                        <option value="0" data-price="0">Оберіть процедуру...</option>
                        ${allServices?.map(s => `
                            <option value="${s.id}" data-name="${s.name}" data-price="${s.price}" ${preServiceId === s.id ? 'selected' : ''}>${s.name} — ₴${s.price}</option>
                        `).join('')}
                    </select>
                </div>

                <div id="mastersSection" class="glass-panel p-6 rounded-[2rem] opacity-30 pointer-events-none transition-all duration-500">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 text-rose-500">2. Оберіть майстра</h4>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="mastersGrid"></div>
                </div>

                <div id="calendarSection" class="glass-panel p-6 rounded-[2rem] opacity-30 pointer-events-none transition-all duration-500">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 text-rose-500">3. Доступні дати</h4>
                    <div id="calendarGrid" class="grid grid-cols-7 gap-2 text-center"></div>
                    <div id="timeSlots" class="grid grid-cols-4 gap-2 mt-8"></div>
                </div>
            </div>

            <div class="lg:col-span-1">
                <div class="glass-panel p-8 rounded-[2.5rem] sticky top-10 border-t-4 border-t-rose-500 shadow-2xl">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 text-center leading-none">Ваше бронювання</h4>
                    <div class="space-y-4 mb-8">
                        <div class="flex justify-between text-[11px] font-bold"><span class="text-zinc-500 uppercase">Послуга</span><span id="sumService" class="text-white uppercase text-right">---</span></div>
                        <div class="flex justify-between text-[11px] font-bold"><span class="text-zinc-500 uppercase">Майстер</span><span id="sumMaster" class="text-white uppercase text-right">---</span></div>
                        <div class="flex justify-between text-[11px] font-bold"><span class="text-zinc-500 uppercase">Дата</span><span id="sumDate" class="text-white uppercase">---</span></div>
                        <div class="h-px bg-white/5 my-4"></div>
                        <div class="flex justify-between items-center"><span class="text-sm font-black text-white uppercase">До сплати</span><span id="sumPrice" class="text-2xl font-black text-emerald-400 tracking-tighter">₴0</span></div>
                    </div>
                    <button onclick="window.confirmBooking()" class="neo-gradient w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl transition active:scale-95">Підтвердити запис</button>
                </div>
            </div>
        </div>
    `;

    // Якщо ми передали дані для повтору — запускаємо ланцюжок вибору
    if (preServiceId) {
        const select = document.getElementById('selectService');
        window.filterMastersByService(select, preMasterId);
    }
};
// Функція показу інпуту після кліку на зірочки
window.showReviewInput = function(btn, rating, appointmentId) {
    const parent = btn.closest('.review-container');
    const inputBlock = parent.querySelector('.review-input-block');
    
    // Підсвічуємо зірочки
    const stars = parent.querySelectorAll('.fa-star');
    stars.forEach((s, index) => {
        s.classList.toggle('text-amber-500', index < rating);
        s.classList.toggle('text-zinc-700', index >= rating);
    });

    // Висуваємо інпут
    inputBlock.classList.remove('hidden');
    inputBlock.dataset.rating = rating;
};
// Відправка відгуку в базу
window.submitReview = async function(btn, appointmentId) {
    const parent = btn.closest('.review-container');
    const comment = parent.querySelector('input').value;
    const rating = parent.querySelector('.review-input-block').dataset.rating;
    const clientId = localStorage.getItem('wella_glow_user_id');

    const { error } = await window.db.from('reviews').insert([{
        client_id: clientId,
        appointment_id: appointmentId,
        rating: parseInt(rating),
        comment: comment,
        created_at: new Date()
    }]);

    if (!error) {
        // Мінімалізуємо: ховаємо форму, показуємо статус "Дякуємо"
        parent.innerHTML = `
            <div class="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-fade-in">
                <i class="fa-solid fa-check-double"></i> Відгук залишено
            </div>
        `;
    }
};
// --- 3. ЗАВАНТАЖЕННЯ ГРАФІКА МАЙСТРА ---
window.loadMasterAvailability = async function(el, masterId, name) {
    document.querySelectorAll('.master-selector').forEach(item => item.classList.remove('border-rose-500', 'bg-rose-500/10'));
    el.classList.add('border-rose-500', 'bg-rose-500/10');
    
    window.selectedMasterId = masterId; // ЗБЕРІГАЄМО ID
    document.getElementById('sumMaster').innerText = name;

    const section = document.getElementById('calendarSection');
    section.classList.remove('opacity-30', 'pointer-events-none');

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

// ФУНКЦІЯ: Вибір часу
window.selectTime = function(el) {
    document.querySelectorAll('.time-btn').forEach(item => {
        item.classList.remove('bg-rose-500', 'text-white');
        item.classList.add('bg-white/5', 'text-zinc-400');
    });
    
    el.classList.add('bg-rose-500', 'text-white');
    el.classList.remove('bg-white/5', 'text-zinc-400');
    
    window.selectedTimeValue = el.innerText.split('\n')[0].trim(); // ЗБЕРІГАЄМО ЧАС
    window.updateSummary(); 
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

    // Перевірка всіх обов'язкових даних
    if (!window.selectedServiceId || !window.selectedMasterId || !window.selectedDateValue || !window.selectedTimeValue) {
        alert("Будь ласка, оберіть послугу, майстра, дату та час візиту.");
        return;
    }

    // Блокуємо кнопку
    const btn = event.target;
    btn.innerText = "ЗБЕРЕЖЕННЯ...";
    btn.disabled = true;

    try {
        const { error } = await window.db
            .from('appointments')
            .insert([{
                client_id: clientId,
                master_id: window.selectedMasterId,
                service_id: window.selectedServiceId, // Додаємо ID послуги
                service_name: window.selectedServiceName, // Додаємо назву для історії
                appointment_date: window.selectedDateValue,
                appointment_time: window.selectedTimeValue,
                price: window.selectedServicePrice,
                status: 'waiting'
            }]);

        if (error) throw error;

        alert("Запис успішно створено! ✨");
        
        // Скидаємо змінні
        window.selectedServiceId = null;
        window.selectedMasterId = null;
        window.selectedDateValue = null;
        window.selectedTimeValue = null;

        window.renderProfilePage();

    } catch (err) {
        console.error(err);
        alert("Помилка: " + err.message);
        btn.innerText = "Підтвердити запис";
        btn.disabled = false;
    }
};
// ФУНКЦІЯ: Вибір послуги
window.filterMastersByService = async function(selectEl) {
    const serviceId = selectEl.value;
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    
    if (serviceId === "0") {
        window.selectedServiceId = null;
        document.getElementById('mastersSection').classList.add('opacity-30', 'pointer-events-none');
        return;
    }

    // Зберігаємо дані послуги
    window.selectedServiceId = serviceId;
    window.selectedServiceName = selectedOption.dataset.name;
    window.selectedServicePrice = parseInt(selectedOption.dataset.price);

    // Оновлюємо праву панель (Summary)
    document.getElementById('sumService').innerText = window.selectedServiceName;
    document.getElementById('sumPrice').innerText = "₴" + window.selectedServicePrice;

    // Далі йде твій код завантаження майстрів (той що був у попередній відповіді)
    const mastersGrid = document.getElementById('mastersGrid');
    const mastersSection = document.getElementById('mastersSection');
    mastersSection.classList.remove('opacity-30', 'pointer-events-none');
    mastersGrid.innerHTML = `<p class="col-span-full text-center animate-pulse text-[10px] text-rose-500 font-bold uppercase py-4">Шукаємо фахівців...</p>`;

    const { data: masters, error } = await window.db
        .from('staff_services')
        .select(`staff (id, name, role, is_active)`)
        .eq('service_id', serviceId);

    if (error || !masters.length) {
        mastersGrid.innerHTML = `<p class="col-span-full text-center text-[10px] text-zinc-500 font-bold uppercase py-4">Майстрів не знайдено</p>`;
        return;
    }

    mastersGrid.innerHTML = masters.map(m => `
        <div onclick="window.loadMasterAvailability(this, '${m.staff.id}', '${m.staff.name}')" class="master-selector border border-white/5 p-4 rounded-2xl bg-white/2 hover:border-rose-500/50 transition cursor-pointer text-center group">
            <img src="https://ui-avatars.com/api/?name=${m.staff.name.replace(' ','+')}&background=111113&color=fff" class="w-10 h-10 rounded-full mx-auto mb-2 border border-white/10">
            <p class="text-[11px] font-bold text-white tracking-tight leading-none">${m.staff.name}</p>
            <p class="text-[8px] text-zinc-500 uppercase mt-2 font-bold leading-none">${m.staff.role || 'Майстер'}</p>
        </div>
    `).join('');
     // В кінці функції завантаження, після того як mastersGrid.innerHTML сформовано:
    if (preMasterId) {
        const masterEl = document.querySelector(`.master-selector[onclick*="${preMasterId}"]`);
        if (masterEl) masterEl.click(); // Автоматично клікаємо по потрібному майстру
    }
};
