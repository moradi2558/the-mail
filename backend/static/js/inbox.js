// Updated: 2024 - Removed contact list validation
const API_BASE_URL = '/api/message';
let currentMessages = [];
let currentType = 'inbox';
let currentMessageId = null;
let searchTimeout = null;
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', function() {
    hideLoading();
    checkAuth();
    setupEventListeners();
    updateArchiveButton();
    loadMessages('inbox');
});

function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/';
        return;
    }
}

function setupEventListeners() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const type = this.dataset.type;
            if (type) {
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
                // Clear search when switching tabs
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = '';
                    currentSearchQuery = '';
                }
                loadMessages(type);
            }
        });
    });

    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadMessages(currentType);
    });

    document.getElementById('composeBtn').addEventListener('click', function() {
        openComposeModal();
    });


    document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.message-checkbox');
        checkboxes.forEach(cb => cb.checked = this.checked);
    });

    document.getElementById('archiveBtn').addEventListener('click', function() {
        archiveSelectedMessages();
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            currentSearchQuery = query;
            
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Debounce: wait 500ms after user stops typing
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 500);
        });
        
        // Also search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                performSearch(e.target.value.trim());
            }
        });
    }
}

async function loadMessages(type = 'inbox', searchQuery = '') {
    currentType = type;
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        showLoading('در حال انتقال');
        window.location.href = '/';
        return;
    }

    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = `
        <div class="loading-spinner" id="loadingSpinner">
            <div class="spinner"></div>
            <p>${searchQuery ? 'در حال جستجو...' : 'در حال بارگذاری...'}</p>
        </div>
    `;

    try {
        let url = `${API_BASE_URL}/list/?type=${type}`;
        if (searchQuery && searchQuery.trim()) {
            url += `&search=${encodeURIComponent(searchQuery.trim())}`;
        }
        
        const response = await fetch(url, {
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
            currentMessages = data.data;
            displayMessages(data.data);
            updateMessagesCount(data.count || data.data.length);
            updateInboxBadge(data.data.filter(msg => !msg.read_at && msg.receiver_email).length);
            updateArchiveButton();
        } else {
            showError('خطا در دریافت پیام‌ها');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('خطا در ارتباط با سرور');
    }
}

function performSearch(query) {
    if (query && query.trim()) {
        loadMessages(currentType, query);
    } else {
        // If search is cleared, reload messages without search
        loadMessages(currentType);
    }
}

function displayMessages(messages) {
    const messagesList = document.getElementById('messagesList');

    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">هیچ پیامی یافت نشد</div>
                <div class="empty-state-subtext">پیام‌های شما اینجا نمایش داده می‌شوند</div>
            </div>
        `;
        return;
    }

    messagesList.innerHTML = messages.map(message => createMessageHTML(message)).join('');
    
    const messageItems = document.querySelectorAll('.message-item');
    messageItems.forEach((item, index) => {
        const messageId = messages[index].id;
        item.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                openMessageDetail(messageId);
            }
        });
    });
}

function createMessageHTML(message) {
    const isUnread = message.status !== 'read' && message.receiver_email;
    const senderName = message.sender_name || message.sender_username || message.sender_email;
    const preview = message.body ? (message.body.length > 100 ? message.body.substring(0, 100) + '...' : message.body) : '';
    const time = formatTime(message.created_at);
    
    let badges = '';
    if (message.is_starred) {
        badges += '<span class="message-badge badge-starred">⭐</span>';
    }
    if (message.is_spam) {
        badges += '<span class="message-badge badge-spam">🚫</span>';
    }
    if (message.has_attachment) {
        badges += '<span class="message-badge badge-attachment">📎</span>';
    }

    const avatarImg = message.sender_profile_image 
        ? `<img src="${message.sender_profile_image}" alt="${senderName}">`
        : `<span>${senderName.charAt(0).toUpperCase()}</span>`;

    return `
        <div class="message-item ${isUnread ? 'unread' : ''}" data-id="${message.id}">
            <input type="checkbox" class="message-checkbox">
            <div class="message-avatar">
                ${avatarImg}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${escapeHtml(senderName)}</span>
                    <div class="message-badges">
                        ${badges}
                    </div>
                </div>
                <div class="message-subject">${escapeHtml(message.subject || '(بدون موضوع)')}</div>
                <div class="message-preview">${escapeHtml(preview)}</div>
            </div>
            <div class="message-meta">
                <div class="message-time">${time}</div>
                <div class="message-icons">
                    ${message.is_starred ? '<span class="message-icon">⭐</span>' : ''}
                    ${message.has_attachment ? '<span class="message-icon">📎</span>' : ''}
                </div>
            </div>
        </div>
    `;
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

function updateMessagesCount(count) {
    document.getElementById('messagesCount').textContent = `${count} پیام`;
}

function updateInboxBadge(count) {
    const badge = document.getElementById('inboxBadge');
    if (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

function updateArchiveButton() {
    const archiveBtn = document.getElementById('archiveBtn');
    if (archiveBtn) {
        if (currentType === 'archived') {
            archiveBtn.title = 'خروج از آرشیو';
            archiveBtn.innerHTML = '<span>📤</span>';
        } else {
            archiveBtn.title = 'آرشیو';
            archiveBtn.innerHTML = '<span>📦</span>';
        }
    }
}

function showError(message) {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-text">${message}</div>
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

let contactsList = [];

async function openComposeModal() {
    const modal = document.getElementById('composeModal');
    modal.classList.add('show');
    showLoading('در حال بارگذاری کانتکت‌ها');
    
    const receiverInput = document.getElementById('receiverInput');
    const isPrivateCheckbox = document.getElementById('isPrivateCheckbox');
    
    if (receiverInput) {
        receiverInput.value = '';
    }
    
    if (contactsList.length === 0) {
        await loadContacts();
    }
    
    hideLoading();
    
    if (isPrivateCheckbox) {
        isPrivateCheckbox.addEventListener('change', function() {
            toggleReceiverField(this.checked);
        });
        
        toggleReceiverField(isPrivateCheckbox.checked);
    }
    
    setupComposeForm();
}

function closeComposeModal() {
    const modal = document.getElementById('composeModal');
    modal.classList.remove('show');
    document.getElementById('composeForm').reset();
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('composeError').style.display = 'none';
}

async function loadContacts() {
    const token = localStorage.getItem('access_token');
    const loadingContacts = document.getElementById('loadingContacts');
    
    if (loadingContacts) {
        loadingContacts.style.display = 'block';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/contacts/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            contactsList = data.data || [];
        } else {
            console.error('Failed to load contacts');
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    } finally {
        loadingContacts.style.display = 'none';
    }
}

function populateContactsDatalist() {
    const datalist = document.getElementById('contactsList');
    datalist.innerHTML = '';
    
    contactsList.forEach(contact => {
        const option = document.createElement('option');
        option.value = contact.email;
        option.textContent = `${contact.name || contact.username} - ${contact.email}`;
        datalist.appendChild(option);
    });
}

function toggleReceiverField(isPrivate) {
    const receiverInput = document.getElementById('receiverInput');
    const receiverGroup = receiverInput.closest('.compose-form-group');
    
    if (isPrivate) {
        receiverInput.disabled = false;
        receiverInput.required = true;
        receiverGroup.style.display = 'block';
    } else {
        receiverInput.disabled = true;
        receiverInput.required = false;
        receiverInput.value = '';
        receiverGroup.style.display = 'none';
    }
}

function setupComposeForm() {
    const composeForm = document.getElementById('composeForm');
    const attachmentInput = document.getElementById('attachmentInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const attachmentLabel = document.querySelector('.attachment-label');
    const contactsIconBtn = document.getElementById('contactsIconBtn');
    const closeContactsBtn = document.getElementById('closeContactsBtn');
    const contactsDropdown = document.getElementById('contactsDropdown');
    
    if (contactsIconBtn) {
        contactsIconBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleContactsDropdown();
        });
    }
    
    if (closeContactsBtn) {
        closeContactsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeContactsDropdown();
        });
    }
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.receiver-combobox-wrapper') && !e.target.closest('.contacts-dropdown')) {
            closeContactsDropdown();
        }
    });
    
    
    attachmentLabel.addEventListener('click', function() {
        attachmentInput.click();
    });
    
    attachmentInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showComposeError(`حجم فایل باید کمتر از 10 مگابایت باشد. حجم فایل فعلی: ${(file.size / (1024 * 1024)).toFixed(2)} مگابایت`);
                attachmentInput.value = '';
                return;
            }
            fileName.textContent = file.name;
            fileInfo.style.display = 'flex';
        }
    });
    
    removeFileBtn.addEventListener('click', function() {
        attachmentInput.value = '';
        fileInfo.style.display = 'none';
    });
    
    composeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await sendMessage();
    });
    
    document.getElementById('closeComposeBtn').addEventListener('click', closeComposeModal);
    document.getElementById('cancelComposeBtn').addEventListener('click', closeComposeModal);
    
    document.getElementById('composeModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeComposeModal();
        }
    });
}

function toggleContactsDropdown() {
    const contactsDropdown = document.getElementById('contactsDropdown');
    if (contactsDropdown) {
        if (contactsDropdown.classList.contains('show')) {
            closeContactsDropdown();
        } else {
            openContactsDropdown();
        }
    }
}

function openContactsDropdown() {
    const contactsDropdown = document.getElementById('contactsDropdown');
    const contactsDropdownList = document.getElementById('contactsDropdownList');
    
    if (!contactsDropdown || !contactsDropdownList) return;
    
    contactsDropdown.classList.add('show');
    
    if (contactsList.length === 0) {
        contactsDropdownList.innerHTML = `
            <div class="loading-contacts-inline">
                <span>در حال بارگذاری...</span>
            </div>
        `;
        loadContacts().then(() => {
            displayContactsInDropdown();
        });
    } else {
        displayContactsInDropdown();
    }
}

function closeContactsDropdown() {
    const contactsDropdown = document.getElementById('contactsDropdown');
    if (contactsDropdown) {
        contactsDropdown.classList.remove('show');
    }
}

function displayContactsInDropdown() {
    const contactsDropdownList = document.getElementById('contactsDropdownList');
    if (!contactsDropdownList) return;
    
    if (contactsList.length === 0) {
        contactsDropdownList.innerHTML = `
            <div class="empty-contacts">
                <span>هیچ مخاطبی یافت نشد</span>
            </div>
        `;
        return;
    }
    
    contactsDropdownList.innerHTML = contactsList.map(contact => {
        const avatar = contact.profile_image 
            ? `<img src="${contact.profile_image}" alt="${contact.name || contact.username}">`
            : `<span>${(contact.name || contact.username || contact.email).charAt(0).toUpperCase()}</span>`;
        
        return `
            <div class="contact-item" data-email="${escapeHtml(contact.email)}">
                <div class="contact-avatar">
                    ${avatar}
                </div>
                <div class="contact-info">
                    <div class="contact-name">${escapeHtml(contact.name || contact.username || '')}</div>
                    <div class="contact-email">${escapeHtml(contact.email || '')}</div>
                </div>
            </div>
        `;
    }).join('');
    
    const contactItems = contactsDropdownList.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        item.addEventListener('click', function() {
            const email = this.dataset.email;
            const receiverInput = document.getElementById('receiverInput');
            if (receiverInput) {
                receiverInput.value = email;
                receiverInput.classList.remove('invalid-email');
                closeContactsDropdown();
                hideComposeError();
                receiverInput.focus();
            }
        });
    });
}

async function sendMessage() {
    const token = localStorage.getItem('access_token');
    const sendBtn = document.getElementById('sendBtn');
    const composeForm = document.getElementById('composeForm');
    
    const formData = new FormData();
    formData.append('subject', document.getElementById('subjectInput').value);
    formData.append('body', document.getElementById('bodyTextarea').value);
    formData.append('is_private', document.getElementById('isPrivateCheckbox').checked);
    
    const receiverEmail = document.getElementById('receiverInput').value.trim();
    if (document.getElementById('isPrivateCheckbox').checked && receiverEmail) {
        if (!isValidEmail(receiverEmail)) {
            showComposeError('لطفاً یک ایمیل معتبر وارد کنید');
            return;
        }
        formData.append('receiver_email', receiverEmail);
    }
    
    const attachment = document.getElementById('attachmentInput').files[0];
    if (attachment) {
        formData.append('attachment', attachment);
    }
    
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span>در حال ارسال...</span>';
    hideComposeError();
    
    try {
        const response = await fetch(`${API_BASE_URL}/send/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            closeComposeModal();
            showLoading('در حال بروزرسانی');
            await loadMessages(currentType);
            hideLoading();
            showSuccessMessage('پیام با موفقیت ارسال شد');
        } else {
            let errorMessage = 'خطا در ارسال پیام';
            if (data.error) {
                errorMessage = data.error;
            } else if (data.receiver_email) {
                errorMessage = data.receiver_email[0];
            } else if (data.subject) {
                errorMessage = data.subject[0];
            } else if (data.body) {
                errorMessage = data.body[0];
            }
            showComposeError(errorMessage);
        }
    } catch (error) {
        console.error('Error:', error);
        showComposeError('خطا در ارتباط با سرور');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span>ارسال</span>';
    }
}

function showComposeError(message) {
    const errorDiv = document.getElementById('composeError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideComposeError() {
    document.getElementById('composeError').style.display = 'none';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

async function openMessageDetail(messageId) {
    currentMessageId = messageId;
    const modal = document.getElementById('messageDetailModal');
    const contentDiv = document.getElementById('messageDetailContent');
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    modal.classList.add('show');
    contentDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>در حال بارگذاری...</p>
        </div>
    `;
    
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
            displayMessageDetailInModal(data.data);
            // Mark as read if user is receiver
            if (data.data.receiver_email) {
                markAsReadInModal(messageId);
            }
        } else {
            contentDiv.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <div class="empty-state-text">${data.error || 'خطا در دریافت پیام'}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        contentDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">خطا در ارتباط با سرور</div>
            </div>
        `;
    } finally {
        hideLoading();
    }
    
    // Setup close button
    document.getElementById('closeMessageDetailBtn').onclick = closeMessageDetail;
    document.getElementById('messageDetailModal').onclick = function(e) {
        if (e.target === this) {
            closeMessageDetail();
        }
    };
}

function closeMessageDetail() {
    const modal = document.getElementById('messageDetailModal');
    modal.classList.remove('show');
}

function displayMessageDetailInModal(message) {
    const contentDiv = document.getElementById('messageDetailContent');
    
    const senderName = message.sender_name || message.sender_username || message.sender_email;
    const senderAvatar = message.sender_profile_image 
        ? `<img src="${message.sender_profile_image}" alt="${senderName}">`
        : `<span>${senderName.charAt(0).toUpperCase()}</span>`;
    
    // بر اساس درخواست شما، بخش نمایش گیرنده را به‌طور کامل حذف کردیم
    const receiverInfo = '';
    
    const attachmentSection = message.has_attachment && message.attachment_url
        ? `
            <div style="margin-top: 20px; padding: 15px; background: rgba(42, 42, 62, 0.4); border-radius: 10px; display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 24px;">📎</div>
                <div style="flex-grow: 1;">
                    <div style="font-weight: 600; color: var(--arcane-white);">${escapeHtml(message.attachment_name || 'فایل ضمیمه')}</div>
                    <div style="font-size: 0.9em; color: rgba(255, 255, 255, 0.7);">حجم: ${message.attachment_size || 0} مگابایت</div>
                </div>
                <a href="${message.attachment_url}" style="padding: 8px 15px; background: var(--arcane-purple); border: none; border-radius: 8px; color: var(--arcane-white); cursor: pointer; text-decoration: none; display: inline-block;" download>دانلود</a>
            </div>
        `
        : '';
    
    const time = formatTime(message.created_at);
    
    contentDiv.innerHTML = `
        <div style="padding: 20px;">
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
            
            <div style="margin-bottom: 20px; text-align: right;">
                <div style="line-height: 1.8; color: var(--arcane-white); white-space: pre-wrap; word-wrap: break-word; text-align: right;">
                    ${escapeHtml(message.body || '')}
                </div>
                ${attachmentSection}
            </div>
            
            <div style="margin-bottom: 20px; color: rgba(255, 255, 255, 0.7); font-size: 14px;">
                ${time}
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--glass-border);">
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="toggleStarInModal(${message.id})" style="padding: 10px 20px; background: rgba(83, 52, 131, 0.6); border: 1px solid var(--arcane-purple); border-radius: 8px; color: var(--arcane-white); cursor: pointer; font-family: 'Vazirmatn', sans-serif; font-size: 14px;">
                        ${message.is_starred ? '⭐ حذف ستاره' : '⭐ ستاره‌دار'}
                    </button>
                    <button onclick="archiveMessage(${message.id}, ${message.status === 'archived'})" style="padding: 10px 20px; background: rgba(83, 52, 131, 0.6); border: 1px solid var(--arcane-purple); border-radius: 8px; color: var(--arcane-white); cursor: pointer; font-family: 'Vazirmatn', sans-serif; font-size: 14px;">
                        ${message.status === 'archived' ? '📦 خروج از آرشیو' : '📦 آرشیو'}
                    </button>
                    ${message.receiver_email ? `
                        <button onclick="toggleSenderSpamInModal(${message.id}, ${message.is_sender_spam || false})" style="padding: 10px 20px; background: ${message.is_sender_spam ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)'}; border: 1px solid ${message.is_sender_spam ? '#28a745' : '#dc3545'}; border-radius: 8px; color: var(--arcane-white); cursor: pointer; font-family: 'Vazirmatn', sans-serif; font-size: 14px;">
                            ${message.is_sender_spam ? '✅ خروج از اسپم' : '🚫 اسپم'}
                        </button>
                        <button onclick="toggleBlockSenderInModal('${escapeHtml(message.sender_email)}', ${message.is_sender_blocked || false}, ${message.id})" style="padding: 10px 20px; background: ${message.is_sender_blocked ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)'}; border: 1px solid ${message.is_sender_blocked ? '#28a745' : '#dc3545'}; border-radius: 8px; color: var(--arcane-white); cursor: pointer; font-family: 'Vazirmatn', sans-serif; font-size: 14px;">
                            ${message.is_sender_blocked ? '✅ خروج از بلاک' : '🚫 بلاک'}
                        </button>
                    ` : ''}
                    ${message.public_link_url ? `
                        <button onclick="copyPublicLink('${message.public_link_url}')" style="padding: 10px 20px; background: rgba(83, 52, 131, 0.6); border: 1px solid var(--arcane-purple); border-radius: 8px; color: var(--arcane-white); cursor: pointer; font-family: 'Vazirmatn', sans-serif; font-size: 14px;">
                            🔗 کپی لینک عمومی
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

async function markAsReadInModal(messageId) {
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
        // Reload messages to update read status
        loadMessages(currentType);
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

async function toggleStarInModal(messageId) {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/${messageId}/toggle-star/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            // Update modal content immediately without reload
            if (data.data) {
                displayMessageDetailInModal(data.data);
            }
            // Update message list in background without blocking
            loadMessages(currentType).catch(err => console.error('Error reloading messages:', err));
        } else {
            const data = await response.json();
            alert(data.error || 'خطا در تغییر وضعیت ستاره');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور');
    }
}

async function toggleSenderSpamInModal(messageId, isCurrentlySpam) {
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
            // Update modal content immediately
            if (data.data) {
                displayMessageDetailInModal(data.data);
            }
            // Reload messages in background
            loadMessages(currentType).catch(err => console.error('Error reloading messages:', err));
            hideLoading();
        } else {
            const data = await response.json();
            alert(data.error || 'خطا در تغییر وضعیت اسپم');
            hideLoading();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور');
        hideLoading();
    }
}

async function toggleBlockSenderInModal(senderEmail, isCurrentlyBlocked, messageId) {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    const confirmMessage = isCurrentlyBlocked 
        ? 'آیا مطمئن هستید که می‌خواهید این فرستنده را از بلاک خارج کنید؟'
        : 'آیا مطمئن هستید که می‌خواهید این فرستنده را بلاک کنید؟ این کاربر دیگر نمی‌تواند به شما پیام ارسال کند.';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showLoading(isCurrentlyBlocked ? 'در حال خارج کردن از بلاک' : 'در حال بلاک کردن');
        
        if (isCurrentlyBlocked) {
            // Unblock user
            const response = await fetch(`${API_BASE_URL}/unblock/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: senderEmail })
            });
            
            if (response.ok) {
                const data = await response.json();
                showSuccessMessage(data.message || 'فرستنده از بلاک خارج شد');
                // Reload message detail to update button state
                if (messageId) {
                    await openMessageDetail(messageId);
                }
            } else {
                const data = await response.json();
                alert(data.error || 'خطا در خروج از بلاک');
            }
        } else {
            // Block user
            const response = await fetch(`${API_BASE_URL}/block/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: senderEmail, is_spam: false })
            });
            
            if (response.ok) {
                const data = await response.json();
                showSuccessMessage(data.message || 'فرستنده بلاک شد');
                // Reload message detail to update button state
                if (messageId) {
                    await openMessageDetail(messageId);
                }
            } else {
                const data = await response.json();
                alert(data.error || 'خطا در بلاک کردن');
            }
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور');
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

async function archiveSelectedMessages() {
    const checkboxes = document.querySelectorAll('.message-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('لطفاً حداقل یک پیام را انتخاب کنید');
        return;
    }
    
    const messageIds = Array.from(checkboxes).map(cb => {
        const messageItem = cb.closest('.message-item');
        return messageItem ? messageItem.dataset.id : null;
    }).filter(id => id !== null);
    
    if (messageIds.length === 0) {
        alert('خطا در دریافت شناسه پیام‌ها');
        return;
    }
    
    // بررسی اینکه آیا در صفحه آرشیو هستیم یا نه
    const isArchived = currentType === 'archived';
    const action = isArchived ? 'unarchive' : 'archive';
    const confirmMessage = isArchived
        ? `آیا مطمئن هستید که می‌خواهید ${messageIds.length} پیام را از آرشیو خارج کنید؟`
        : `آیا مطمئن هستید که می‌خواهید ${messageIds.length} پیام را به آرشیو منتقل کنید؟`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    showLoading(isArchived ? 'در حال خروج از آرشیو' : 'در حال آرشیو کردن پیام‌ها');
    
    try {
        const promises = messageIds.map(messageId => 
            fetch(`${API_BASE_URL}/${messageId}/archive/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: action })
            })
        );
        
        const responses = await Promise.all(promises);
        const failed = responses.filter(r => !r.ok);
        
        if (failed.length > 0) {
            alert(`خطا در ${isArchived ? 'خروج از آرشیو' : 'آرشیو کردن'} ${failed.length} پیام`);
        } else {
            const successMessage = isArchived
                ? `${messageIds.length} پیام با موفقیت از آرشیو خارج شد`
                : `${messageIds.length} پیام با موفقیت به آرشیو منتقل شد`;
            showSuccessMessage(successMessage);
            await loadMessages(currentType);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور');
    } finally {
        hideLoading();
    }
}

async function archiveMessage(messageId, isArchived = false) {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    const action = isArchived ? 'unarchive' : 'archive';
    const confirmMessage = isArchived 
        ? 'آیا مطمئن هستید که می‌خواهید این پیام را از آرشیو خارج کنید؟'
        : 'آیا مطمئن هستید که می‌خواهید این پیام را به آرشیو منتقل کنید؟';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showLoading(isArchived ? 'در حال خروج از آرشیو' : 'در حال آرشیو کردن');
        const response = await fetch(`${API_BASE_URL}/${messageId}/archive/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: action })
        });
        
        if (response.ok) {
            const data = await response.json();
            showSuccessMessage(data.message || (isArchived ? 'پیام با موفقیت از آرشیو خارج شد' : 'پیام با موفقیت به آرشیو منتقل شد'));
            await loadMessages(currentType);
            closeMessageDetail();
        } else {
            const data = await response.json();
            alert(data.error || 'خطا در تغییر وضعیت آرشیو');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور');
    } finally {
        hideLoading();
    }
}

