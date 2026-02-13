const API_BASE_URL = '/api/message';
const messageId = window.location.pathname.split('/').filter(p => p).pop();

document.addEventListener('DOMContentLoaded', function() {
    hideLoading();
    checkAuth();
    setupEventListeners();
    loadMessageDetail();
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
    // No dropdown needed anymore
}

async function loadMessageDetail() {
    const token = localStorage.getItem('access_token');
    const contentDiv = document.getElementById('messageDetailContent');

    if (!token) {
        showLoading('در حال انتقال');
        window.location.href = '/';
        return;
    }

    try {
        showLoading('در حال بارگذاری پیام');
        const response = await fetch(`${API_BASE_URL}/${messageId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/';
            return;
        }

        const data = await response.json();

        if (response.ok && data.data) {
            displayMessageDetail(data.data);
            // Mark as read if user is receiver
            if (data.data.receiver_email) {
                markAsRead();
            }
        } else {
            showError(data.error || 'خطا در دریافت پیام');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('خطا در ارتباط با سرور');
    } finally {
        hideLoading();
    }
}

function displayMessageDetail(message) {
    const contentDiv = document.getElementById('messageDetailContent');
    
    const senderName = message.sender_name || message.sender_username || message.sender_email;
    const senderAvatar = message.sender_profile_image 
        ? `<img src="${message.sender_profile_image}" alt="${senderName}">`
        : `<span>${senderName.charAt(0).toUpperCase()}</span>`;
    
    // بر اساس درخواست شما، بخش نمایش گیرنده را به‌طور کامل حذف کردیم
    const receiverInfo = '';
    
    const attachmentSection = message.has_attachment && message.attachment_url
        ? `
            <div class="message-detail-attachment">
                <div class="attachment-icon">📎</div>
                <div class="attachment-info">
                    <div class="attachment-name">${escapeHtml(message.attachment_name || 'فایل ضمیمه')}</div>
                    <div class="attachment-size">حجم: ${message.attachment_size || 0} مگابایت</div>
                </div>
                <a href="${message.attachment_url}" class="attachment-download" download>دانلود</a>
            </div>
        `
        : '';
    
    const time = formatTime(message.created_at);
    
    contentDiv.innerHTML = `
        <div class="message-detail-header">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--glass-border);">
                <div class="message-avatar" style="width: 60px; height: 60px; font-size: 24px;">
                    ${senderAvatar}
                </div>
                <div style="flex-grow: 1;">
                    <div style="font-size: 18px; font-weight: 600; color: var(--arcane-white); margin-bottom: 5px;">
                        ${escapeHtml(senderName)}
                    </div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">
                        ${escapeHtml(message.sender_email)}
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px; text-align: right;">
                <div style="font-size: 16px; font-weight: 600; color: rgba(255, 255, 255, 0.8);">
                    موضوع:
                    <span style="margin-right: 8px; font-size: 20px; font-weight: 600; color: var(--arcane-white);">
                        ${escapeHtml(message.subject || '(بدون موضوع)')}
                    </span>
                </div>
            </div>
            
            <div class="message-detail-content" style="margin-bottom: 20px; text-align: right;">
                <div class="message-detail-body" style="text-align: right;">
                    ${escapeHtml(message.body || '')}
                </div>
                ${attachmentSection}
            </div>
            
            <div style="margin-bottom: 20px; color: rgba(255, 255, 255, 0.7); font-size: 14px;">
                ${time}
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--glass-border);">
                <div class="message-detail-actions">
                    <button class="message-detail-btn" onclick="toggleStar()">
                        ${message.is_starred ? '⭐ حذف ستاره' : '⭐ ستاره‌دار'}
                    </button>
                    ${message.receiver_email ? `
                        <button class="message-detail-btn" onclick="toggleSenderSpam(${message.is_sender_spam})" style="background: ${message.is_sender_spam ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)'}; border-color: ${message.is_sender_spam ? '#28a745' : '#dc3545'};">
                            ${message.is_sender_spam ? '✅ خروج از اسپم' : '🚫 اسپم'}
                        </button>
                    ` : ''}
                    ${message.public_link_url ? `
                        <button class="message-detail-btn" onclick="copyPublicLink('${message.public_link_url}')">
                            🔗 کپی لینک عمومی
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

async function markAsRead() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
        await fetch(`${API_BASE_URL}/${messageId}/mark-read/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

async function toggleStar() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
        showLoading('در حال به‌روزرسانی');
        const response = await fetch(`${API_BASE_URL}/${messageId}/toggle-star/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            await loadMessageDetail();
        } else {
            const data = await response.json();
            alert(data.error || 'خطا در تغییر وضعیت ستاره');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور');
    } finally {
        hideLoading();
    }
}

async function toggleSenderSpam(isCurrentlySpam) {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    const action = isCurrentlySpam ? 'unmark' : 'mark';
    const confirmMessage = isCurrentlySpam 
        ? 'آیا مطمئن هستید که می‌خواهید این فرستنده را از اسپم خارج کنید؟'
        : 'آیا مطمئن هستید که می‌خواهید این فرستنده را به عنوان اسپم علامت بزنید؟ تمام پیام‌های بعدی از این فرستنده به طور خودکار به اسپم منتقل می‌شوند.';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showLoading(isCurrentlySpam ? 'در حال خارج کردن از اسپم' : 'در حال علامت‌گذاری به عنوان اسپم');
        const response = await fetch(`${API_BASE_URL}/${messageId}/mark-sender-spam/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: action })
        });
        
        if (response.ok) {
            const data = await response.json();
            alert(data.message || (isCurrentlySpam ? 'فرستنده از اسپم خارج شد' : 'فرستنده به عنوان اسپم علامت زده شد'));
            // Reload message detail
            await loadMessageDetail();
        } else {
            const data = await response.json();
            alert(data.error || 'خطا در تغییر وضعیت اسپم');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور');
    } finally {
        hideLoading();
    }
}

function copyPublicLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('لینک عمومی کپی شد');
    }).catch(() => {
        alert('خطا در کپی لینک');
    });
}

function formatTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
        return date.toLocaleDateString('fa-IR');
    } else if (days > 0) {
        return `${days} روز پیش`;
    } else if (hours > 0) {
        return `${hours} ساعت پیش`;
    } else if (minutes > 0) {
        return `${minutes} دقیقه پیش`;
    } else {
        return 'همین الان';
    }
}

function showError(message) {
    const contentDiv = document.getElementById('messageDetailContent');
    contentDiv.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-text">${message}</div>
            <a href="/inbox/" class="back-btn" style="margin-top: 20px;">
                <span>←</span>
                <span>بازگشت به صندوق ورودی</span>
            </a>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('remember_me');
    window.location.href = '/';
}

