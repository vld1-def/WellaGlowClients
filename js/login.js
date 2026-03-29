// js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const phone = document.getElementById('loginPhone').value.trim();
        const password = document.getElementById('loginPassword').value;

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "ПЕРЕВІРКА...";
        submitBtn.disabled = true;

        try {
            // 1. Шукаємо клієнта в базі за телефоном та паролем
            const { data, error } = await window.db
                .from('clients')
                .select('id, full_name')
                .eq('phone', phone)
                .eq('password', password)
                .single(); // Очікуємо рівно один запис

            if (error) {
                // Якщо Supabase не знайшов запис, він поверне помилку
                throw new Error("Невірний телефон або пароль");
            }

            if (data) {
                // 2. Якщо знайдено - зберігаємо сесію
                localStorage.setItem('wella_glow_user_id', data.id);
            
                
                // 3. Редірект на кабінет
                window.location.href = 'client-dashboard.html';
            }

        } catch (error) {
            console.error('Помилка входу:', error.message);
            alert("Помилка: " + error.message);
            
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
