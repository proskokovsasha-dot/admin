// Функции для личного кабинета

let shiftInterval;
let shiftStartTime = null;
let currentStream = null;

// Загрузка личного кабинета
function loadDashboard() {
    const currentUser = checkAuth();
    if (!currentUser) return;

    // Заполняем информацию о пользователе
    updateUserInfo(currentUser);

    // Обновляем статистику
    updateUserStats(currentUser);

    // Загружаем историю смен
    loadShiftsHistory();

    // Проверяем, была ли активная смена
    const shiftData = getUserShiftData(currentUser.username);
    if (shiftData && shiftData.active) {
        shiftStartTime = new Date(shiftData.startTime);
        startShiftTimer();
        updateShiftUI(true);
    } else {
        updateShiftUI(false); // Убедимся, что UI обновлен, если смены нет
    }

    // Инициализируем навигацию
    initNavigation();

    // Добавляем обработчики событий
    initEventHandlers();
}

// Обновление информации о пользователе
function updateUserInfo(user) {
    document.getElementById('userName').textContent = user.fullName || user.username;
    document.getElementById('userPosition').textContent = getPositionName(user.position);
    document.getElementById('welcomeSubMessage').textContent = `Рады видеть вас снова, ${user.fullName || user.username}!`; // Обновлено для более личного приветствия

    // Устанавливаем аватар
    const avatar = document.getElementById('userAvatar');
    const profileAvatar = document.getElementById('profileAvatar'); // Для вкладки профиля
    if (user.avatar) {
        avatar.src = user.avatar;
        profileAvatar.src = user.avatar;
    } else {
        const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=4e54c8&color=fff`;
        avatar.src = defaultAvatarUrl;
        profileAvatar.src = defaultAvatarUrl;
    }

    // Обновляем приветственное сообщение
    updateWelcomeMessage();

    // Обновляем данные профиля
    document.getElementById('profileName').textContent = user.fullName || user.username;
    document.getElementById('profilePosition').textContent = getPositionName(user.position);
    document.getElementById('profilePhone').textContent = user.phone || 'Не указан';
    document.getElementById('profileJoinDate').textContent = formatDate(user.registerDate);
    document.getElementById('profileTotalHours').textContent = `${user.stats.totalHours.toFixed(1)} часов`;
}

// Обновление приветственного сообщения
function updateWelcomeMessage() {
    const hour = new Date().getHours();
    let message = '';

    if (hour >= 5 && hour < 12) {
        message = 'Доброе утро!';
    } else if (hour >= 12 && hour < 18) {
        message = 'Добрый день!';
    } else if (hour >= 18 && hour < 23) {
        message = 'Добрый вечер!';
    } else {
        message = 'Доброй ночи!';
    }

    document.getElementById('welcomeMessage').textContent = message;
}

// Инициализация навигации
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        if (item.id !== 'logoutBtn') { // Исключаем кнопку выхода из логики переключения вкладок
            item.addEventListener('click', function(e) {
                e.preventDefault();

                // Убираем активный класс у всех элементов
                navItems.forEach(navItem => navItem.classList.remove('active'));

                // Добавляем активный класс текущему элементу
                this.classList.add('active');

                // Показываем соответствующую вкладку
                const tabName = this.getAttribute('data-tab');
                showTab(tabName);
            });
        }
    });
}

// Показать вкладку
function showTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('active');
    });

    // Показываем выбранную вкладку
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Инициализация обработчиков событий
function initEventHandlers() {
    // Кнопка начала смены (в баннере)
    const startShiftBtnBanner = document.getElementById('startShiftBtnBanner');
    if (startShiftBtnBanner) {
        startShiftBtnBanner.addEventListener('click', startShiftWithPhoto);
    }

    // Кнопка начала смены (в блоке действий)
    const startShiftBtn = document.getElementById('startShiftBtn');
    if (startShiftBtn) {
        startShiftBtn.addEventListener('click', startShiftWithPhoto);
    }

    // Кнопка завершения смены
    const endShiftBtn = document.getElementById('endShiftBtn');
    if (endShiftBtn) {
        endShiftBtn.addEventListener('click', endShift);
    }

    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Кнопка подтверждения фото
    const confirmPhotoBtn = document.getElementById('confirmPhotoBtn');
    if (confirmPhotoBtn) {
        confirmPhotoBtn.addEventListener('click', confirmShiftStart);
    }

    // Кнопка переснять фото
    const retakeBtn = document.getElementById('retakeBtn');
    if (retakeBtn) {
        retakeBtn.addEventListener('click', retakePhoto);
    }

    // Кнопка сделать фото
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
    }

    // Закрытие модальных окон
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
            stopCamera(); // Останавливаем камеру при закрытии модального окна
        });
    });

    // Заявка на отпуск/больничный
    const requestTimeOffBtn = document.getElementById('requestTimeOffBtn');
    if (requestTimeOffBtn) {
        requestTimeOffBtn.addEventListener('click', function() {
            document.getElementById('timeOffModal').classList.add('active');
        });
    }

    const submitRequestBtn = document.getElementById('submitRequestBtn');
    if (submitRequestBtn) {
        submitRequestBtn.addEventListener('click', submitTimeOffRequest);
    }

    // Кнопка "Подтвердить фото" в блоке действий (если смена уже активна)
    const photoShiftBtn = document.getElementById('photoShiftBtn');
    if (photoShiftBtn) {
        photoShiftBtn.addEventListener('click', startShiftWithPhoto); // Используем ту же функцию для запуска модального окна
    }
}

// Начать смену с фото подтверждением
function startShiftWithPhoto() {
    const modal = document.getElementById('photoModal');
    modal.classList.add('active');

    // Сброс состояния кнопок в модальном окне
    document.getElementById('captureBtn').style.display = 'block';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('confirmPhotoBtn').style.display = 'none';

    // Запускаем камеру
    startCamera();
}

// Запуск камеры
async function startCamera() {
    try {
        const video = document.getElementById('cameraVideo');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });

        video.srcObject = stream;
        currentStream = stream;

        // Убедимся, что видео воспроизводится
        video.play();

    } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        showNotification('Не удалось получить доступ к камере. Пожалуйста, разрешите доступ.', false);

        // Если камера недоступна, можно предложить начать смену без фото
        // Или просто закрыть модальное окно и не начинать смену
        document.getElementById('photoModal').classList.remove('active');
        showNotification('Смена не начата: камера недоступна.', false);
    }
}

// Остановка камеры
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        const video = document.getElementById('cameraVideo');
        video.srcObject = null; // Очищаем srcObject
    }
}

// Сделать фото
function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('photoCanvas');
    const context = canvas.getContext('2d');

    // Устанавливаем размеры canvas как у video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Рисуем текущий кадр видео на canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Останавливаем камеру
    stopCamera();

    // Меняем кнопки
    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'block';
    document.getElementById('confirmPhotoBtn').style.display = 'block';
}

// Переснять фото
function retakePhoto() {
    // Показываем кнопку захвата снова
    document.getElementById('captureBtn').style.display = 'block';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('confirmPhotoBtn').style.display = 'none';

    // Очищаем canvas
    const canvas = document.getElementById('photoCanvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Запускаем камеру снова
    startCamera();
}

// Подтверждение начала смены с фото
function confirmShiftStart() {
    const canvas = document.getElementById('photoCanvas');

    // Проверяем, есть ли изображение на canvas
    if (canvas.width === 0 || canvas.height === 0) {
        showNotification('Сначала сделайте фото!', false);
        return;
    }

    // Получаем данные фото в формате base64
    const photoData = canvas.toDataURL('image/jpeg');

    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Ошибка: пользователь не авторизован.', false);
        return;
    }

    const shiftData = {
        active: true,
        startTime: new Date().toISOString(),
        photo: photoData // Сохраняем фото
    };

    saveUserShiftData(currentUser.username, shiftData);

    // Начинаем смену
    shiftStartTime = new Date();
    startShiftTimer();
    updateShiftUI(true);

    // Закрываем модальное окно
    document.getElementById('photoModal').classList.remove('active');

    showNotification('Смена начата с фото подтверждением!');
}

// Завершить смену
function endShift() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Проверяем, была ли смена начата
    if (!shiftStartTime) {
        showNotification('Смена не была начата.', false);
        return;
    }

    const endTime = new Date();
    const shiftDuration = (endTime - shiftStartTime) / 1000 / 60 / 60; // в часах
    const earnings = shiftDuration * getHourlyRate(); // Используем getHourlyRate()

    // Обновляем статистику пользователя
    const users = getUsers();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Убедимся, что stats и shifts существуют
    if (!users[currentUser.username].stats) {
        users[currentUser.username].stats = { totalHours: 0, totalEarnings: 0, monthlyEarnings: {} };
    }
    if (!users[currentUser.username].shifts) {
        users[currentUser.username].shifts = [];
    }

    users[currentUser.username].stats.totalHours += shiftDuration;
    users[currentUser.username].stats.totalEarnings += earnings;

    if (!users[currentUser.username].stats.monthlyEarnings[currentMonth]) {
        users[currentUser.username].stats.monthlyEarnings[currentMonth] = 0;
    }

    users[currentUser.username].stats.monthlyEarnings[currentMonth] += earnings;

    // Сохраняем историю смен
    users[currentUser.username].shifts.push({
        startTime: shiftStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: shiftDuration,
        earnings: earnings,
        date: new Date().toISOString().slice(0, 10)
    });

    // Сохраняем обновленные данные
    saveUsers(users);

    // Удаляем данные о текущей смене
    removeUserShiftData(currentUser.username);

    // Обновляем текущего пользователя в localStorage
    const updatedUser = {
        ...currentUser,
        ...users[currentUser.username]
    };
    saveCurrentUser(updatedUser);

    // Обновляем UI
    clearInterval(shiftInterval);
    document.getElementById('currentShiftTime').textContent = '00:00:00';
    document.getElementById('currentEarnings').textContent = '0 руб.';
    updateShiftUI(false);

    // Обновляем статистику на дашборде
    updateUserStats(updatedUser);

    // Перезагружаем историю смен
    loadShiftsHistory();

    showNotification(`Смена завершена! Заработано: ${earnings.toFixed(2)} руб.`);
    shiftStartTime = null;
}

// Запустить таймер смены
function startShiftTimer() {
    clearInterval(shiftInterval);

    shiftInterval = setInterval(() => {
        const currentTime = new Date();
        const diff = currentTime - shiftStartTime;

        // Обновляем таймер
        document.getElementById('currentShiftTime').textContent = formatTime(diff);

        // Рассчитываем заработок
        const hoursWorked = diff / 1000 / 60 / 60;
        const currentEarnings = hoursWorked * getHourlyRate(); // Используем getHourlyRate()

        document.getElementById('currentEarnings').textContent = `${currentEarnings.toFixed(2)} руб.`;
    }, 1000);
}

// Обновление интерфейса в зависимости от состояния смены
function updateShiftUI(isActive) {
    const startShiftBtnBanner = document.getElementById('startShiftBtnBanner');
    const startShiftBtn = document.getElementById('startShiftBtn');
    const endShiftBtn = document.getElementById('endShiftBtn');
    const photoShiftBtn = document.getElementById('photoShiftBtn'); // Кнопка "Подтвердить фото" в блоке действий

    if (isActive) {
        if (startShiftBtnBanner) startShiftBtnBanner.style.display = 'none';
        if (startShiftBtn) startShiftBtn.style.display = 'none';
        if (endShiftBtn) endShiftBtn.style.display = 'block';
        if (photoShiftBtn) photoShiftBtn.style.display = 'block'; // Показываем кнопку "Подтвердить фото"

        document.getElementById('currentShiftStatus').textContent = 'Смена активна';
        document.getElementById('statusIndicator').classList.add('active');
    } else {
        if (startShiftBtnBanner) startShiftBtnBanner.style.display = 'block';
        if (startShiftBtn) startShiftBtn.style.display = 'block';
        if (endShiftBtn) endShiftBtn.style.display = 'none';
        if (photoShiftBtn) photoShiftBtn.style.display = 'none'; // Скрываем кнопку "Подтвердить фото"

        document.getElementById('currentShiftStatus').textContent = 'Смена не начата';
        document.getElementById('statusIndicator').classList.remove('active');
        document.getElementById('currentShiftTime').textContent = '00:00:00'; // Сброс таймера
        document.getElementById('currentEarnings').textContent = '0 руб.'; // Сброс заработка
    }
}

// Обновить статистику пользователя
function updateUserStats(user) {
    if (!user || !user.stats) {
        // Инициализируем stats, если его нет
        user.stats = { totalHours: 0, totalEarnings: 0, monthlyEarnings: {} };
    }

    document.getElementById('totalHours').textContent = user.stats.totalHours.toFixed(1);
    document.getElementById('totalEarnings').textContent = `${user.stats.totalEarnings.toFixed(2)} руб.`;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthEarnings = user.stats.monthlyEarnings[currentMonth] || 0;
    document.getElementById('monthEarnings').textContent = `${monthEarnings.toFixed(2)} руб.`;

    // Подсчет смен в этом месяце
    let shiftsThisMonth = 0;
    if (user.shifts) {
        const currentMonthPrefix = new Date().toISOString().slice(0, 7);
        shiftsThisMonth = user.shifts.filter(shift => {
            return shift.date && shift.date.startsWith(currentMonthPrefix);
        }).length;
    }
    document.getElementById('shiftsThisMonth').textContent = shiftsThisMonth;

    // Расчет средней продолжительности смены
    let avgShift = 0;
    if (user.shifts && user.shifts.length > 0) {
        const totalHours = user.shifts.reduce((sum, shift) => sum + (shift.duration || 0), 0);
        avgShift = totalHours / user.shifts.length;
    }
    document.getElementById('avgShift').textContent = `${avgShift.toFixed(1)} часов`;
}

// Загрузка истории смен
function loadShiftsHistory() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.shifts) {
        const shiftsList = document.getElementById('shiftsList');
        if (shiftsList) {
            shiftsList.innerHTML = '<div class="shift-item"><p>Нет данных о сменах</p></div>';
        }
        return;
    }

    const shiftsList = document.getElementById('shiftsList');
    if (!shiftsList) return; // Проверка на существование элемента

    shiftsList.innerHTML = '';

    // Сортируем смены по дате (новые сначала)
    const sortedShifts = [...currentUser.shifts].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    // Ограничиваем количество отображаемых смен
    const recentShifts = sortedShifts.slice(0, 10);

    if (recentShifts.length === 0) {
        shiftsList.innerHTML = '<div class="shift-item"><p>Нет данных о сменах</p></div>';
        return;
    }

    recentShifts.forEach(shift => {
        const shiftItem = document.createElement('div');
        shiftItem.className = 'shift-item';

        const shiftDate = new Date(shift.date);
        const formattedDate = shiftDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const hours = Math.floor(shift.duration);
        const minutes = Math.floor((shift.duration - hours) * 60);

        shiftItem.innerHTML = `
            <div class="shift-info">
                <h4>Смена от ${formattedDate}</h4>
                <p>${new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            <div class="shift-details">
                <span class="shift-duration">${hours}ч ${minutes}м</span>
                <span class="shift-earnings">${(shift.earnings || 0).toFixed(2)} руб.</span>
            </div>
        `;

        shiftsList.appendChild(shiftItem);
    });
}

// Подача заявки на отпуск/больничный
function submitTimeOffRequest() {
    const type = document.getElementById('requestType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('requestReason').value;

    if (!startDate || !endDate || !reason) {
        showNotification('Заполните все поля', false);
        return;
    }

    // Здесь будет логика отправки заявки
    // В демо-версии просто показываем уведомление

    showNotification('Заявка отправлена на рассмотрение');
    document.getElementById('timeOffModal').classList.remove('active');

    // Очищаем форму
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('requestReason').value = '';
}

// Выход из аккаунта
function logout() {
    const currentUser = getCurrentUser();

    // Если смена активна, предупреждаем пользователя
    if (currentUser) {
        const shiftData = getUserShiftData(currentUser.username);
        if (shiftData && shiftData.active) {
            if (!confirm('У вас активная смена. Вы уверены, что хотите выйти?')) {
                return;
            }
        }
    }

    removeCurrentUser();
    clearInterval(shiftInterval);
    stopCamera();
    window.location.href = 'index.html';
}

// Вспомогательная функция для получения названия должности
function getPositionName(positionCode) {
    const positions = {
        'barista': 'Бариста',
        'waiter': 'Официант',
        'cook': 'Повар',
        'manager': 'Менеджер',
        'admin': 'Администратор'
    };

    return positions[positionCode] || 'Сотрудник';
}

// Инициализация личного кабинета при загрузке страницы
document.addEventListener('DOMContentLoaded', loadDashboard);
