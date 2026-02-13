const API_BASE_URL = '/api/music';
let currentView = 'playlists';
let currentPlaylistId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    loadPlaylists();
    loadInvitations();
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
    // File input change
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('singleFileInput').addEventListener('change', handleSingleFileUpload);
    
    // Search input
    document.getElementById('songsSearchInput').addEventListener('input', debounce(loadSongs, 500));
    document.getElementById('songsFilterSelect').addEventListener('change', loadSongs);
    document.getElementById('addSongSearchInput').addEventListener('input', debounce(loadSongsForAddModal, 500));
    document.getElementById('addSongSearchInput').addEventListener('input', debounce(loadSongsForAddModal, 500));
    
    // Forms
    document.getElementById('createPlaylistForm').addEventListener('submit', handleCreatePlaylist);
    document.getElementById('editPlaylistForm').addEventListener('submit', handleEditPlaylist);
    document.getElementById('inviteForm').addEventListener('submit', handleInvite);
    
    // Invite modal email input autocomplete
    const inviteeEmailInput = document.getElementById('inviteeEmailInput');
    if (inviteeEmailInput) {
        inviteeEmailInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            if (inviteSearchTimeout) {
                clearTimeout(inviteSearchTimeout);
            }
            
            if (query.length >= 2) {
                inviteSearchTimeout = setTimeout(() => {
                    searchInviteEmails(query);
                }, 300);
            } else {
                closeInviteEmailSuggestions();
            }
        });
        
        inviteeEmailInput.addEventListener('focus', function() {
            const query = this.value.trim();
            if (query.length >= 2) {
                searchInviteEmails(query);
            }
        });
    }
    
    // Invite contacts button
    const inviteContactsIconBtn = document.getElementById('inviteContactsIconBtn');
    if (inviteContactsIconBtn) {
        inviteContactsIconBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleInviteContactsDropdown();
        });
    }
    
    // Close invite contacts button
    const closeInviteContactsBtn = document.getElementById('closeInviteContactsBtn');
    if (closeInviteContactsBtn) {
        closeInviteContactsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeInviteContactsDropdown();
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.receiver-combobox-wrapper') && !e.target.closest('#inviteContactsDropdown') && !e.target.closest('#inviteEmailSuggestions')) {
            closeInviteContactsDropdown();
            closeInviteEmailSuggestions();
        }
    });
    
    // Modal close on outside click
    document.getElementById('createPlaylistModal').addEventListener('click', function(e) {
        if (e.target === this) closeCreatePlaylistModal();
    });
    document.getElementById('editPlaylistModal').addEventListener('click', function(e) {
        if (e.target === this) closeEditPlaylistModal();
    });
    document.getElementById('inviteModal').addEventListener('click', function(e) {
        if (e.target === this) closeInviteModal();
    });
    document.getElementById('addSongToPlaylistModal').addEventListener('click', function(e) {
        if (e.target === this) closeAddSongToPlaylistModal();
    });
}

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

function getAuthHeadersFormData() {
    const token = localStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`
    };
}

function switchView(view) {
    currentView = view;
    
    // Hide all views
    document.querySelectorAll('.view-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from nav items
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected view
    if (view === 'playlists') {
        document.getElementById('playlistsView').style.display = 'block';
        document.querySelector('[data-view="playlists"]').classList.add('active');
        loadPlaylists();
    } else if (view === 'songs') {
        document.getElementById('songsView').style.display = 'block';
        document.querySelector('[data-view="songs"]').classList.add('active');
        selectedSongIds.clear();
        loadSongs();
    } else if (view === 'upload') {
        document.getElementById('uploadView').style.display = 'block';
        document.querySelector('[data-view="upload"]').classList.add('active');
    } else if (view === 'invitations') {
        document.getElementById('invitationsView').style.display = 'block';
        document.querySelector('[data-view="invitations"]').classList.add('active');
        loadInvitations();
    }
}

// Playlists
async function loadPlaylists() {
    const container = document.getElementById('playlistsList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>در حال بارگذاری...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <p>پلی‌لیستی وجود ندارد</p>
                    </div>
                `;
            } else {
                container.innerHTML = data.data.map(playlist => `
                    <div class="playlist-card" onclick="viewPlaylist(${playlist.id})">
                        <div class="playlist-card-icon">🎵</div>
                        <div class="playlist-card-name">${playlist.name}</div>
                        <div class="playlist-card-info">
                            ${playlist.songs_count} آهنگ • ${playlist.members_count} عضو
                        </div>
                    </div>
                `).join('');
            }
        } else {
            container.innerHTML = `<div class="empty-state"><p>خطا: ${data.error || 'خطا در بارگذاری'}</p></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><p>خطا در ارتباط با سرور</p></div>`;
    }
}

async function viewPlaylist(playlistId) {
    currentPlaylistId = playlistId;
    
    // Hide playlists view, show detail view
    document.getElementById('playlistsView').style.display = 'none';
    document.getElementById('playlistDetailView').style.display = 'block';
    
    const container = document.getElementById('playlistSongsList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>در حال بارگذاری...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const playlist = data.data;
            document.getElementById('playlistDetailTitle').textContent = playlist.name;
            
            // Check if user can edit (from API response)
            const canEdit = playlist.can_edit || false;
            
            document.getElementById('editPlaylistBtn').style.display = canEdit ? 'inline-block' : 'none';
            document.getElementById('inviteBtn').style.display = canEdit ? 'inline-block' : 'none';
            document.getElementById('addSongBtn').style.display = canEdit ? 'inline-block' : 'none';
            
            if (playlist.songs.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🎵</div>
                        <p>این پلی‌لیست خالی است</p>
                    </div>
                `;
            } else {
                container.innerHTML = playlist.songs.map(song => `
                    <div class="song-item" data-song-id="${song.id}">
                        <div class="song-icon">🎵</div>
                        <div class="song-info">
                            <div class="song-title">${song.title}</div>
                            <div class="song-details">
                                ${song.artist || 'خواننده نامشخص'} • ${song.album || 'آلبوم نامشخص'} • 
                                اضافه شده توسط: ${song.added_by_username}
                            </div>
                        </div>
                        <div class="song-actions">
                            ${canEdit ? `<button class="action-btn" onclick="removeSongFromPlaylist(${song.id})">حذف</button>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        } else {
            container.innerHTML = `<div class="empty-state"><p>خطا: ${data.error || 'خطا در بارگذاری'}</p></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><p>خطا در ارتباط با سرور</p></div>`;
    }
}

// Songs
let selectedSongIds = new Set();

async function loadSongs() {
    const container = document.getElementById('songsList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>در حال بارگذاری...</p></div>';
    
    const search = document.getElementById('songsSearchInput').value;
    const filter = document.getElementById('songsFilterSelect').value;
    
    let url = `${API_BASE_URL}/songs/?type=${filter}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    try {
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🎵</div>
                        <p>موزیکی یافت نشد</p>
                    </div>
                `;
            } else {
                container.innerHTML = data.data.map(song => {
                    const isSelected = selectedSongIds.has(song.id);
                    const privacyIcon = song.is_public ? '🌐' : '🔒';
                    const privacyTitle = song.is_public ? 'عمومی' : 'خصوصی';
                    
                    return `
                        <div class="song-item" data-song-id="${song.id}">
                            <input type="checkbox" class="song-checkbox" data-song-id="${song.id}" ${isSelected ? 'checked' : ''} onchange="toggleSongSelection(${song.id})">
                            <div class="song-privacy-icon" title="${privacyTitle}">${privacyIcon}</div>
                            <div class="song-icon">🎵</div>
                            <div class="song-info">
                                <div class="song-title">${song.title}</div>
                                <div class="song-details">
                                    ${song.artist || 'خواننده نامشخص'} • ${song.album || 'آلبوم نامشخص'} • 
                                    ${song.file_size_mb} MB • آپلود شده توسط: ${song.uploaded_by_username}
                                </div>
                            </div>
                            <div class="song-actions">
                                <button class="action-btn" onclick="addSongToCurrentPlaylist(${song.id})">افزودن به پلی‌لیست</button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                updateSelectedCount();
            }
        } else {
            container.innerHTML = `<div class="empty-state"><p>خطا: ${data.error || 'خطا در بارگذاری'}</p></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><p>خطا در ارتباط با سرور</p></div>`;
    }
}

function toggleSongSelection(songId) {
    const checkbox = document.querySelector(`.song-checkbox[data-song-id="${songId}"]`);
    if (checkbox.checked) {
        selectedSongIds.add(songId);
    } else {
        selectedSongIds.delete(songId);
    }
    updateSelectedCount();
}

function toggleSelectAllSongs() {
    const selectAllCheckbox = document.getElementById('selectAllSongs');
    const checkboxes = document.querySelectorAll('.song-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const songId = parseInt(checkbox.dataset.songId);
        if (selectAllCheckbox.checked) {
            selectedSongIds.add(songId);
        } else {
            selectedSongIds.delete(songId);
        }
    });
    
    updateSelectedCount();
}

function updateSelectedCount() {
    const count = selectedSongIds.size;
    const countSpan = document.getElementById('selectedCount');
    const makePublicBtn = document.getElementById('makePublicBtn');
    
    if (count > 0) {
        countSpan.textContent = `${count} آهنگ انتخاب شده`;
        makePublicBtn.style.display = 'inline-block';
    } else {
        countSpan.textContent = '';
        makePublicBtn.style.display = 'none';
    }
    
    // Update select all checkbox state
    const checkboxes = document.querySelectorAll('.song-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllSongs');
    if (checkboxes.length > 0) {
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
    }
}

async function makeSelectedSongsPublic() {
    if (selectedSongIds.size === 0) {
        alert('لطفاً حداقل یک آهنگ را انتخاب کنید');
        return;
    }
    
    if (!confirm(`آیا مطمئن هستید که می‌خواهید ${selectedSongIds.size} آهنگ را عمومی کنید؟`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/songs/update-public-status/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                song_ids: Array.from(selectedSongIds),
                is_public: true
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(data.message || `${selectedSongIds.size} آهنگ با موفقیت عمومی شد`, 'success');
            selectedSongIds.clear();
            document.getElementById('selectAllSongs').checked = false;
            loadSongs();
        } else {
            showToast(data.error || 'خطا در عمومی کردن آهنگ‌ها', 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
    }
}

// Upload
function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
        uploadFiles(files);
    }
}

function handleSingleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        uploadFiles([file]);
    }
}

async function uploadFiles(files) {
    const progressDiv = document.getElementById('uploadProgress');
    const progressText = document.getElementById('uploadProgressText');
    const isPublic = document.getElementById('isPublicCheckbox').checked;
    
    progressDiv.style.display = 'block';
    progressText.textContent = `در حال آپلود ${files.length} فایل...`;
    
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    formData.append('is_public', isPublic);
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload-multiple/`, {
            method: 'POST',
            headers: getAuthHeadersFormData(),
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            progressText.textContent = `✅ ${data.message}`;
            setTimeout(() => {
                progressDiv.style.display = 'none';
                document.getElementById('fileInput').value = '';
                document.getElementById('singleFileInput').value = '';
                loadSongs();
            }, 2000);
        } else {
            progressText.textContent = `❌ خطا: ${data.error || 'خطا در آپلود'}`;
        }
    } catch (error) {
        progressText.textContent = '❌ خطا در ارتباط با سرور';
    }
}

// Playlist Management
function openCreatePlaylistModal() {
    document.getElementById('createPlaylistModal').style.display = 'flex';
    document.getElementById('playlistNameInput').value = '';
    document.getElementById('createPlaylistError').style.display = 'none';
}

function closeCreatePlaylistModal() {
    document.getElementById('createPlaylistModal').style.display = 'none';
}

async function handleCreatePlaylist(e) {
    e.preventDefault();
    const name = document.getElementById('playlistNameInput').value.trim();
    const errorDiv = document.getElementById('createPlaylistError');
    
    if (!name) {
        errorDiv.textContent = 'نام پلی‌لیست الزامی است';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/create/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeCreatePlaylistModal();
            loadPlaylists();
        } else {
            errorDiv.textContent = data.error || 'خطا در ایجاد پلی‌لیست';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'خطا در ارتباط با سرور';
        errorDiv.style.display = 'block';
    }
}

function openEditPlaylistModal() {
    if (!currentPlaylistId) return;
    
    document.getElementById('editPlaylistModal').style.display = 'flex';
    document.getElementById('editPlaylistError').style.display = 'none';
    
    // Load current playlist name
    fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/`, {
        headers: getAuthHeaders()
    })
    .then(res => res.json())
    .then(data => {
        if (data.data) {
            document.getElementById('editPlaylistNameInput').value = data.data.name;
        }
    });
}

function closeEditPlaylistModal() {
    document.getElementById('editPlaylistModal').style.display = 'none';
}

async function handleEditPlaylist(e) {
    e.preventDefault();
    const name = document.getElementById('editPlaylistNameInput').value.trim();
    const errorDiv = document.getElementById('editPlaylistError');
    
    if (!name) {
        errorDiv.textContent = 'نام پلی‌لیست الزامی است';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/update/`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeEditPlaylistModal();
            viewPlaylist(currentPlaylistId);
            loadPlaylists();
        } else {
            errorDiv.textContent = data.error || 'خطا در ویرایش پلی‌لیست';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'خطا در ارتباط با سرور';
        errorDiv.style.display = 'block';
    }
}

async function addSongToCurrentPlaylist(songId) {
    if (!currentPlaylistId) {
        // Show playlist selection modal or create new
        showToast('لطفاً ابتدا یک پلی‌لیست را انتخاب کنید', 'info');
        switchView('playlists');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/add-song/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ song_id: songId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            viewPlaylist(currentPlaylistId);
            showToast('آهنگ با موفقیت به پلی‌لیست اضافه شد', 'success');
        } else {
            showToast(data.error || 'خطا در افزودن آهنگ', 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
    }
}

async function removeSongFromPlaylist(songId) {
    // Find the song element for immediate UI update
    const songElement = document.querySelector(`.song-item[data-song-id="${songId}"]`);
    const container = document.getElementById('playlistSongsList');
    
    if (!songElement) return;
    
    // Optimistically remove from UI - fade out animation
    songElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    songElement.style.opacity = '0.5';
    songElement.style.transform = 'translateX(-20px)';
    songElement.style.pointerEvents = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/remove-song/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ song_id: songId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Complete fade out and remove from DOM
            songElement.style.opacity = '0';
            songElement.style.transform = 'translateX(-100%)';
            
            setTimeout(() => {
                songElement.remove();
                
                // Check if list is empty and show empty state
                const remainingSongs = container.querySelectorAll('.song-item');
                if (remainingSongs.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🎵</div>
                            <p>این پلی‌لیست خالی است</p>
                        </div>
                    `;
                }
            }, 300);
            
            showToast('آهنگ با موفقیت از پلی‌لیست حذف شد', 'success');
        } else {
            // Restore UI on error
            songElement.style.opacity = '1';
            songElement.style.transform = 'translateX(0)';
            songElement.style.pointerEvents = 'auto';
            showToast(data.error || 'خطا در حذف آهنگ', 'error');
        }
    } catch (error) {
        // Restore UI on error
        songElement.style.opacity = '1';
        songElement.style.transform = 'translateX(0)';
        songElement.style.pointerEvents = 'auto';
        showToast('خطا در ارتباط با سرور', 'error');
    }
}

// Invitations
let inviteContactsList = [];
let inviteSearchTimeout = null;

function openInviteModal() {
    document.getElementById('inviteModal').style.display = 'flex';
    document.getElementById('inviteeEmailInput').value = '';
    document.getElementById('inviteError').style.display = 'none';
    closeInviteContactsDropdown();
    closeInviteEmailSuggestions();
    
    if (inviteContactsList.length === 0) {
        loadInviteContacts();
    }
}

function closeInviteModal() {
    document.getElementById('inviteModal').style.display = 'none';
    closeInviteContactsDropdown();
    closeInviteEmailSuggestions();
}

async function loadInviteContacts() {
    const token = localStorage.getItem('access_token');
    
    try {
        const response = await fetch('/api/message/contacts/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            inviteContactsList = data.data || [];
            displayInviteContactsInDropdown();
        } else {
            console.error('Failed to load contacts');
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

function displayInviteContactsInDropdown() {
    const contactsDropdownList = document.getElementById('inviteContactsDropdownList');
    if (!contactsDropdownList) return;
    
    if (inviteContactsList.length === 0) {
        contactsDropdownList.innerHTML = `
            <div class="empty-contacts" style="padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.7);">
                <span>هیچ مخاطبی یافت نشد</span>
            </div>
        `;
        return;
    }
    
    contactsDropdownList.innerHTML = inviteContactsList.map(contact => {
        const avatar = contact.profile_image 
            ? `<img src="${contact.profile_image}" alt="${contact.name || contact.username}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`
            : `<span style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--arcane-purple), var(--arcane-pink)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${(contact.name || contact.username || contact.email || '').charAt(0).toUpperCase()}</span>`;
        
        return `
            <div class="contact-item" data-email="${escapeHtml(contact.email)}" style="
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='rgba(142, 36, 170, 0.2)';" onmouseout="this.style.background='transparent';">
                <div class="contact-avatar" style="flex-shrink: 0;">
                    ${avatar}
                </div>
                <div class="contact-info" style="flex: 1; min-width: 0;">
                    <div class="contact-name" style="color: var(--arcane-white); font-weight: 600; font-size: 14px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(contact.name || contact.username || '')}</div>
                    <div class="contact-email" style="color: rgba(255, 255, 255, 0.7); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(contact.email || '')}</div>
                </div>
            </div>
        `;
    }).join('');
    
    const contactItems = contactsDropdownList.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        item.addEventListener('click', function() {
            const email = this.dataset.email;
            const inviteeEmailInput = document.getElementById('inviteeEmailInput');
            if (inviteeEmailInput) {
                inviteeEmailInput.value = email;
                inviteeEmailInput.classList.remove('invalid-email');
                closeInviteContactsDropdown();
                closeInviteEmailSuggestions();
                inviteeEmailInput.focus();
            }
        });
    });
}

function toggleInviteContactsDropdown() {
    const contactsDropdown = document.getElementById('inviteContactsDropdown');
    if (contactsDropdown) {
        if (contactsDropdown.style.display === 'block') {
            closeInviteContactsDropdown();
        } else {
            openInviteContactsDropdown();
        }
    }
}

function openInviteContactsDropdown() {
    const contactsDropdown = document.getElementById('inviteContactsDropdown');
    const contactsDropdownList = document.getElementById('inviteContactsDropdownList');
    
    if (!contactsDropdown || !contactsDropdownList) return;
    
    closeInviteEmailSuggestions();
    contactsDropdown.style.display = 'block';
    
    if (inviteContactsList.length === 0) {
        contactsDropdownList.innerHTML = `
            <div class="loading-contacts-inline" style="padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.7);">
                <span>در حال بارگذاری...</span>
            </div>
        `;
        loadInviteContacts().then(() => {
            displayInviteContactsInDropdown();
        });
    } else {
        displayInviteContactsInDropdown();
    }
}

function closeInviteContactsDropdown() {
    const contactsDropdown = document.getElementById('inviteContactsDropdown');
    if (contactsDropdown) {
        contactsDropdown.style.display = 'none';
    }
}

function closeInviteEmailSuggestions() {
    const suggestions = document.getElementById('inviteEmailSuggestions');
    if (suggestions) {
        suggestions.style.display = 'none';
    }
}

async function searchInviteEmails(query) {
    if (!query || query.length < 2) {
        closeInviteEmailSuggestions();
        return;
    }
    
    const token = localStorage.getItem('access_token');
    
    try {
        const response = await fetch(`/api/message/search-emails/?q=${encodeURIComponent(query)}&limit=10`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayInviteEmailSuggestions(data.data || []);
        } else {
            closeInviteEmailSuggestions();
        }
    } catch (error) {
        console.error('Error searching emails:', error);
        closeInviteEmailSuggestions();
    }
}

function displayInviteEmailSuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('inviteEmailSuggestions');
    if (!suggestionsDiv) return;
    
    if (suggestions.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    suggestionsDiv.innerHTML = suggestions.map(suggestion => `
        <div class="email-suggestion-item" data-email="${escapeHtml(suggestion.email)}" style="
            padding: 12px 15px;
            cursor: pointer;
            border-bottom: 1px solid var(--glass-border);
            transition: all 0.2s ease;
        " onmouseover="this.style.background='rgba(142, 36, 170, 0.2)';" onmouseout="this.style.background='transparent';">
            <div style="color: var(--arcane-white); font-weight: 600; font-size: 14px; margin-bottom: 4px;">${escapeHtml(suggestion.name || suggestion.username)}</div>
            <div style="color: rgba(255, 255, 255, 0.7); font-size: 12px;">${escapeHtml(suggestion.email)}</div>
        </div>
    `).join('');
    
    suggestionsDiv.style.display = 'block';
    
    const suggestionItems = suggestionsDiv.querySelectorAll('.email-suggestion-item');
    suggestionItems.forEach(item => {
        item.addEventListener('click', function() {
            const email = this.dataset.email;
            const inviteeEmailInput = document.getElementById('inviteeEmailInput');
            if (inviteeEmailInput) {
                inviteeEmailInput.value = email;
                closeInviteEmailSuggestions();
                closeInviteContactsDropdown();
            }
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


async function handleInvite(e) {
    e.preventDefault();
    const email = document.getElementById('inviteeEmailInput').value.trim();
    const errorDiv = document.getElementById('inviteError');
    
    if (!email) {
        errorDiv.textContent = 'ایمیل الزامی است';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/invite/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ invitee_email: email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeInviteModal();
            showToast('دعوت با موفقیت ارسال شد', 'success');
        } else {
            errorDiv.textContent = data.error || 'خطا در ارسال دعوت';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'خطا در ارتباط با سرور';
        errorDiv.style.display = 'block';
    }
}

async function loadInvitations() {
    const container = document.getElementById('invitationsList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>در حال بارگذاری...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/invitations/`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const pendingInvitations = data.data.filter(inv => inv.status === 'pending');
            
            // Update badge
            const badge = document.getElementById('invitationsBadge');
            if (pendingInvitations.length > 0) {
                badge.textContent = pendingInvitations.length;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
            
            if (pendingInvitations.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📨</div>
                        <p>دعوتی وجود ندارد</p>
                    </div>
                `;
            } else {
                container.innerHTML = pendingInvitations.map(inv => `
                    <div class="invitation-item">
                        <div class="invitation-info">
                            <div class="invitation-title">${inv.playlist_name}</div>
                            <div class="invitation-details">
                                دعوت شده توسط: ${inv.inviter_username} (${inv.inviter_email})
                            </div>
                        </div>
                        <div class="invitation-actions">
                            <button class="action-btn btn-accept" onclick="respondToInvitation(${inv.id}, true)">پذیرفتن</button>
                            <button class="action-btn btn-reject" onclick="respondToInvitation(${inv.id}, false)">رد کردن</button>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            container.innerHTML = `<div class="empty-state"><p>خطا: ${data.error || 'خطا در بارگذاری'}</p></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><p>خطا در ارتباط با سرور</p></div>`;
    }
}

async function respondToInvitation(invitationId, accept) {
    try {
        const response = await fetch(`${API_BASE_URL}/invitations/${invitationId}/respond/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ accept })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(accept ? 'دعوت پذیرفته شد' : 'دعوت رد شد', accept ? 'success' : 'info');
            loadInvitations();
            if (accept) {
                loadPlaylists();
            }
        } else {
            showToast(data.error || 'خطا در پاسخ به دعوت', 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
    }
}

function logout() {
    if (confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        showLoading('در حال خروج...');
        window.location.href = '/';
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Add Song to Playlist Modal
function openAddSongToPlaylistModal() {
    if (!currentPlaylistId) {
        showToast('لطفاً ابتدا یک پلی‌لیست را انتخاب کنید', 'info');
        return;
    }
    
    document.getElementById('addSongToPlaylistModal').style.display = 'flex';
    document.getElementById('addSongSearchInput').value = '';
    loadSongsForAddModal();
}

function closeAddSongToPlaylistModal() {
    document.getElementById('addSongToPlaylistModal').style.display = 'none';
}

async function loadSongsForAddModal() {
    const container = document.getElementById('addSongSongsList');
    const search = document.getElementById('addSongSearchInput').value;
    
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>در حال بارگذاری...</p></div>';
    
    let url = `${API_BASE_URL}/songs/?type=all`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    try {
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🎵</div>
                        <p>موزیکی یافت نشد</p>
                    </div>
                `;
            } else {
                // Get current playlist songs to filter out already added songs
                const playlistResponse = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/`, {
                    headers: getAuthHeaders()
                });
                const playlistData = await playlistResponse.json();
                const existingSongIds = playlistData.data ? playlistData.data.songs.map(s => s.id) : [];
                
                const availableSongs = data.data.filter(song => !existingSongIds.includes(song.id));
                
                if (availableSongs.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">✅</div>
                            <p>همه آهنگ‌ها قبلاً به این پلی‌لیست اضافه شده‌اند</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = availableSongs.map(song => `
                        <div class="song-item" style="margin-bottom: 10px;">
                            <div class="song-icon">🎵</div>
                            <div class="song-info">
                                <div class="song-title">${song.title}</div>
                                <div class="song-details">
                                    ${song.artist || 'خواننده نامشخص'} • ${song.album || 'آلبوم نامشخص'} • 
                                    ${song.file_size_mb} MB
                                </div>
                            </div>
                            <div class="song-actions">
                                <button class="action-btn" onclick="addSongToPlaylistFromModal(${song.id})">افزودن</button>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } else {
            container.innerHTML = `<div class="empty-state"><p>خطا: ${data.error || 'خطا در بارگذاری'}</p></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><p>خطا در ارتباط با سرور</p></div>`;
    }
}

async function addSongToPlaylistFromModal(songId) {
    const btn = event.target;
    const songElement = btn.closest('.song-item');
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/add-song/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ song_id: songId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update the button and song element
            if (songElement) {
                songElement.style.opacity = '0.5';
                songElement.style.pointerEvents = 'none';
                btn.textContent = '✓ افزوده شد';
                btn.style.background = 'rgba(40, 167, 69, 0.5)';
                btn.disabled = true;
            }
            
            // Refresh playlist view
            viewPlaylist(currentPlaylistId);
            
            // Show success message
            showToast('آهنگ با موفقیت به پلی‌لیست اضافه شد', 'success');
        } else {
            showToast(data.error || 'خطا در افزودن آهنگ', 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
    }
}

