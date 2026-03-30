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
async function loadServices() {
    const { data: services } = await window.db.from('services').select('*').order('category');
    const grid = document.getElementById('services-grid');
    
    grid.innerHTML = services.map(s => `
        <div onclick="selectService('${s.id}', '${s.name}', ${s.price})" class="glass-panel p-5 rounded-2xl flex justify-between items-center cursor-pointer hover:border-rose-500/50 transition group">
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
window.selectService = async function(id, name, price) {
    bookingData.service = { id, name, price };
    updateSummary();
    
    document.getElementById('step-masters').classList.remove('hidden');
    const grid = document.getElementById('masters-grid');
    grid.innerHTML = '<p class="col-span-full text-center animate-pulse text-[10px] uppercase font-black py-10">Шукаємо вільних майстрів...</p>';

    // Плавний скрол до наступного кроку
    document.getElementById('step-masters').scrollIntoView({ behavior: 'smooth' });

    const { data: masters } = await window.db.from('staff_services').select('staff(*)').eq('service_id', id);
    
    grid.innerHTML = masters.map(m => `
        <div onclick="selectMaster('${m.staff.id}', '${m.staff.name}')" class="glass-panel p-6 rounded-3xl text-center cursor-pointer hover:border-rose-500 transition">
            <img src="https://ui-avatars.com/api/?name=${m.staff.name.replace(' ','+')}&background=111113&color=fff" class="w-12 h-12 rounded-full mx-auto mb-3">
            <p class="text-xs font-bold text-white">${m.staff.name}</p>
            <p class="text-[8px] text-zinc-600 uppercase mt-1">${m.staff.role}</p>
        </div>
    `).join('');
}

// Вибір майстра -> Відкриваємо календар
window.selectMaster = function(id, name) {
    bookingData.master = { id, name };
    updateSummary();
    document.getElementById('step-time').classList.remove('hidden');
    document.getElementById('step-time').scrollIntoView({ behavior: 'smooth' });
    // Тут логіка рендеру календаря (таку як ми робили в дашборді)
    renderPublicCalendar(id);
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
    
    // Зберігаємо поточний вибір у сесію, щоб не загубити після логіну
    sessionStorage.setItem('pending_booking', JSON.stringify(bookingData));

    if (!userId) {
        alert("Майже готово! Будь ласка, увійдіть у свій профіль, щоб ми знали, на чиє ім'я створити запис.");
        location.href = 'login.html';
    } else {
        // Якщо залогінений - відправляємо в базу (confirmBooking)
        confirmBookingInDatabase();
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
