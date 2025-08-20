// Функции для личного кабинета

let shiftInterval;
let shiftStartTime = null;
let currentStream = null;
let photoPurpose = 'shift'; // 'shift' или 'visit'

// Загрузка личного кабинета
function loadDashboard() {
    const currentUser = checkAuth();
    if (!currentUser) return;

    // Заполняем информацию о пользователе
    updateUserInfo(currentUser);

    // Обновляем статистику
    updateUserStats(currentUser);

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
    document.getElementById('welcomeSubMessage').textContent = `Рады видеть вас снова, ${user.fullName || user.username}!`;

    // Устанавливаем аватар
    updateAvatar(user.avatar);

    // Обновляем приветственное сообщение
    updateWelcomeMessage();

    // Обновляем данные профиля в модальном окне
    document.getElementById('profileName').textContent = user.fullName || user.username;
    document.getElementById('profilePosition').textContent = getPositionName(user.position);
    document.getElementById('profilePhone').textContent = user.phone || 'Не указан';
    document.getElementById('profileJoinDate').textContent = formatDate(user.registerDate);
    document.getElementById('profileTotalHours').textContent = `${user.stats.totalHours.toFixed(1)} часов`;
}

// Обновление аватара
function updateAvatar(avatarData) {
    const avatar = document.getElementById('userAvatar');
    const profileAvatar = document.getElementById('profileAvatar');

    if (avatarData) {
        avatar.src = avatarData;
        profileAvatar.src = avatarData;
    } else {
        const currentUser = getCurrentUser();
        const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || currentUser.username)}&background=6A11CB&color=fff`;
        avatar.src = defaultAvatarUrl;
        profileAvatar.src = defaultAvatarUrl;
    }
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

// Инициализация навигации (теперь открывает модальные окна)
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        if (item.id !== 'logoutBtn') {
            item.addEventListener('click', function(e) {
                e.preventDefault();

                // Убираем активный класс у всех элементов
                navItems.forEach(navItem => navItem.classList.remove('active'));

                // Добавляем активный класс текущему элементу
                this.classList.add('active');

                const modalName = this.getAttribute('data-modal');
                openModal(modalName);
            });
        }
    });
}

// Открыть модальное окно
function openModal(modalName) {
    // Скрываем все модальные окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });

    // Показываем выбранное модальное окно
    const targetModal = document.getElementById(`${modalName}Modal`);
    if (targetModal) {
        targetModal.classList.add('active');
        // Дополнительная логика для загрузки данных в модальное окно
        if (modalName === 'shifts') {
            loadShiftsHistory();
        } else if (modalName === 'profile') {
            const currentUser = getCurrentUser();
            updateUserInfo(currentUser); // Обновляем данные профиля перед открытием
        }
    }
}

// Инициализация обработчиков событий
function initEventHandlers() {
    // Кнопка начала смены (в баннере)
    const startShiftBtnBanner = document.getElementById('startShiftBtnBanner');
    if (startShiftBtnBanner) {
        startShiftBtnBanner.addEventListener('click', () => startShiftWithPhoto('shift'));
    }

    // Кнопка начала смены (в блоке действий)
    const startShiftBtn = document.getElementById('startShiftBtn');
    if (startShiftBtn) {
        startShiftBtn.addEventListener('click', () => startShiftWithPhoto('shift'));
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
        confirmPhotoBtn.addEventListener('click', confirmPhotoAction);
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
            // Снимаем активный класс с навигации, если модальное окно закрыто
            document.querySelectorAll('.nav-item').forEach(navItem => navItem.classList.remove('active'));
            // Устанавливаем активный класс на "Главная"
            document.querySelector('.nav-item[data-modal="dashboard"]').classList.add('active');
        });
    });

    // Кнопка "Подтвердить фото" в блоке действий (если смена уже активна)
    const photoShiftBtn = document.getElementById('photoShiftBtn');
    if (photoShiftBtn) {
        photoShiftBtn.addEventListener('click', () => startShiftWithPhoto('shift'));
    }

    // Новая кнопка "Отметить посещение"
    const recordVisitBtn = document.getElementById('recordVisitBtn');
    if (recordVisitBtn) {
        recordVisitBtn.addEventListener('click', () => startShiftWithPhoto('visit'));
    }

    // Обработчик для кнопки редактирования аватара
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', () => {
            document.getElementById('avatarInput').click();
        });
    }

    // Обработчик для input type="file"
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }

    // Обработчик для фильтра истории смен
    const shiftsFilter = document.getElementById('shiftsFilter');
    if (shiftsFilter) {
        shiftsFilter.addEventListener('change', loadShiftsHistory);
    }
}

// Обработка загрузки аватара
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            const currentUser = getCurrentUser();
            if (currentUser) {
                const users = getUsers();
                users[currentUser.username].avatar = imageData;
                saveUsers(users);
                currentUser.avatar = imageData; // Обновляем текущего пользователя
                saveCurrentUser(currentUser);
                updateAvatar(imageData); // Обновляем аватар на странице
                showNotification('Фото профиля успешно обновлено!');
            }
        };
        reader.readAsDataURL(file);
    }
}

// Начать смену с фото подтверждением или отметить посещение
function startShiftWithPhoto(purpose) {
    photoPurpose = purpose; // Устанавливаем цель фото
    const modal = document.getElementById('photoModal');
    const modalTitle = document.getElementById('photoModalTitle');
    const modalDescription = document.getElementById('photoModalDescription');

    if (purpose === 'shift') {
        modalTitle.textContent = 'Подтверждение начала смены';
        modalDescription.textContent = 'Сделайте фото для подтверждения начала смены';
    } else if (purpose === 'visit') {
        modalTitle.textContent = 'Отметка посещения вне смены';
        modalDescription.textContent = 'Сделайте фото для отметки посещения вне смены';
    }

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

        document.getElementById('photoModal').classList.remove('active');
        showNotification('Действие не выполнено: камера недоступна.', false);
    }
}

// Остановка камеры
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        const video = document.getElementById('cameraVideo');
        video.srcObject = null;
    }
}

// Сделать фото
function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('photoCanvas');
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopCamera();

    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'block';
    document.getElementById('confirmPhotoBtn').style.display = 'block';
}

// Переснять фото
function retakePhoto() {
    document.getElementById('captureBtn').style.display = 'block';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('confirmPhotoBtn').style.display = 'none';

    const canvas = document.getElementById('photoCanvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    startCamera();
}

// Подтверждение действия с фото (смена или посещение)
function confirmPhotoAction() {
    const canvas = document.getElementById('photoCanvas');

    if (canvas.width === 0 || canvas.height === 0) {
        showNotification('Сначала сделайте фото!', false);
        return;
    }

    const photoData = canvas.toDataURL('image/jpeg');

    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Ошибка: пользователь не авторизован.', false);
        return;
    }

    if (photoPurpose === 'shift') {
        const shiftData = {
            active: true,
            startTime: new Date().toISOString(),
            photo: photoData
        };

        saveUserShiftData(currentUser.username, shiftData);

        shiftStartTime = new Date();
        startShiftTimer();
        updateShiftUI(true);

        showNotification('Смена начата с фото подтверждением!');
    } else if (photoPurpose === 'visit') {
        const visitData = {
            timestamp: new Date().toISOString(),
            photo: photoData,
            username: currentUser.username,
            fullName: currentUser.fullName || currentUser.username
        };
        addVisitRecord(visitData);
        showNotification('Посещение вне смены успешно отмечено!');
    }

    document.getElementById('photoModal').classList.remove('active');
}

// Завершить смену
function endShift() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    if (!shiftStartTime) {
        showNotification('Смена не была начата.', false);
        return;
    }

    const endTime = new Date();
    const shiftDuration = (endTime - shiftStartTime) / 1000 / 60 / 60;
    const earnings = shiftDuration * getHourlyRate();

    const users = getUsers();
    const currentMonth = new Date().toISOString().slice(0, 7);

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

    users[currentUser.username].shifts.push({
        startTime: shiftStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: shiftDuration,
        earnings: earnings,
        date: new Date().toISOString() // Сохраняем полную дату для сортировки
    });

    saveUsers(users);
    removeUserShiftData(currentUser.username);

    const updatedUser = {
        ...currentUser,
        ...users[currentUser.username]
    };
    saveCurrentUser(updatedUser);

    clearInterval(shiftInterval);
    document.getElementById('currentShiftTime').textContent = '00:00:00';
    document.getElementById('currentEarnings').textContent = '0 руб.';
    updateShiftUI(false);

    updateUserStats(updatedUser);
    loadShiftsHistory(); // Обновляем историю смен после завершения

    showNotification(`Смена завершена! Заработано: ${earnings.toFixed(2)} руб.`);
    shiftStartTime = null;
}

// Запустить таймер смены
function startShiftTimer() {
    clearInterval(shiftInterval);

    shiftInterval = setInterval(() => {
        const currentTime = new Date();
        const diff = currentTime - shiftStartTime;

        document.getElementById('currentShiftTime').textContent = formatTime(diff);

        const hoursWorked = diff / 1000 / 60 / 60;
        const currentEarnings = hoursWorked * getHourlyRate();

        document.getElementById('currentEarnings').textContent = `${currentEarnings.toFixed(2)} руб.`;
    }, 1000);
}

// Обновление интерфейса в зависимости от состояния смены
function updateShiftUI(isActive) {
    const startShiftBtnBanner = document.getElementById('startShiftBtnBanner');
    const startShiftBtn = document.getElementById('startShiftBtn');
    const endShiftBtn = document.getElementById('endShiftBtn');
    const photoShiftBtn = document.getElementById('photoShiftBtn');
    const recordVisitBtn = document.getElementById('recordVisitBtn');

    if (isActive) {
        if (startShiftBtnBanner) startShiftBtnBanner.style.display = 'none';
        if (startShiftBtn) startShiftBtn.style.display = 'none';
        if (endShiftBtn) endShiftBtn.style.display = 'block';
        if (photoShiftBtn) photoShiftBtn.style.display = 'block';
        if (recordVisitBtn) recordVisitBtn.style.display = 'none';

        document.getElementById('currentShiftStatus').textContent = 'Смена активна';
        document.getElementById('statusIndicator').classList.add('active');
    } else {
        if (startShiftBtnBanner) startShiftBtnBanner.style.display = 'block';
        if (startShiftBtn) startShiftBtn.style.display = 'block';
        if (endShiftBtn) endShiftBtn.style.display = 'none';
        if (photoShiftBtn) photoShiftBtn.style.display = 'none';
        if (recordVisitBtn) recordVisitBtn.style.display = 'block';

        document.getElementById('currentShiftStatus').textContent = 'Смена не начата';
        document.getElementById('statusIndicator').classList.remove('active');
        document.getElementById('currentShiftTime').textContent = '00:00:00';
        document.getElementById('currentEarnings').textContent = '0 руб.';
    }
}

// Обновить статистику пользователя
function updateUserStats(user) {
    if (!user || !user.stats) {
        user.stats = { totalHours: 0, totalEarnings: 0, monthlyEarnings: {} };
    }

    document.getElementById('totalHours').textContent = user.stats.totalHours.toFixed(1);
    document.getElementById('totalEarnings').textContent = `${user.stats.totalEarnings.toFixed(2)} руб.`;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthEarnings = user.stats.monthlyEarnings[currentMonth] || 0;
    document.getElementById('monthEarnings').textContent = `${monthEarnings.toFixed(2)} руб.`;

    let shiftsThisMonth = 0;
    if (user.shifts) {
        const currentMonthPrefix = new Date().toISOString().slice(0, 7);
        shiftsThisMonth = user.shifts.filter(shift => {
            return shift.date && shift.date.startsWith(currentMonthPrefix);
        }).length;
    }
    document.getElementById('shiftsThisMonth').textContent = shiftsThisMonth;

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
    if (!shiftsList) return;

    shiftsList.innerHTML = '';

    const filterValue = document.getElementById('shiftsFilter').value;
    let filteredShifts = [...currentUser.shifts];

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Пн - Вс

    if (filterValue === 'month') {
        filteredShifts = filteredShifts.filter(shift => new Date(shift.date) >= currentMonthStart);
    } else if (filterValue === 'week') {
        filteredShifts = filteredShifts.filter(shift => new Date(shift.date) >= currentWeekStart);
    }

    const sortedShifts = filteredShifts.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    if (sortedShifts.length === 0) {
        shiftsList.innerHTML = '<div class="shift-item"><p>Нет данных о сменах по выбранному фильтру.</p></div>';
        return;
    }

    sortedShifts.forEach(shift => {
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

// Выход из аккаунта
function logout() {
    const currentUser = getCurrentUser();

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
