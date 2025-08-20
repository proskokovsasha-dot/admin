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
    
    // Загружаем данные
    loadUsersTable();
    updateHourlyRateDisplay();
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
        showNotification(`Пользователь ${usernameToDelete} успешно удален.`);
        loadUsersTable(); // Перезагружаем таблицу
    }
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
