// js/registration.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    
    if (!form) {
        console.error("Форму реєстрації не знайдено!");
        return;
    }

    form.reset();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Отримуємо всі елементи форми
        const elements = {
            name: document.getElementById('clientName'),
            phone: document.getElementById('clientPhone'),
            bday: document.getElementById('clientBday'),
            gender: document.getElementById('clientGender'),
            pass: document.getElementById('clientPassword'),
            // Instagram шукаємо окремо, бо він не обов'язковий в HTML
            insta: document.getElementById('clientInsta')
        };

        // 2. Перевірка наявності ОБОВ'ЯЗКОВИХ елементів у HTML
        const requiredFields = ['name', 'phone', 'bday', 'gender', 'pass'];
        
        for (const field of requiredFields) {
            if (!elements[field]) {
                console.error(`Помилка: Обов'язковий елемент з ID для "${field}" не знайдено в HTML!`);
                alert("Помилка конфігурації форми. Перевірте консоль.");
                return;
            }
        }

        // 3. Валідація заповнення полів користувачем
        if (!elements.name.value || !elements.phone.value || !elements.pass.value) {
            alert("Будь ласка, заповніть Ім'я, Телефон та Пароль.");
            return;
        }

        // 4. Підготовка даних для Supabase
        const clientData = {
            full_name: elements.name.value.trim(),
            phone: elements.phone.value.trim(),
            birthday: elements.bday.value || null,
            gender: elements.gender.value,
            password: elements.pass.value,
            // Якщо інпута немає в HTML або він порожній — записуємо "@"
            instagram: elements.insta ? (elements.insta.value.trim() || "@") : "@",
            bonuses: 500,
            ltv: 0,
            last_visit: null,
            created_at: new Date().toISOString()
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "СТВОРЕННЯ ПРОФІЛЮ...";
        submitBtn.disabled = true;

        try {
            const { data, error } = await window.db
                .from('clients')
                .insert([clientData])
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                localStorage.setItem('wella_glow_user_id', data[0].id);
                window.location.href = 'client-dashboard.html';
            }
            if (data && data[0]) {
                const userId = data[0].id;
                await window.db.from('bonus_history').insert([{
                    client_id: userId,
                    amount: 500,
                    type: 'accrual',
                    reason: 'WELCOME BONUS',
                    created_at: new Date()
                }]);
            }

        } catch (error) {
            console.error('Supabase Error:', error.message);
            alert("Помилка при реєстрації: " + error.message);
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
