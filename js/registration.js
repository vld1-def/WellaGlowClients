// js/registration.js
// js/registration.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (!form) return;

    form.reset();

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
                alert("Вітаємо! Ваш профіль успішно створено.");
                window.location.href = 'client-dashboard.html';
            }

        } catch (error) {
            console.error('Помилка реєстрації:', error.message);
            alert("Сталася помилка: " + error.message);
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
});
