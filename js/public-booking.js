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
