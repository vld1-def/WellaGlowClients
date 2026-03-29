// js/client-dashboard.js

// Додай це на самий початок js/client-dashboard.js
(function checkAuth() {
    const userId = localStorage.getItem('wella_glow_user_id');
    if (!userId) {
        window.location.href = 'login.html'; // Відправляємо на вхід, якщо немає сесії
    }
})();

// Далі твій звичайний код завантаження даних...

document.addEventListener('DOMContentLoaded', async () => {
    const clientId = localStorage.getItem('wella_glow_user_id');

    if (!clientId) {
        window.location.href = 'registration.html'; // Якщо не залогінений - на реєстрацію
        return;
    }

    // 1. Отримуємо дані клієнта
    const { data: client, error } = await window.db
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

    if (client) {
        // Заповнюємо інтерфейс
        document.getElementById('clientFirstName').innerText = client.full_name.split(' ')[0];
        document.getElementById('userBonuses').innerText = client.bonuses;
        
        // Рівень лояльності
        const statusName = document.getElementById('statusName');
        if (client.ltv > 5000) {
            statusName.innerText = "Gold VIP";
            statusName.parentElement.className = "text-[10px] font-black text-amber-500 uppercase tracking-widest";
        }

        // 2. Завантажуємо історію візитів
        loadHistory(clientId);
        // 3. Завантажуємо відгуки
        loadReviews(clientId);
    }
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
