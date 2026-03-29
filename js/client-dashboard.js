// js/client-dashboard.js

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
    // При завантаженні сторінки одразу показуємо профіль
    window.renderProfilePage();
});

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
    const main = document.querySelector('main');
    const userId = localStorage.getItem('wella_glow_user_id');

    const [clientRes, historyRes, reviewsRes, nextAppRes] = await Promise.all([
        window.db.from('clients').select('*').eq('id', userId).single(),
        window.db.from('appointment_history').select('*').eq('client_id', userId).order('visit_date', { ascending: false }),
        window.db.from('reviews').select('*').eq('client_id', userId),
        window.db.from('appointments').select('*, staff(name)').eq('client_id', userId).order('appointment_date', { ascending: true }).limit(1)
    ]);

    const client = clientRes.data;
    const history = historyRes.data || [];
    const reviews = reviewsRes.data || [];
    const nextApp = nextAppRes.data?.[0];

    if (!client) return;

    // Логіка рангів
    let tier = { name: 'SILVER', color: 'zinc-400', icon: 'fa-medal', discount: '5%' };
    if (client.ltv >= 15000) tier = { name: 'PLATINUM', color: 'cyan-400', icon: 'fa-gem', discount: '15%' };
    else if (client.ltv >= 5000) tier = { name: 'GOLD', color: 'amber-500', icon: 'fa-crown', discount: '10%' };

    // --- ЛОГІКА СТАТУСІВ ЗАПИСУ ---
    let statusUI = { text: 'На розгляді', color: 'bg-amber-500', pulse: 'pulse-pending' };
    if (nextApp?.status === 'confirmed') statusUI = { text: 'Підтверджено', color: 'bg-emerald-500', pulse: 'pulse-confirmed' };
    if (nextApp?.status === 'rejected') statusUI = { text: 'Відхилено', color: 'bg-rose-500', pulse: 'pulse-rejected' };

    const firstName = client.full_name.split(' ')[0];

    main.innerHTML = `
        <header class="flex justify-between items-center mb-10">
            <div>
                <h2 class="text-2xl font-extrabold text-white tracking-tight leading-none">Вітаємо, ${firstName}! ✨</h2>
                <p class="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2 leading-none">Твій день для краси сьогодні</p>
            </div>
            <div class="px-4 py-2 bg-${tier.color}/10 border border-${tier.color}/20 rounded-xl">
                <span class="text-[10px] font-black text-${tier.color} uppercase tracking-[0.2em]">Статус: ${tier.name}</span>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-1 space-y-6">
                <div class="glass-panel p-6 rounded-[2rem] border-t-4 border-t-${tier.color} relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 w-32 h-32 bg-${tier.color}/10 rounded-full blur-3xl"></div>
                    <div class="flex justify-between items-start mb-10">
                        <div>
                            <p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest leading-none">Статус лояльності</p>
                            <h3 class="text-xl font-black text-${tier.color} mt-2 uppercase tracking-tighter leading-none">Glow ${tier.name} Member</h3>
                        </div>
                        <i class="fa-solid ${tier.icon} text-${tier.color} text-xl"></i>
                    </div>
                    <div class="flex justify-between items-end">
                        <div>
                            <p class="text-3xl font-black text-white leading-none">${client.bonuses} <span class="text-xs font-bold text-zinc-600 ml-1">балів</span></p>
                            <p class="text-[9px] text-zinc-500 mt-2 uppercase font-black leading-none">Знижка: ${tier.discount}</p>
                        </div>
                    </div>
                </div>

                <div class="glass-panel p-6 rounded-[2.5rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6">Швидкий запис</h4>
                    <button onclick="window.renderBookingPage()" class="neo-gradient w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-rose-500/10 transition active:scale-95">Забронювати візит</button>
                </div>
            </div>

            <div class="lg:col-span-2 space-y-8">
                <!-- НАЙБЛИЖЧИЙ ЗАПИС З ПУЛЬСУЮЧИМ СТАТУСОМ -->
                ${nextApp ? `
                <div class="p-6 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 shadow-xl relative overflow-hidden">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none">Найближчий запис</h4>
                        <span class="status-badge ${statusUI.color} ${statusUI.pulse} text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                            ${statusUI.text}
                        </span>
                    </div>
                    <div class="flex justify-between items-end">
                        <div class="flex gap-6 items-center">
                            <div class="text-center">
                                <p class="text-2xl font-black text-white leading-none tracking-tighter">${new Date(nextApp.appointment_date).getDate()}</p>
                                <p class="text-[10px] text-zinc-500 font-bold uppercase mt-1 leading-none">${new Date(nextApp.appointment_date).toLocaleString('uk-UA', {month: 'long'})}</p>
                            </div>
                            <div class="h-10 w-px bg-white/10"></div>
                            <div>
                                <p class="text-base font-bold text-white tracking-tight leading-none">${nextApp.service_name}</p>
                                <p class="text-[11px] text-zinc-500 font-medium mt-2">Майстер: <span class="text-zinc-300 font-bold">${nextApp.staff?.name || '---'}</span> • ${nextApp.appointment_time}</p>
                            </div>
                        </div>
                        <button onclick="window.cancelAppointment('${nextApp.id}', '${userId}')" class="text-[9px] font-black text-rose-500/50 hover:text-rose-500 uppercase tracking-widest transition-all">Скасувати візит</button>
                    </div>
                </div>
                ` : '<p class="text-zinc-600 text-[10px] font-bold uppercase tracking-widest p-6 glass-panel rounded-3xl text-center">Активних записів немає</p>'}

                <div class="glass-panel p-8 rounded-[2.5rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 leading-none">Історія моїх візитів</h4>
                    <div class="space-y-6">${history.map(h => `<div class="flex justify-between items-center group"><div class="flex items-center gap-4"><div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center font-bold text-xs text-zinc-500 uppercase">${new Date(h.visit_date).getDate()}.${new Date(h.visit_date).getMonth()+1}</div><div><p class="text-sm font-bold text-white tracking-tight">${h.service_name}</p><p class="text-[10px] text-zinc-500 mt-1 font-medium">Майстер: ${h.master_name}</p></div></div><button onclick="window.renderBookingPage()" class="px-4 py-2 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition">Повторити</button></div>`).join('')}</div>
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
// Функція для відображення сторінки запису
async function renderBookingPage() {
    const main = document.querySelector('main');
    
    // 1. Отримуємо список майстрів з бази для вибору
    const { data: masters } = await window.db.from('staff').select('*').eq('is_active', true);

    main.innerHTML = `
        <header class="flex justify-between items-center mb-10">
            <div>
                <h2 class="text-2xl font-extrabold text-white tracking-tight leading-none">Бронювання візиту</h2>
                <p class="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2 leading-none">Оберіть ідеальний час для вашого сяйва</p>
            </div>
            <button onclick="location.reload()" class="text-[10px] text-zinc-500 hover:text-white transition font-black uppercase tracking-widest">
                <i class="fa-solid fa-xmark mr-1"></i> Скасувати
            </button>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <!-- Крок 1: Послуга -->
                <div class="glass-panel p-6 rounded-[2rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 leading-none text-rose-500">1. Оберіть послугу</h4>
                    <select id="selectService" class="input-dark w-full">
                        <option value="0" data-price="0">Оберіть процедуру...</option>
                        <option value="Складне фарбування" data-price="2800">Складне фарбування (Wella) — ₴2,800</option>
                        <option value="Стрижка та укладка" data-price="850">Стрижка та укладка — ₴850</option>
                        <option value="Манікюр Lux" data-price="1100">Манікюр + Покриття Lux — ₴1,100</option>
                        <option value="Догляд WellaPlex" data-price="1200">Відновлення WellaPlex — ₴1,200</option>
                    </select>
                </div>

                <!-- Крок 2: Майстер -->
                <div class="glass-panel p-6 rounded-[2rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 leading-none text-rose-500">2. Оберіть майстра</h4>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="mastersGrid">
                        ${masters?.map(m => `
                            <div onclick="selectMaster(this, '${m.id}', '${m.name}')" class="master-selector border border-white/5 p-4 rounded-2xl bg-white/2 hover:border-rose-500/50 transition cursor-pointer text-center">
                                <img src="https://ui-avatars.com/api/?name=${m.name.replace(' ','+')}&background=111113&color=fff" class="w-12 h-12 rounded-full mx-auto mb-3 border-2 border-white/5">
                                <p class="text-xs font-bold text-white">${m.name}</p>
                                <p class="text-[9px] text-zinc-500 uppercase mt-1">${m.role || 'Майстер'}</p>
                            </div>
                        `).join('') || '<p class="text-zinc-500 text-xs">Майстри завантажуються...</p>'}
                    </div>
                </div>

                <!-- Крок 3: Дата та Час -->
                <div class="glass-panel p-6 rounded-[2rem]">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 leading-none text-rose-500">3. Дата та час</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input type="date" id="bookDate" class="input-dark">
                        <div class="grid grid-cols-3 gap-2" id="timeSlots">
                            <button onclick="selectTime(this)" class="time-btn text-[10px] font-bold p-2 bg-white/5 rounded-lg border border-white/5 hover:border-rose-500 transition">10:00</button>
                            <button onclick="selectTime(this)" class="time-btn text-[10px] font-bold p-2 bg-white/5 rounded-lg border border-white/5 hover:border-rose-500 transition">12:30</button>
                            <button onclick="selectTime(this)" class="time-btn text-[10px] font-bold p-2 bg-white/5 rounded-lg border border-white/5 hover:border-rose-500 transition">15:00</button>
                            <button onclick="selectTime(this)" class="time-btn text-[10px] font-bold p-2 bg-white/5 rounded-lg border border-white/5 hover:border-rose-500 transition">17:30</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ПІДСУМОК -->
            <div class="lg:col-span-1">
                <div class="glass-panel p-8 rounded-[2.5rem] sticky top-10 border-t-4 border-t-rose-500 shadow-2xl">
                    <h4 class="text-xs font-black text-white uppercase tracking-widest mb-8 text-center">Ваше бронювання</h4>
                    
                    <div class="space-y-4 mb-10">
                        <div class="flex justify-between text-xs font-medium">
                            <span class="text-zinc-500">Послуга:</span>
                            <span id="sumService" class="text-white font-bold">---</span>
                        </div>
                        <div class="flex justify-between text-xs font-medium">
                            <span class="text-zinc-500">Майстер:</span>
                            <span id="sumMaster" class="text-white font-bold">---</span>
                        </div>
                        <div class="flex justify-between text-xs font-medium">
                            <span class="text-zinc-500">Дата:</span>
                            <span id="sumDate" class="text-white font-bold">---</span>
                        </div>
                        <div class="h-px bg-white/5 my-4"></div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-black text-white uppercase italic-none">До сплати:</span>
                            <span id="sumPrice" class="text-2xl font-black text-emerald-400">₴0</span>
                        </div>
                    </div>

                    <button onclick="confirmBooking()" class="neo-gradient w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-rose-500/10 hover:shadow-rose-500/20 transition-all active:scale-95">
                        Підтвердити запис
                    </button>
                </div>
            </div>
        </div>
    `;

    // Додаємо слухач для оновлення підсумку при виборі послуги
    document.getElementById('selectService').addEventListener('change', updateSummary);
    document.getElementById('bookDate').addEventListener('change', updateSummary);
}

// Допоміжні змінні для збереження вибору
let selectedMasterId = null;
let selectedTimeValue = null;

function selectMaster(el, id, name) {
    document.querySelectorAll('.master-selector').forEach(item => item.classList.remove('border-rose-500', 'bg-rose-500/10'));
    el.classList.add('border-rose-500', 'bg-rose-500/10');
    selectedMasterId = id;
    document.getElementById('sumMaster').innerText = name;
}

function selectTime(el) {
    document.querySelectorAll('.time-btn').forEach(item => item.classList.remove('bg-rose-500', 'text-white'));
    el.classList.add('bg-rose-500', 'text-white');
    selectedTimeValue = el.innerText;
    updateSummary();
}

function updateSummary() {
    const serviceSelect = document.getElementById('selectService');
    const dateInput = document.getElementById('bookDate');
    
    const serviceName = serviceSelect.value;
    const price = serviceSelect.options[serviceSelect.selectedIndex].dataset.price;
    
    document.getElementById('sumService').innerText = serviceName !== "0" ? serviceName : "---";
    document.getElementById('sumPrice').innerText = "₴" + (price || 0);
    document.getElementById('sumDate').innerText = (dateInput.value || "---") + (selectedTimeValue ? " о " + selectedTimeValue : "");
}

// ФІНАЛЬНЕ ПІДТВЕРДЖЕННЯ ТА ЗАПИС В БАЗУ
async function confirmBooking() {
    const service = document.getElementById('selectService').value;
    const date = document.getElementById('bookDate').value;
    const clientId = localStorage.getItem('wella_glow_user_id');
    const price = document.getElementById('selectService').options[document.getElementById('selectService').selectedIndex].dataset.price;

    if (!service || service === "0" || !selectedMasterId || !date || !selectedTimeValue) {
        alert("Будь ласка, заповніть усі кроки бронювання");
        return;
    }

    const { error } = await window.db.from('appointments').insert([{
        client_id: clientId,
        master_id: selectedMasterId,
        service_name: service,
        appointment_date: date,
        appointment_time: selectedTimeValue,
        price: parseInt(price),
        status: 'waiting'
    }]);

    if (error) {
        alert("Помилка при записі: " + error.message);
    } else {
        alert("Ви успішно записані! Чекаємо на вас ✨");
        location.reload(); // Повертаємось на головну кабінету
    }
}
