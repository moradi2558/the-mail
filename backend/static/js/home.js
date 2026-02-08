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
    const themeImage = profileData.theme_image_url || '';
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

            <div class="compose-form-group">
                <label for="profileName">نام</label>
                <input type="text" id="profileName" name="name" value="${escapeHtml(name)}" placeholder="نام خود را وارد کنید">
            </div>

            <div class="compose-form-group">
                <label for="themeImageInput" class="attachment-label">
                    <span>🎨</span>
                    <span>عکس تم (برای پس‌زمینه چت)</span>
                </label>
                <input type="file" id="themeImageInput" name="theme_image" accept="image/*">
                ${themeImage ? `
                    <div style="margin-top: 10px;">
                        <img src="${themeImage}" alt="تم" style="max-width: 100%; max-height: 200px; border-radius: 10px; border: 1px solid #533483;">
                    </div>
                ` : ''}
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
    
    const themeImage = document.getElementById('themeImageInput').files[0];
    if (themeImage) {
        formData.append('theme_image', themeImage);
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

