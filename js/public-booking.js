// js/public-booking.js

let bookingData = {
    service: null,
    master: null,
    date: null,
    time: null
};

document.addEventListener('DOMContentLoaded', async () => {
    updateAuthUI();
    loadServices();
});
// --- ВІЗУАЛЬНИЙ ЕФЕКТ ВИБОРУ ---
function highlightSelection(containerId, activeElement) {
    const container = document.getElementById(containerId);
    if (!container) return;
    // Знаходимо всі елементи всередині контейнера і знімаємо активний клас
    container.querySelectorAll('.glass-panel, .master-selector').forEach(el => {
        el.classList.remove('border-rose-500', 'bg-rose-500/5');
    });
    // Додаємо активний клас натиснутому елементу
    activeElement.classList.add('border-rose-500', 'bg-rose-500/5');
}
// Перевірка чи залогінений (для кнопки в хедері)
function updateAuthUI() {
    const userId = localStorage.getItem('wella_glow_user_id');
    const container = document.getElementById('auth-status');
    if (userId) {
        container.innerHTML = `<button onclick="location.href='client-dashboard.html'" class="text-[10px] font-black uppercase text-zinc-400 border border-white/10 px-5 py-2 rounded-xl hover:text-white transition">Мій кабінет</button>`;
    } else {
        container.innerHTML = `<button onclick="location.href='login.html'" class="text-[10px] font-black uppercase text-white bg-white/5 px-5 py-2 rounded-xl hover:bg-white/10 transition">Увійти</button>`;
    }
}

// Завантаження послуг
// Знайти цю функцію в js/public-booking.js
async function loadServices() {
    const { data: services } = await window.db.from('services').select('*').order('category');
    const grid = document.getElementById('services-grid');
    
    grid.innerHTML = services.map(s => `
        <!-- Ось цей рядок нижче! Додаємо "this" як четвертий параметр -->
        <div onclick="selectService('${s.id}', '${s.name}', ${s.price}, this)" 
             class="glass-panel p-5 rounded-2xl flex justify-between items-center cursor-pointer hover:border-rose-500/50 transition border border-white/5 group">
            <div>
                <p class="text-sm font-bold text-white group-hover:text-rose-500 transition">${s.name}</p>
                <p class="text-[10px] text-zinc-600 uppercase font-black mt-1">${s.duration} хв</p>
            </div>
            <div class="text-right">
                <p class="text-sm font-black text-white italic-none">₴${s.price}</p>
                <p class="text-[8px] text-rose-500 font-bold uppercase mt-1">Обрати</p>
            </div>
        </div>
    `).join('');
}

// Вибір послуги -> Відкриваємо майстрів
window.selectService = async function(id, name, price, element) {
    bookingData.service = { id, name, price };
    highlightSelection('services-grid', element); // ПІДСВІТКА
    updateSummary();
    
    document.getElementById('step-masters').classList.remove('hidden');
    const grid = document.getElementById('masters-grid');
    grid.innerHTML = '<p class="col-span-full text-center animate-pulse text-[10px] uppercase font-black py-10">Шукаємо вільних майстрів...</p>';

    document.getElementById('step-masters').scrollIntoView({ behavior: 'smooth' });

    const { data: masters } = await window.db.from('staff_services').select('staff(*)').eq('service_id', id);
    
    grid.innerHTML = masters.map(m => `
        <div onclick="selectMaster('${m.staff.id}', '${m.staff.name}', this)" class="master-selector glass-panel p-6 rounded-3xl text-center cursor-pointer hover:border-rose-500 transition border border-white/5">
            <img src="https://ui-avatars.com/api/?name=${m.staff.name.replace(' ','+')}&background=111113&color=fff" class="w-12 h-12 rounded-full mx-auto mb-3">
            <p class="text-xs font-bold text-white">${m.staff.name}</p>
            <p class="text-[8px] text-zinc-600 uppercase mt-1">${m.staff.role}</p>
        </div>
    `).join('');
}

// Вибір майстра -> Відкриваємо календар
window.selectMaster = function(id, name, element) {
    bookingData.master = { id, name };
    highlightSelection('masters-grid', element); // ПІДСВІТКА
    updateSummary();
    document.getElementById('step-time').classList.remove('hidden');
    document.getElementById('step-time').scrollIntoView({ behavior: 'smooth' });
    window.renderPublicCalendar(id);
}

function updateSummary() {
    const content = document.getElementById('summary-content');
    const total = document.getElementById('summary-total');
    
    if (!bookingData.service) return;

    total.classList.remove('hidden');
    content.innerHTML = `
        <div class="flex justify-between text-[11px] font-bold">
            <span class="text-zinc-500 uppercase">Послуга</span>
            <span class="text-white text-right">${bookingData.service.name}</span>
        </div>
        ${bookingData.master ? `
        <div class="flex justify-between text-[11px] font-bold">
            <span class="text-zinc-500 uppercase">Майстер</span>
            <span class="text-white">${bookingData.master.name}</span>
        </div>` : ''}
        ${bookingData.date ? `
        <div class="flex justify-between text-[11px] font-bold">
            <span class="text-zinc-500 uppercase">Дата</span>
            <span class="text-white">${bookingData.date} ${bookingData.time || ''}</span>
        </div>` : ''}
    `;
    document.getElementById('total-price').innerText = `₴${bookingData.service.price}`;
}

// ФІНАЛЬНИЙ КРОК
window.handleFinalConfirm = function() {
    const userId = localStorage.getItem('wella_glow_user_id');

    if (!userId) {
        // Якщо не залогінений — замість редіректу малюємо форму в лівій колонці
        renderInlineAuth();
    } else {
        // Якщо залогінений — відправляємо в базу
        confirmBookingInDatabase(userId);
    }
}
// --- 1. ГОЛОВНА ФУНКЦІЯ КАЛЕНДАРЯ ---
window.renderPublicCalendar = async function(masterId) {
    const grid = document.getElementById('calendar-grid');
    const slotsGrid = document.getElementById('slots-grid');
    
    grid.innerHTML = '<p class="col-span-7 text-center animate-pulse text-[10px] uppercase font-black py-5">Завантаження графіка...</p>';
    slotsGrid.innerHTML = '';

    // Отримуємо робочі дні майстра
    const { data: shifts, error } = await window.db
        .from('staff_shifts')
        .select('shift_date')
        .eq('staff_id', masterId);

    if (error) {
        grid.innerHTML = '<p class="col-span-7 text-rose-500 text-[10px]">Помилка завантаження дат</p>';
        return;
    }

    const availableDates = shifts.map(s => s.shift_date);
    grid.innerHTML = '';

    // Назви днів тижня
    const daysHeader = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    daysHeader.forEach(d => grid.innerHTML += `<div class="text-[9px] font-black text-zinc-600 uppercase mb-2">${d}</div>`);

    const today = new Date();
    
    // Генеруємо 14 днів вперед
    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);

        // Форматуємо дату в локальний YYYY-MM-DD (щоб не було зсуву +1)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`; 

        const isAvailable = availableDates.includes(dateStr);
        
        grid.innerHTML += `
            <button 
                onclick="${isAvailable ? `window.selectPublicDate(this, '${dateStr}')` : ''}" 
                class="calendar-day p-3 rounded-xl text-[11px] font-black border border-white/5 transition
                ${isAvailable ? 'bg-white/5 text-white hover:border-rose-500' : 'opacity-10 cursor-not-allowed'}"
                ${!isAvailable ? 'disabled' : ''}>
                ${date.getDate()}
            </button>
        `;
    }
};

// --- 2. ВИБІР ДАТИ ТА ПЕРЕВІРКА ЧАСУ ---
window.selectPublicDate = async function(el, date) {
    // Стилізація вибраної дати
    document.querySelectorAll('.calendar-day').forEach(d => {
        d.classList.remove('bg-rose-500', 'text-white');
        d.classList.add('bg-white/5');
    });
    el.classList.add('bg-rose-500', 'text-white');
    el.classList.remove('bg-white/5');

    bookingData.date = date;
    bookingData.time = null; // скидаємо час при зміні дати
    updateSummary();

    const slotsGrid = document.getElementById('slots-grid');
    slotsGrid.innerHTML = '<p class="col-span-4 text-center animate-pulse text-[10px] uppercase font-black py-5">Перевірка вільного часу...</p>';

    try {
        // Отримуємо зміну майстра та вже існуючі записи
        const [shiftRes, bookedRes] = await Promise.all([
            window.db.from('staff_shifts').select('start_time, end_time').eq('staff_id', bookingData.master.id).eq('shift_date', date).single(),
            window.db.from('appointments').select('appointment_time').eq('master_id', bookingData.master.id).eq('appointment_date', date).neq('status', 'rejected')
        ]);

        if (!shiftRes.data) {
            slotsGrid.innerHTML = '<p class="col-span-4 text-rose-500 text-[10px] font-black uppercase text-center">Майстер не працює в цей день</p>';
            return;
        }

        // Генерація слотів (наприклад з 10:00 до 20:00 кожну годину)
        const start = parseInt(shiftRes.data.start_time.split(':')[0]);
        const end = parseInt(shiftRes.data.end_time.split(':')[0]);
        const bookedTimes = bookedRes.data.map(b => b.appointment_time.substring(0, 5));

        slotsGrid.innerHTML = '';
        for (let hour = start; hour < end; hour++) {
            const timeStr = `${hour}:00`.padStart(5, '0');
            const isBooked = bookedTimes.includes(timeStr);

            slotsGrid.innerHTML += `
                <button 
                    onclick="${isBooked ? '' : `window.selectPublicTime(this, '${timeStr}')`}" 
                    class="time-slot p-2 rounded-lg border border-white/5 text-[10px] font-black transition
                    ${isBooked ? 'opacity-10 cursor-not-allowed bg-zinc-900' : 'bg-white/5 hover:border-rose-500 text-zinc-400'}"
                    ${isBooked ? 'disabled' : ''}>
                    ${timeStr}
                </button>
            `;
        }

    } catch (e) {
        console.error(e);
        slotsGrid.innerHTML = '<p class="col-span-4 text-rose-500 text-[10px]">Помилка завантаження часу</p>';
    }
};

// --- 3. ВИБІР КОНКРЕТНОГО ЧАСУ ---
window.selectPublicTime = function(el, time) {
    document.querySelectorAll('.time-slot').forEach(t => {
        t.classList.remove('bg-rose-500', 'text-white');
        t.classList.add('bg-white/5', 'text-zinc-400');
    });
    el.classList.add('bg-rose-500', 'text-white');
    el.classList.remove('bg-white/5', 'text-zinc-400');

    bookingData.time = time;
    updateSummary();
};
function renderInlineAuth() {
    const stepServices = document.getElementById('step-services');
    const stepMasters = document.getElementById('step-masters');
    const stepTime = document.getElementById('step-time');

    // Ховаємо попередні кроки для фокусу на авторизації
    [stepServices, stepMasters, stepTime].forEach(el => el.classList.add('opacity-20', 'pointer-events-none'));

    // Створюємо нову секцію авторизації
    const authSection = document.createElement('section');
    authSection.id = 'inline-auth-step';
    authSection.className = 'glass-panel p-10 rounded-[3rem] border-t-4 border-t-rose-500 animate-fade-in mt-10';
    authSection.innerHTML = `
        <h2 class="text-2xl font-black text-white uppercase tracking-tighter mb-2">Останній крок</h2>
        <p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8 leading-none">Увійдіть або зареєструйтесь для підтвердження</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Вхід -->
            <div class="space-y-4">
                <p class="text-[9px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">У мене є акаунт</p>
                <input type="tel" id="inlinePhone" placeholder="Номер телефону" class="input-dark">
                <input type="password" id="inlinePass" placeholder="Пароль" class="input-dark">
                <button onclick="processInlineLogin()" class="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition">Увійти</button>
            </div>
            
            <!-- Реєстрація -->
            <div class="space-y-4 border-l border-white/5 pl-10">
                <p class="text-[9px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Я тут вперше</p>
                <input type="text" id="inlineName" placeholder="Прізвище та Ім'я" class="input-dark">
                <input type="tel" id="inlineNewPhone" placeholder="Номер телефону" class="input-dark">
                <input type="password" id="inlineNewPass" placeholder="Придумати пароль" class="input-dark">
                <button onclick="processInlineRegister()" class="neo-gradient w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl">Створити та записатись</button>
            </div>
        </div>
    `;

    document.querySelector('.lg:col-span-2').appendChild(authSection);
    authSection.scrollIntoView({ behavior: 'smooth' });
}

// Логіка входу прямо в процесі
window.processInlineLogin = async function() {
    const phone = document.getElementById('inlinePhone').value;
    const pass = document.getElementById('inlinePass').value;

    const { data, error } = await window.db.from('clients').select('id').eq('phone', phone).eq('password', pass).single();

    if (data) {
        localStorage.setItem('wella_glow_user_id', data.id);
        confirmBookingInDatabase(data.id);
    } else {
        alert("Невірні дані для входу");
    }
}

// Функція запису в базу ( appointments )
async function confirmBookingInDatabase(userId) {
    const { error } = await window.db.from('appointments').insert([{
        client_id: userId,
        master_id: bookingData.master.id,
        service_id: bookingData.service.id,
        service_name: bookingData.service.name,
        appointment_date: bookingData.date,
        appointment_time: bookingData.time,
        price: bookingData.service.price,
        status: 'waiting'
    }]);

    if (!error) {
        alert("Запис успішно створено! ✨");
        window.location.href = 'client-dashboard.html';
    } else {
        alert("Помилка: " + error.message);
    }
}
// Знайти функцію renderInlineAuth і замінити її
function renderInlineAuth() {
    const stepServices = document.getElementById('step-services');
    const stepMasters = document.getElementById('step-masters');
    const stepTime = document.getElementById('step-time');

    // Ховаємо попередні кроки
    [stepServices, stepMasters, stepTime].forEach(el => {
        if (el) el.classList.add('opacity-20', 'pointer-events-none');
    });

    // Видаляємо стару модалку входу, якщо вона вже була створена
    const oldAuth = document.getElementById('inline-auth-step');
    if (oldAuth) oldAuth.remove();

    // Створюємо нову секцію авторизації
    const authSection = document.createElement('section');
    authSection.id = 'inline-auth-step';
    authSection.className = 'glass-panel p-10 rounded-[3rem] border-t-4 border-t-rose-500 animate-fade-in mt-10';
    authSection.innerHTML = `
        <h2 class="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic-none">Майже готово</h2>
        <p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8 leading-none italic-none">Увійдіть або зареєструйтесь для підтвердження</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Вхід -->
            <div class="space-y-4">
                <p class="text-[9px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">У мене є акаунт</p>
                <input type="tel" id="inlinePhone" placeholder="Номер телефону" class="input-dark">
                <input type="password" id="inlinePass" placeholder="Пароль" class="input-dark">
                <button onclick="window.processInlineLogin()" class="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition italic-none">Увійти</button>
            </div>
            
            <!-- Реєстрація -->
            <div class="space-y-4 border-l border-white/5 pl-10">
                <p class="text-[9px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Я тут вперше</p>
                <input type="text" id="inlineName" placeholder="Прізвище та Ім'я" class="input-dark">
                <input type="tel" id="inlineNewPhone" placeholder="Номер телефону" class="input-dark">
                <input type="password" id="inlineNewPass" placeholder="Придумати пароль" class="input-dark">
                <button onclick="window.processInlineRegister()" class="neo-gradient w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition active:scale-95 italic-none">Створити та записатись</button>
            </div>
        </div>
    `;

    // ВИПРАВЛЕНО: Звертаємось через getElementById('left-column')
    document.getElementById('left-column').appendChild(authSection);
    authSection.scrollIntoView({ behavior: 'smooth' });
}

// --- ФУНКЦІЯ РЕЄСТРАЦІЇ ПРЯМО В ПРОЦЕСІ ЗАПИСУ ---
window.processInlineRegister = async function() {
    const name = document.getElementById('inlineName').value;
    const phone = document.getElementById('inlineNewPhone').value;
    const pass = document.getElementById('inlineNewPass').value;

    if (!name || !phone || !pass) {
        alert("Будь ласка, заповніть всі поля реєстрації");
        return;
    }

    try {
        // 1. Створюємо клієнта
        const { data: newUser, error: regError } = await window.db
            .from('clients')
            .insert([{
                full_name: name,
                phone: phone,
                password: pass,
                bonuses: 500
            }])
            .select();

        if (regError) throw regError;

        if (newUser && newUser[0]) {
            // 2. Створюємо запис про вітальний бонус
            await window.db.from('bonus_history').insert([{
                client_id: newUser[0].id,
                amount: 500,
                type: 'accrual',
                reason: 'WELCOME BONUS'
            }]);

            // 3. Зберігаємо сесію та робимо запис
            localStorage.setItem('wella_glow_user_id', newUser[0].id);
            confirmBookingInDatabase(newUser[0].id);
        }
    } catch (e) {
        alert("Помилка реєстрації: " + e.message);
    }
}
