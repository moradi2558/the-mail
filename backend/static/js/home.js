const API_BASE_URL = '/api/account';

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        showLoading('در حال انتقال');
        window.location.href = '/';
        return;
    }
}

function setupEventListeners() {
    document.getElementById('closeProfileBtn').addEventListener('click', closeProfileModal);
    
    document.getElementById('profileModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeProfileModal();
        }
    });

    document.getElementById('closeChangePasswordBtn').addEventListener('click', closeChangePasswordModal);
    
    document.getElementById('changePasswordModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeChangePasswordModal();
        }
    });

    document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await changePassword();
    });

    document.getElementById('closeBlockedUsersBtn').addEventListener('click', closeBlockedUsersModal);
    
    document.getElementById('blockedUsersModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeBlockedUsersModal();
        }
    });
}

async function openProfileModal() {
    const modal = document.getElementById('profileModal');
    const profileContent = document.getElementById('profileContent');
    
    modal.classList.add('show');
    profileContent.innerHTML = `
        <div class="loading-spinner" id="profileLoading">
            <div class="spinner"></div>
            <p>در حال بارگذاری...</p>
        </div>
    `;
    
    await loadProfile();
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.classList.remove('show');
}

async function loadProfile() {
    const token = localStorage.getItem('access_token');
    const profileContent = document.getElementById('profileContent');
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile/detail/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            showLoading('در حال انتقال');
            window.location.href = '/';
            return;
        }

        const data = await response.json();

        if (response.ok && data.data) {
            displayProfile(data.data);
        } else {
            profileContent.innerHTML = `
                <div class="error-message" style="display: block;">
                    خطا در دریافت اطلاعات پروفایل
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        profileContent.innerHTML = `
            <div class="error-message" style="display: block;">
                خطا در ارتباط با سرور
            </div>
        `;
    }
}

function displayProfile(profileData) {
    const profileContent = document.getElementById('profileContent');
    
    const profileImage = profileData.profile_image_url || '';
    const name = profileData.name || profileData.full_name || '';
    
    profileContent.innerHTML = `
        <form id="profileForm" enctype="multipart/form-data">
                <div class="compose-form-group" style="text-align: center; margin-bottom: 30px;">
                    <div class="profile-image-container" style="position: relative; display: inline-block;">
                        <div id="profileImagePreview" style="width: 150px; height: 150px; border-radius: 50%; border: 3px solid #533483; box-shadow: 0 4px 20px rgba(142, 36, 170, 0.3); background: linear-gradient(135deg, #533483, #8e24aa); display: flex; align-items: center; justify-content: center; font-size: 60px; color: white; overflow: hidden;">
                            ${profileImage ? `<img src="${profileImage}" alt="پروفایل" style="width: 100%; height: 100%; object-fit: cover;">` : '<span>👤</span>'}
                        </div>
                        <label for="profileImageInput" class="profile-image-upload" style="position: absolute; bottom: 0; right: 0; background: linear-gradient(135deg, #533483, #8e24aa); border: 2px solid #ffffff; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);">
                            <span style="font-size: 18px;">📷</span>
                        </label>
                        <input type="file" id="profileImageInput" name="profile_image" accept="image/*" style="display: none;">
                    </div>
                </div>

            <div class="compose-form-group" style="margin-bottom: 30px;">
                <div class="username-input-container" style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: 16px; padding: 24px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(83, 52, 131, 0.1); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;">
                    <!-- Glow effect background -->
                    <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(142, 36, 170, 0.15) 0%, transparent 70%); opacity: 0; transition: opacity 0.5s ease; pointer-events: none;" class="username-glow-bg"></div>
                    
                    <!-- Label with icon -->
                    <label for="profileName" style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px; font-weight: 600; color: var(--arcane-white); font-size: 16px; position: relative; z-index: 1;">
                        <span style="font-size: 22px; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: linear-gradient(135deg, rgba(83, 52, 131, 0.3), rgba(142, 36, 170, 0.3)); border: 1px solid rgba(83, 52, 131, 0.4); border-radius: 10px; backdrop-filter: blur(10px);">✏️</span>
                        <span style="background: linear-gradient(135deg, var(--arcane-white), rgba(142, 36, 170, 0.8)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: 0.5px;">نام کاربری</span>
                    </label>
                    
                    <!-- Input field with glass effect -->
                    <div style="position: relative; z-index: 1;">
                        <span class="username-icon" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-size: 22px; color: rgba(142, 36, 170, 0.6); pointer-events: none; z-index: 2; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);">👤</span>
                        <input type="text" 
                               id="profileName" 
                               name="name" 
                               value="${escapeHtml(name)}" 
                               placeholder="نام خود را وارد کنید..."
                               style="width: 100%; padding: 16px 20px; padding-right: 55px; background: rgba(26, 26, 46, 0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid var(--glass-border); border-radius: 12px; color: var(--arcane-white); font-family: 'Vazirmatn', sans-serif; font-size: 15px; font-weight: 500; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); outline: none; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);">
                    </div>
                    
                    <!-- Helper text -->
                    <div style="margin-top: 14px; font-size: 12px; color: rgba(255, 255, 255, 0.5); display: flex; align-items: center; gap: 8px; position: relative; z-index: 1;">
                        <span style="font-size: 14px; opacity: 0.7;">💡</span>
                        <span>این نام در پیام‌های شما نمایش داده می‌شود</span>
                    </div>
                </div>
                
                <style>
                    .username-input-container:hover {
                        border-color: rgba(83, 52, 131, 0.5) !important;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(83, 52, 131, 0.2), 0 0 20px rgba(142, 36, 170, 0.1) !important;
                    }
                    .username-input-container:hover .username-glow-bg {
                        opacity: 0.5 !important;
                    }
                    
                    #profileName:focus {
                        border-color: var(--arcane-purple) !important;
                        background: rgba(26, 26, 46, 0.8) !important;
                        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(83, 52, 131, 0.2), 0 4px 12px rgba(83, 52, 131, 0.3) !important;
                        transform: translateY(-1px);
                    }
                    
                    #profileName:hover:not(:focus) {
                        border-color: rgba(83, 52, 131, 0.5) !important;
                        background: rgba(26, 26, 46, 0.7) !important;
                    }
                    
                    #profileName::placeholder {
                        color: rgba(255, 255, 255, 0.35);
                        font-weight: 400;
                    }
                    
                    #profileName:focus ~ .username-icon,
                    #profileName:focus + span.username-icon {
                        color: var(--arcane-pink) !important;
                        transform: translateY(-50%) scale(1.15) rotate(5deg);
                    }
                    
                    .username-input-container:hover .username-icon {
                        color: rgba(142, 36, 170, 0.8) !important;
                    }
                    
                    .username-input-container:has(#profileName:focus) {
                        border-color: var(--arcane-purple) !important;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(83, 52, 131, 0.3), 0 0 30px rgba(142, 36, 170, 0.2) !important;
                    }
                    
                    .username-input-container:has(#profileName:focus) .username-glow-bg {
                        opacity: 0.7 !important;
                    }
                    
                    @keyframes subtlePulse {
                        0%, 100% {
                            opacity: 0.3;
                        }
                        50% {
                            opacity: 0.6;
                        }
                    }
                    
                    .username-glow-bg {
                        animation: subtlePulse 4s ease-in-out infinite;
                    }
                </style>
            </div>

            <div class="compose-actions">
                <button type="button" class="cancel-btn" onclick="closeProfileModal()">لغو</button>
                <button type="submit" class="send-btn" id="saveProfileBtn">
                    <span>ذخیره تغییرات</span>
                </button>
            </div>

            <div class="compose-error" id="profileError" style="display: none;"></div>
        </form>
    `;
    
    setupProfileForm();
}

function setupProfileForm() {
    const profileForm = document.getElementById('profileForm');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImagePreview = document.getElementById('profileImagePreview');
    const profileNameInput = document.getElementById('profileName');
    const usernameIcon = document.querySelector('.username-icon');
    
    profileImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImagePreview.innerHTML = `<img src="${e.target.result}" alt="پروفایل" style="width: 100%; height: 100%; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    if (profileNameInput && usernameIcon) {
        profileNameInput.addEventListener('focus', function() {
            if (usernameIcon) {
                usernameIcon.style.color = '#8e24aa';
                usernameIcon.style.transform = 'translateY(-50%) scale(1.2)';
            }
        });
        
        profileNameInput.addEventListener('blur', function() {
            if (usernameIcon) {
                usernameIcon.style.color = 'rgba(142, 36, 170, 0.8)';
                usernameIcon.style.transform = 'translateY(-50%) scale(1)';
            }
        });
    }
    
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveProfile();
    });
}

async function saveProfile() {
    const token = localStorage.getItem('access_token');
    const saveBtn = document.getElementById('saveProfileBtn');
    const profileForm = document.getElementById('profileForm');
    const errorDiv = document.getElementById('profileError');
    
    const formData = new FormData();
    const nameValue = document.getElementById('profileName').value.trim();
    if (nameValue) {
        formData.append('name', nameValue);
    }
    
    const profileImage = document.getElementById('profileImageInput').files[0];
    if (profileImage) {
        formData.append('profile_image', profileImage);
    }
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>در حال ذخیره...</span>';
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile/detail/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showSuccessMessage('پروفایل با موفقیت به‌روزرسانی شد');
            setTimeout(() => {
                loadProfile();
            }, 1000);
        } else {
            let errorMessage = 'خطا در به‌روزرسانی پروفایل';
            if (data.error) {
                errorMessage = data.error;
            } else if (data.name) {
                errorMessage = data.name[0];
            }
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = 'خطا در ارتباط با سرور';
        errorDiv.style.display = 'block';
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>ذخیره تغییرات</span>';
    }
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(83, 52, 131, 0.9), rgba(142, 36, 170, 0.9));
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        animation: slideDown 0.3s ease;
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.classList.add('show');
    document.getElementById('changePasswordForm').reset();
    document.getElementById('changePasswordError').style.display = 'none';
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.classList.remove('show');
    document.getElementById('changePasswordForm').reset();
    document.getElementById('changePasswordError').style.display = 'none';
}

async function changePassword() {
    const token = localStorage.getItem('access_token');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const errorDiv = document.getElementById('changePasswordError');
    
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;
    
    if (newPassword !== newPasswordConfirm) {
        errorDiv.textContent = 'رمز عبور جدید و تکرار آن یکسان نیستند';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword.length < 8) {
        errorDiv.textContent = 'رمز عبور جدید باید حداقل 8 کاراکتر باشد';
        errorDiv.style.display = 'block';
        return;
    }
    
    changePasswordBtn.disabled = true;
    changePasswordBtn.innerHTML = '<span>در حال تغییر...</span>';
    errorDiv.style.display = 'none';
    
    try {
        showLoading('در حال تغییر رمز عبور');
        const response = await fetch(`${API_BASE_URL}/change-password/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
                new_password_confirm: newPasswordConfirm
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccessMessage('رمز عبور با موفقیت تغییر کرد');
            setTimeout(() => {
                closeChangePasswordModal();
            }, 1000);
        } else {
            let errorMessage = 'خطا در تغییر رمز عبور';
            if (data.error) {
                errorMessage = data.error;
            } else if (data.old_password) {
                errorMessage = data.old_password[0];
            } else if (data.new_password) {
                errorMessage = data.new_password[0];
            }
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = 'خطا در ارتباط با سرور';
        errorDiv.style.display = 'block';
    } finally {
        hideLoading();
        changePasswordBtn.disabled = false;
        changePasswordBtn.innerHTML = '<span>تغییر رمز عبور</span>';
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('remember_me');
    showLoading('در حال انتقال');
    window.location.href = '/';
}

async function openBlockedUsersModal() {
    const modal = document.getElementById('blockedUsersModal');
    const content = document.getElementById('blockedUsersContent');
    
    modal.classList.add('show');
    content.innerHTML = `
        <div class="loading-spinner" id="blockedUsersLoading">
            <div class="spinner"></div>
            <p>در حال بارگذاری...</p>
        </div>
    `;
    
    await loadBlockedUsers();
}

function closeBlockedUsersModal() {
    const modal = document.getElementById('blockedUsersModal');
    modal.classList.remove('show');
}

async function loadBlockedUsers() {
    const token = localStorage.getItem('access_token');
    const content = document.getElementById('blockedUsersContent');
    
    if (!token) {
        showLoading('در حال انتقال');
        window.location.href = '/';
        return;
    }
    
    try {
        const response = await fetch('/api/message/blocked/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            showLoading('در حال انتقال');
            window.location.href = '/';
            return;
        }

        const data = await response.json();

        if (response.ok && data.data) {
            displayBlockedUsers(data.data);
        } else {
            content.innerHTML = `
                <div class="error-message" style="display: block;">
                    ${data.error || 'خطا در دریافت لیست کاربران بلاک شده'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        content.innerHTML = `
            <div class="error-message" style="display: block;">
                خطا در ارتباط با سرور
            </div>
        `;
    }
}

function displayBlockedUsers(blockedUsers) {
    const content = document.getElementById('blockedUsersContent');
    
    if (blockedUsers.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">هیچ کاربری بلاک نشده است</div>
            </div>
        `;
        return;
    }
    
    const usersHTML = blockedUsers.map(user => {
        const avatar = user.profile_image 
            ? `<img src="${user.profile_image}" alt="${user.name || user.username}" style="width: 100%; height: 100%; object-fit: cover;">`
            : `<span>${(user.name || user.username || user.email).charAt(0).toUpperCase()}</span>`;
        
        const spamBadge = user.is_spam ? '<span style="padding: 4px 8px; background: rgba(220, 53, 69, 0.3); border-radius: 5px; font-size: 12px; margin-right: 8px;">🚫 اسپم</span>' : '';
        
        return `
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(42, 42, 62, 0.4); border-radius: 10px; margin-bottom: 15px; border: 1px solid var(--glass-border);">
                <div class="message-avatar" style="width: 50px; height: 50px; font-size: 20px;">
                    ${avatar}
                </div>
                <div style="flex-grow: 1;">
                    <div style="font-size: 16px; font-weight: 600; color: var(--arcane-white); margin-bottom: 5px;">
                        ${escapeHtml(user.name || user.username || '')}
                        ${spamBadge}
                    </div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">
                        ${escapeHtml(user.email)}
                    </div>
                </div>
                <button onclick="unblockUser('${escapeHtml(user.email)}')" style="padding: 10px 20px; background: rgba(40, 167, 69, 0.6); border: 1px solid #28a745; border-radius: 8px; color: var(--arcane-white); cursor: pointer; font-family: 'Vazirmatn', sans-serif; font-size: 14px; white-space: nowrap;">
                    ✅ خروج از بلاک
                </button>
            </div>
        `;
    }).join('');
    
    content.innerHTML = `
        <div style="max-height: 500px; overflow-y: auto;">
            ${usersHTML}
        </div>
    `;
}

async function unblockUser(email) {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    if (!confirm(`آیا مطمئن هستید که می‌خواهید ${email} را از بلاک خارج کنید؟`)) {
        return;
    }
    
    try {
        showLoading('در حال خروج از بلاک');
        const response = await fetch('/api/message/unblock/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccessMessage('کاربر با موفقیت از بلاک خارج شد');
            await loadBlockedUsers();
        } else {
            alert(data.error || 'خطا در خروج از بلاک');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور');
    } finally {
        hideLoading();
    }
}

