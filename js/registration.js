// js/registration.js
// js/registration.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (!form) return;

    form.reset();
 const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Отримуємо 3 основні елементи
        const nameEl = document.getElementById('clientName');
        const phoneEl = document.getElementById('clientPhone');
        const passEl = document.getElementById('clientPassword');

        if (!nameEl || !phoneEl || !passEl) {
            console.error("Помилка: Не знайдено обов'язкові ID полів!");
            return;
        }

        // 2. Формуємо дані для Supabase
        const clientData = {
            full_name: nameEl.value.trim(),
            phone: phoneEl.value.trim(),
            password: passEl.value,
            bonuses: 500, // Вітальний бонус
            ltv: 0,
            gender: null,      // Сховано
            birthday: null,    // Сховано
            instagram: "@",    // Сховано
            last_visit: null,
            created_at: new Date().toISOString()
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "СТВОРЕННЯ...";
        submitBtn.disabled = true;

        try {
            // 3. Записуємо клієнта
            const { data, error } = await window.db
                .from('clients')
                .insert([clientData])
                .select();

            if (error) throw error;

            if (data && data[0]) {
                const newUser = data[0];

                // 4. Обов'язково створюємо транзакцію в історії бонусів (для статусу "Нараховано")
                await window.db.from('bonus_history').insert([{
                    client_id: newUser.id,
                    amount: 500,
                    type: 'accrual',
                    reason: 'WELCOME BONUS',
                    created_at: new Date()
                }]);

                // 5. Зберігаємо сесію та переходимо в кабінет
                localStorage.setItem('wella_glow_user_id', newUser.id);
                window.showGlowToast("Вітаємо! Ваш профіль успішно створено.", "info");
                window.location.href = 'client-dashboard.html';
            }

        } catch (error) {
            console.error('Помилка реєстрації:', error.message);
            window.showGlowToast("Сталася помилка: " + error.message, "error");
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
});
// ГОЛОВНА ФУНКЦІЯ ЗАМІСТЬ ALERT
window.showGlowToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    
    // Вибір іконки та кольору бордера залежно від типу
    let icon = '<i class="fa-solid fa-circle-check text-emerald-500"></i>';
    if (type === 'error') {
        icon = '<i class="fa-solid fa-circle-exclamation text-rose-500"></i>';
        toast.style.borderLeft = '4px solid #f43f5e';
    } else if (type === 'info') {
        icon = '<i class="fa-solid fa-circle-info text-blue-400"></i>';
        toast.style.borderLeft = '4px solid #3b82f6';
    } else {
        toast.style.borderLeft = '4px solid #10b981';
    }

    toast.innerHTML = `
        <div class="text-lg">${icon}</div>
        <div class="flex-1">
            <p class="text-[11px] font-black uppercase tracking-widest text-white leading-tight">${message}</p>
        </div>
    `;

    container.appendChild(toast);

    // Автоматичне видалення через 4 секунди
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};
