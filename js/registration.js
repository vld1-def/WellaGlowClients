// ... після успішного вступу в базу (try/catch блок)
const newUser = data[0]; // Отримуємо дані створеного користувача

// Зберігаємо ID в локальне сховище, щоб "залогінити" користувача
localStorage.setItem('wella_glow_user_id', newUser.id);

alert("Вітаємо! Ви успішно зареєстровані.");
window.location.href = 'client-dashboard.html'; // Редірект на особистий кабінет
