// Функции для административной панели

// Загрузка админ-панели
function loadAdminDashboard() {
    const currentUser = checkAuth(); // Проверяем авторизацию
    if (!currentUser || currentUser.username !== ADMIN_USERNAME) {
        // Если не админ или не авторизован, показываем форму логина
        document.getElementById('adminLoginContainer').style.display = 'flex';
        document.getElementById('adminDashboardContainer').style.display = 'none';
        initAdminLoginHandlers();
        return;
    }

    // Если админ авторизован, показываем дашборд
    document.getElementById('adminLoginContainer').style.display = 'none';
    document.getElementById('adminDashboardContainer').style.display = 'flex';
    
    // Инициализируем навигацию и обработчики
    initAdminNavigation();
    initAdminEventHandlers();
    
    // Загружаем данные для активной вкладки по умолчанию (Пользователи)
    loadUsersTable();
    updateHourlyRateDisplay();
    loadVisitRecordsTable(); // Загружаем записи о посещениях при старте
    loadAdminShiftsTable(); // Загружаем записи о сменах при старте
    loadCleanupPhotosTable(); // НОВОЕ: Загружаем фотографии уборки при старте
}

// Инициализация обработчиков для логина администратора
function initAdminLoginHandlers() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', adminLogin);
    }

    const adminPasswordInput = document.getElementById('adminPassword');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                adminLogin();
            }
        });
    }
}

// Логин администратора
function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const adminUser = { username: ADMIN_USERNAME, fullName: 'Администратор', position: 'admin' };
        saveCurrentUser(adminUser);
        showNotification('Вход в админ-панель выполнен успешно!');
        setTimeout(() => {
            loadAdminDashboard(); // Перезагружаем дашборд после успешного логина
        }, 500);
    } else {
        showNotification('Неверный пароль администратора', false);
    }
}

// Инициализация навигации админ-панели
function initAdminNavigation() {
    const navItems = document.querySelectorAll('.admin-nav-item');

    navItems.forEach(item => {
        if (item.id !== 'adminLogoutBtn') {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                navItems.forEach(navItem => navItem.classList.remove('active'));
                this.classList.add('active');
                const tabName = this.getAttribute('data-tab');
                showAdminTab(tabName);
            });
        }
    });
}

// Показать вкладку админ-панели
function showAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-pane').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Дополнительная загрузка данных при переключении вкладок
    if (tabName === 'users') {
        loadUsersTable();
    } else if (tabName === 'visits') {
        loadVisitRecordsTable();
    } else if (tabName === 'shifts') {
        loadAdminShiftsTable();
    } else if (tabName === 'cleanup-photos') { // НОВОЕ: Загрузка фото уборки
        loadCleanupPhotosTable();
    } else if (tabName === 'settings') {
        updateHourlyRateDisplay();
    }
}

// Инициализация обработчиков событий админ-панели
function initAdminEventHandlers() {
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', adminLogout);
    }

    const updateHourlyRateBtn = document.getElementById('updateHourlyRateBtn');
    if (updateHourlyRateBtn) {
        updateHourlyRateBtn.addEventListener('click', updateHourlyRate);
    }
}

// Выход администратора
function adminLogout() {
    removeCurrentUser();
    showNotification('Выход из админ-панели.');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Загрузка таблицы пользователей
function loadUsersTable() {
    const users = getUsers();
    const usersTableBody = document.getElementById('usersTableBody');
    usersTableBody.innerHTML = ''; // Очищаем таблицу

    for (const username in users) {
        // Исключаем самого администратора из списка
        if (username === ADMIN_USERNAME) {
            continue;
        }

        const user = users[username];
        const row = usersTableBody.insertRow();

        row.insertCell().textContent = username;
        row.insertCell().textContent = user.fullName;
        row.insertCell().textContent = getPositionName(user.position);
        row.insertCell().textContent = user.phone || 'Не указан';

        const actionsCell = row.insertCell();
        actionsCell.className = 'action-buttons';

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Удалить';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => deleteUser(username));
        actionsCell.appendChild(deleteBtn);
    }
}

// Удаление пользователя
function deleteUser(usernameToDelete) {
    if (confirm(`Вы уверены, что хотите удалить пользователя ${usernameToDelete}? Все его данные будут удалены.`)) {
        const users = getUsers();
        delete users[usernameToDelete];
        saveUsers(users);
        removeUserShiftData(usernameToDelete); // Удаляем данные о смене пользователя
        removeUserVisitRecords(usernameToDelete); // Удаляем данные о посещениях пользователя
        removeUserCleanupPhotos(usernameToDelete); // НОВОЕ: Удаляем фотографии уборки пользователя
        removeRegisteredUsername(usernameToDelete); // Удаляем имя пользователя из списка автозаполнения
        showNotification(`Пользователь ${usernameToDelete} успешно удален.`);
        loadUsersTable(); // Перезагружаем таблицу пользователей
        loadVisitRecordsTable(); // Перезагружаем таблицу посещений
        loadAdminShiftsTable(); // Перезагружаем таблицу смен
        loadCleanupPhotosTable(); // НОВОЕ: Перезагружаем таблицу фото уборки
    }
}

// Загрузка таблицы записей о посещениях
function loadVisitRecordsTable() {
    const visitRecords = getAllVisitRecords();
    const visitsTableBody = document.getElementById('visitsTableBody');
    visitsTableBody.innerHTML = ''; // Очищаем таблицу

    if (visitRecords.length === 0) {
        const row = visitsTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = 'Нет записей о посещениях.';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        cell.style.color = 'var(--secondary-text-color)';
        return;
    }

    // Сортируем записи по дате (новые сначала)
    const sortedRecords = [...visitRecords].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    sortedRecords.forEach(record => {
        const row = visitsTableBody.insertRow();

        row.insertCell().textContent = record.fullName || record.username;
        row.insertCell().textContent = formatDateTime(record.timestamp);

        const photoCell = row.insertCell();
        const img = document.createElement('img');
        img.src = record.photo;
        img.alt = `Фото ${record.fullName}`;
        img.style.width = '80px'; // Уменьшаем размер фото для таблицы
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.cursor = 'pointer';
        img.onclick = () => openPhotoInNewTab(record.photo); // Открывать фото в новой вкладке
        photoCell.appendChild(img);
    });
}

// Загрузка таблицы всех смен для администратора (обновлено для выручки)
function loadAdminShiftsTable() {
    const users = getUsers();
    const adminShiftsTableBody = document.getElementById('adminShiftsTableBody');
    adminShiftsTableBody.innerHTML = ''; // Очищаем таблицу

    let allShifts = [];
    for (const username in users) {
        if (username === ADMIN_USERNAME) continue; // Исключаем админа
        const user = users[username];
        if (user.shifts && user.shifts.length > 0) {
            user.shifts.forEach(shift => {
                allShifts.push({
                    username: username,
                    fullName: user.fullName,
                    ...shift
                });
            });
        }
    }

    if (allShifts.length === 0) {
        const row = adminShiftsTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 8; // Увеличиваем colspan для новой колонки "Выручка"
        cell.textContent = 'Нет записей о сменах.';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        cell.style.color = 'var(--secondary-text-color)';
        return;
    }

    // Сортируем смены по дате (новые сначала)
    const sortedShifts = allShifts.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    sortedShifts.forEach((shift, index) => {
        const row = adminShiftsTableBody.insertRow();

        row.insertCell().textContent = shift.fullName || shift.username;
        row.insertCell().textContent = formatDateTime(shift.startTime);
        row.insertCell().textContent = formatDateTime(shift.endTime);
        row.insertCell().textContent = formatTimeDuration(shift.duration);
        row.insertCell().textContent = `${(shift.earnings || 0).toFixed(2)} руб.`;
        row.insertCell().textContent = `${(shift.dailyRevenue || 0).toFixed(2)} руб.`; // НОВОЕ: Выручка
        row.insertCell().textContent = shift.endReason || 'Не указана';

        const actionsCell = row.insertCell();
        actionsCell.className = 'action-buttons';

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Удалить';
        deleteBtn.className = 'delete-btn';
        // Передаем username и startTime для уникальной идентификации смены
        deleteBtn.addEventListener('click', () => deleteShift(shift.username, shift.startTime));
        actionsCell.appendChild(deleteBtn);
    });
}

// Удаление конкретной смены (обновлено для удаления фото уборки)
function deleteShift(username, startTime) {
    if (confirm(`Вы уверены, что хотите удалить смену пользователя ${username} от ${formatDateTime(startTime)}?`)) {
        const users = getUsers();
        const user = users[username];

        if (user && user.shifts) {
            const shiftIndexToDelete = user.shifts.findIndex(s => s.startTime === startTime);

            if (shiftIndexToDelete !== -1) {
                const deletedShift = user.shifts[shiftIndexToDelete];
                user.shifts.splice(shiftIndexToDelete, 1); // Удаляем смену

                // Удаляем связанные фотографии уборки
                if (deletedShift.cleanupPhotoIds && deletedShift.cleanupPhotoIds.length > 0) {
                    deletedShift.cleanupPhotoIds.forEach(photoId => {
                        removeCleanupPhoto(photoId);
                    });
                }

                // Пересчитываем статистику пользователя
                user.stats.totalHours -= deletedShift.duration;
                user.stats.totalEarnings -= deletedShift.earnings;

                const shiftMonth = new Date(deletedShift.date).toISOString().slice(0, 7);
                if (user.stats.monthlyEarnings[shiftMonth]) {
                    user.stats.monthlyEarnings[shiftMonth] -= deletedShift.earnings;
                    if (user.stats.monthlyEarnings[shiftMonth] < 0.01) {
                        delete user.stats.monthlyEarnings[shiftMonth];
                    }
                }
                
                saveUsers(users);
                showNotification(`Смена пользователя ${username} успешно удалена.`);
                loadAdminShiftsTable(); // Перезагружаем таблицу смен
                loadCleanupPhotosTable(); // НОВОЕ: Перезагружаем таблицу фото уборки
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.username === username) {
                    removeUserShiftData(username);
                }
            } else {
                showNotification('Ошибка: Смена не найдена.', false);
            }
        } else {
            showNotification('Ошибка: Пользователь или его смены не найдены.', false);
        }
    }
}

// НОВАЯ ФУНКЦИЯ: Загрузка таблицы фотографий уборки
function loadCleanupPhotosTable() {
    const cleanupPhotos = getAllCleanupPhotos();
    const cleanupPhotosTableBody = document.getElementById('cleanupPhotosTableBody');
    cleanupPhotosTableBody.innerHTML = ''; // Очищаем таблицу

    if (cleanupPhotos.length === 0) {
        const row = cleanupPhotosTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = 'Нет записей о фотографиях уборки.';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        cell.style.color = 'var(--secondary-text-color)';
        return;
    }

    // Сортируем записи по дате (новые сначала)
    const sortedPhotos = [...cleanupPhotos].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    sortedPhotos.forEach(photoRecord => {
        const row = cleanupPhotosTableBody.insertRow();

        row.insertCell().textContent = photoRecord.fullName || photoRecord.username;
        row.insertCell().textContent = formatDateTime(photoRecord.timestamp);

        const photoCell = row.insertCell();
        const img = document.createElement('img');
        img.src = photoRecord.photoData;
        img.alt = `Фото уборки ${photoRecord.fullName}`;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.cursor = 'pointer';
        img.onclick = () => openPhotoInNewTab(photoRecord.photoData);
        photoCell.appendChild(img);
    });
}


// Вспомогательная функция для открытия фото в новой вкладке
function openPhotoInNewTab(photoData) {
    const newTab = window.open();
    newTab.document.body.innerHTML = `<img src="${photoData}" style="max-width: 100%; height: auto;">`;
}

// Обновление почасовой ставки
function updateHourlyRate() {
    const newRateInput = document.getElementById('newHourlyRate');
    const newRate = parseFloat(newRateInput.value);

    if (isNaN(newRate) || newRate <= 0) {
        showNotification('Пожалуйста, введите корректную положительную ставку.', false);
        return;
    }

    setHourlyRate(newRate);
    updateHourlyRateDisplay();
    showNotification(`Почасовая ставка обновлена до ${newRate} руб/час.`);
    newRateInput.value = ''; // Очищаем поле ввода
}

// Обновление отображения текущей почасовой ставки
function updateHourlyRateDisplay() {
    document.getElementById('currentHourlyRate').textContent = getHourlyRate();
}

// Инициализация админ-панели при загрузке страницы
document.addEventListener('DOMContentLoaded', loadAdminDashboard);
