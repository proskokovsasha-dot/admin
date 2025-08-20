// Утилиты и общие функции

// Константы
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = '54491472'; // Пароль для администратора
const DEFAULT_HOURLY_RATE = 120; // 120 руб/час

// Получить почасовую ставку
function getHourlyRate() {
    const rate = localStorage.getItem('hourlyRate');
    return rate ? parseFloat(rate) : DEFAULT_HOURLY_RATE;
}

// Установить почасовую ставку
function setHourlyRate(rate) {
    localStorage.setItem('hourlyRate', rate.toString());
}

// Показать уведомление
function showNotification(message, isSuccess = true) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    // Устанавливаем иконку в зависимости от типа уведомления
    const icon = notification.querySelector('i');
    if (isSuccess) {
        icon.className = 'fas fa-check-circle';
        notification.classList.remove('error', 'warning');
        notification.classList.add('success'); // Добавляем класс success
    } else {
        icon.className = 'fas fa-exclamation-circle';
        notification.classList.remove('success', 'warning');
        notification.classList.add('error'); // Добавляем класс error
    }

    notification.querySelector('span').textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Получить данные о пользователях из localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
}

// Сохранить данные о пользователях в localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Получить текущего пользователя
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Сохранить текущего пользователя
function saveCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Удалить текущего пользователя (выход)
function removeCurrentUser() {
    localStorage.removeItem('currentUser');
}

// Получить данные о смене пользователя
function getUserShiftData(username) {
    return JSON.parse(localStorage.getItem(`shift_${username}`));
}

// Сохранить данные о смене пользователя
function saveUserShiftData(username, data) {
    localStorage.setItem(`shift_${username}`, JSON.stringify(data));
}

// Удалить данные о смене пользователя
function removeUserShiftData(username) {
    localStorage.removeItem(`shift_${username}`);
}

// НОВЫЕ ФУНКЦИИ ДЛЯ ПОСЕЩЕНИЙ ВНЕ СМЕНЫ
// Получить все записи о посещениях
function getAllVisitRecords() {
    return JSON.parse(localStorage.getItem('visitRecords') || '[]');
}

// Добавить новую запись о посещении
function addVisitRecord(record) {
    const records = getAllVisitRecords();
    records.push(record);
    localStorage.setItem('visitRecords', JSON.stringify(records));
}

// Удалить все записи о посещениях для конкретного пользователя (при удалении пользователя)
function removeUserVisitRecords(username) {
    let records = getAllVisitRecords();
    records = records.filter(record => record.username !== username);
    localStorage.setItem('visitRecords', JSON.stringify(records));
}
// КОНЕЦ НОВЫХ ФУНКЦИЙ

// Форматирование времени
function formatTime(ms) {
    const hours = Math.floor(ms / 1000 / 60 / 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const seconds = Math.floor((ms / 1000) % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Форматирование даты (исправлено)
function formatDate(dateString) {
    const date = new Date(dateString);
    // Проверяем, является ли дата валидной
    if (isNaN(date.getTime())) {
        return 'Неизвестно';
    }
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Форматирование даты и времени
function formatDateTime(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Неизвестно';
    }
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Проверка, авторизован ли пользователь
function checkAuth() {
    const currentUser = getCurrentUser();
    const path = window.location.pathname;
    const isAuthPage = path.includes('index.html') || path.includes('register.html');
    const isAdminPage = path.includes('admin.html');

    // Если пользователь не авторизован и находится не на странице аутентификации/админа, перенаправляем на index.html
    if (!currentUser && !isAuthPage && !isAdminPage) {
        window.location.href = 'index.html';
        return null;
    }

    // Если пользователь авторизован и пытается зайти на страницу аутентификации, перенаправляем на dashboard.html
    if (currentUser && isAuthPage && currentUser.username !== ADMIN_USERNAME) {
        window.location.href = 'dashboard.html';
        return null;
    }
    
    // Если админ авторизован и пытается зайти на страницу аутентификации, перенаправляем на admin.html
    if (currentUser && isAuthPage && currentUser.username === ADMIN_USERNAME) {
        window.location.href = 'admin.html';
        return null;
    }

    // Если пользователь не админ и пытается зайти на admin.html, перенаправляем на index.html
    if (isAdminPage && (!currentUser || currentUser.username !== ADMIN_USERNAME)) {
        if (currentUser && currentUser.username !== ADMIN_USERNAME) {
             window.location.href = 'dashboard.html';
             return null;
        }
        return null; 
    }

    return currentUser;
}

// Генерация случайного ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Проверка поддержки камеры (не используется напрямую в текущем коде, но полезно)
function isCameraSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Сохранение изображения (для демо-целей, в реальном приложении - на сервер)
function saveImage(imageData, filename) {
    localStorage.setItem(`photo_${filename}`, imageData);
    return true;
}

// Загрузка изображения (для демо-целей)
function loadImage(filename) {
    return localStorage.getItem(`photo_${filename}`);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();

    // Вызываем animateAuthElements только на страницах аутентификации
    const path = window.location.pathname;
    if (path.includes('index.html') || path.includes('register.html')) {
        if (typeof animateAuthElements === 'function') {
            animateAuthElements();
        }
    }
});
