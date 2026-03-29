// js/registration.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    
    if (!form) {
        console.error("Форму реєстрації не знайдено!");
        return;
    }

    // Автоматичне очищення полів при завантаженні сторінки (захист від кешу браузера)
    form.reset();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Отримуємо всі елементи форми по ID
        const elements = {
            name: document.getElementById('clientName'),
            phone: document.getElementById('clientPhone'),
            bday: document.getElementById('clientBday'),
            gender: document.getElementById('clientGender'),
            insta: document.getElementById('clientInsta'),
            pass: document.getElementById('clientPassword')
        };

        // 2. Перевірка наявності елементів у HTML
        for (const [key, el] of Object.entries(elements)) {
            if (!el) {
                console.error(`Помилка: Елемент з ID для "${key}" не знайдено в HTML коді!`);
                alert("Помилка конфігурації форми. Зверніться до адміністратора.");
                return;
            }
        }

        // 3. Валідація (мінімальна перевірка на заповнення)
        if (!elements.name.value || !elements.phone.value || !elements.pass.value) {
            alert("Будь ласка, заповніть обов'язкові поля: Ім'я, Телефон та Пароль.");
            return;
        }

        // 4. Підготовка даних для Supabase
        const clientData = {
            full_name: elements.name.value.trim(),
            phone: elements.phone.value.trim(),
            birthday: elements.bday.value || null,
            gender: elements.gender.value,
            instagram: elements.insta.value.trim() || "@",
            password: elements.pass.value, // В прототипі зберігаємо як текст
            bonuses: 500, // Вітальний бонус за реєстрацію
            ltv: 0,
            last_visit: null,
            created_at: new Date().toISOString()
        };

        // Блокуємо кнопку та показуємо статус
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "СТВОРЕННЯ ПРОФІЛЮ...";
        submitBtn.disabled = true;

        try {
            // 5. Відправка даних у таблицю 'clients'
            // Використовуємо .select(), щоб Supabase повернув нам створений запис з його ID
            const { data, error } = await window.db
                .from('clients')
                .insert([clientData])
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                const createdUser = data[0];

                // 6. ЗБЕРЕЖЕННЯ СЕСІЇ: записуємо ID клієнта в браузер
                localStorage.setItem('wella_glow_user_id', createdUser.id);

                alert("Вітаємо! Ваш профіль успішно створено.");
                
                // 7. Редірект на особистий кабінет клієнта
                window.location.href = 'client-dashboard.html';
            }

        } catch (error) {
            console.error('Supabase Error:', error.message);
            alert("Помилка при реєстрації: " + error.message);
            
            // Повертаємо кнопку до робочого стану у разі помилки
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
