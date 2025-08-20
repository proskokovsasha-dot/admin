// Функции для аутентификации

// Регистрация нового пользователя
function register() {
    const fullName = document.getElementById('registerName').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const position = document.getElementById('registerPosition').value;
    const phone = document.getElementById('registerPhone').value;
    const agreeTerms = document.getElementById('termsAgree').checked;
    
    if (!fullName || !username || !password || !position || !phone) {
        showNotification('Заполните все обязательные поля', false);
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают', false);
        return;
    }
    
    if (!agreeTerms) {
        showNotification('Необходимо согласие с условиями использования', false);
        return;
    }
    
    // Проверяем, существует ли уже пользователь
    const users = getUsers();
    if (users[username]) {
        // Изменено: Если пользователь существует, предлагаем войти
        showNotification(`Пользователь с именем "${username}" уже существует. Пожалуйста, войдите в свой аккаунт.`, false);
        // Можно также перенаправить на страницу входа или показать модальное окно для входа
        setTimeout(() => {
            window.location.href = 'index.html'; // Перенаправляем на страницу входа
        }, 2000);
        return;
    }
    
    // Сохраняем пользователя
    users[username] = {
        password: btoa(password), // Простое "шифрование"
        fullName: fullName,
        position: position,
        phone: phone,
        registerDate: new Date().toISOString(),
        stats: {
            totalHours: 0,
            totalEarnings: 0,
            monthlyEarnings: {}
        },
        shifts: []
    };
    
    saveUsers(users);
    showNotification('Аккаунт успешно создан!');
    
    // Автоматически входим после регистрации
    const currentUser = {
        username: username,
        ...users[username]
    };
    
    saveCurrentUser(currentUser);
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}

// Вход пользователя
function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showNotification('Заполните все поля', false);
        return;
    }
    
    // Проверяем, является ли это попыткой входа администратора
    if (username === ADMIN_USERNAME) {
        showNotification('Для входа администратора используйте страницу admin.html', false);
        return;
    }

    // Проверяем существование пользователя
    const users = getUsers();
    if (!users[username] || atob(users[username].password) !== password) {
        showNotification('Неверное имя пользователя или пароль', false);
        return;
    }
    
    // Сохраняем текущего пользователя
    const currentUser = {
        username: username,
        ...users[username]
    };
    
    saveCurrentUser(currentUser);
    showNotification('Вход выполнен успешно!');
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}

// Инициализация обработчиков событий для страниц аутентификации
document.addEventListener('DOMContentLoaded', function() {
    // Обработчик для кнопки входа
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }
    
    // Обработчик для кнопки регистрации
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', register);
    }
    
    // Добавляем обработчики для формы (ввод по Enter)
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (window.location.pathname.includes('register.html')) {
                    register();
                } else {
                    login();
                }
            }
        });
    });
    
    // Анимация появления элементов
    animateAuthElements();
});

// Анимация элементов на страницах аутентификации
function animateAuthElements() {
    const inputs = document.querySelectorAll('.input-group');
    const buttons = document.querySelectorAll('.auth-btn');
    
    inputs.forEach((input, index) => {
        input.style.animationDelay = `${0.1 * index}s`;
        input.classList.add('animate__animated', 'animate__fadeInUp');
    });
    
    buttons.forEach((button, index) => {
        button.style.animationDelay = `${0.1 * (inputs.length + index)}s`;
        button.classList.add('animate__animated', 'animate__fadeInUp');
    });
}
