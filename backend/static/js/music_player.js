// ==================== Music Player Functions ====================

function playSongFromList(songId, index) {
    if (!window.currentSongsList) return;
    
    const song = window.currentSongsList.find(s => s.id === songId);
    if (!song) return;
    
    // Set queue to current list
    queue = [...window.currentSongsList];
    originalQueue = [...window.currentSongsList];
    currentSongIndex = index;
    
    playSong(song);
}

function playSongFromPlaylist(songId, index) {
    if (!window.currentPlaylistSongs) return;
    
    const song = window.currentPlaylistSongs.find(s => s.id === songId);
    if (!song) return;
    
    // Set queue to playlist songs
    queue = [...window.currentPlaylistSongs];
    originalQueue = [...window.currentPlaylistSongs];
    currentSongIndex = index;
    
    playSong(song);
}

function playSong(song, startPosition = null) {
    if (!audioPlayer) return;
    
    currentSong = song;
    
    // Update UI
    document.getElementById('currentSongTitle').textContent = song.title;
    document.getElementById('currentSongArtist').textContent = song.artist || 'خواننده نامشخص';
    document.getElementById('musicPlayer').style.display = 'flex';
    
    // Load and play
    audioPlayer.src = song.file_url;
    audioPlayer.load();
    
    // Set start position if provided
    if (startPosition !== null && startPosition > 0) {
        audioPlayer.addEventListener('loadedmetadata', function setPosition() {
            if (audioPlayer.duration && startPosition < audioPlayer.duration) {
                audioPlayer.currentTime = startPosition;
            }
            audioPlayer.removeEventListener('loadedmetadata', setPosition);
        }, { once: true });
    }
    
    audioPlayer.play().catch(e => {
        console.error('Play error:', e);
        showToast('خطا در پخش موزیک', 'error');
    });
    
    // Update favorite button
    updateFavoriteButton();
    
    // Update queue display
    updateQueueDisplay();
    
    // Highlight current song in list
    highlightCurrentSong();
    
    // Save playback state (will be saved periodically during playback)
}

function togglePlayPause() {
    if (!audioPlayer || !currentSong) return;
    
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play().catch(e => {
            console.error('Play error:', e);
            showToast('خطا در پخش موزیک', 'error');
        });
    }
}

function playNext() {
    if (queue.length === 0) return;
    
    if (isShuffled) {
        // Random next song
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === currentSongIndex && queue.length > 1);
        currentSongIndex = nextIndex;
    } else {
        currentSongIndex = (currentSongIndex + 1) % queue.length;
    }
    
    if (currentSongIndex < queue.length) {
        playSong(queue[currentSongIndex]);
    }
}

function playPrevious() {
    if (queue.length === 0) return;
    
    if (isShuffled) {
        // Random previous song
        let prevIndex;
        do {
            prevIndex = Math.floor(Math.random() * queue.length);
        } while (prevIndex === currentSongIndex && queue.length > 1);
        currentSongIndex = prevIndex;
    } else {
        currentSongIndex = (currentSongIndex - 1 + queue.length) % queue.length;
    }
    
    if (currentSongIndex >= 0) {
        playSong(queue[currentSongIndex]);
    }
}

function handleSongEnd() {
    if (repeatMode === 'one') {
        // Repeat current song
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else if (repeatMode === 'all' || currentSongIndex < queue.length - 1) {
        // Play next or loop
        playNext();
    } else {
        // End of queue
        isPlaying = false;
        updatePlayPauseButton();
    }
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    const btn = document.getElementById('shuffleBtn');
    if (isShuffled) {
        btn.classList.add('active');
        // Shuffle queue
        if (queue.length > 0) {
            const current = queue[currentSongIndex];
            queue = queue.filter((_, i) => i !== currentSongIndex);
            shuffleArray(queue);
            queue.unshift(current);
            currentSongIndex = 0;
            updateQueueDisplay();
        }
    } else {
        btn.classList.remove('active');
        // Restore original order
        if (originalQueue.length > 0) {
            const current = queue[currentSongIndex];
            queue = [...originalQueue];
            currentSongIndex = queue.findIndex(s => s.id === current.id);
            if (currentSongIndex === -1) currentSongIndex = 0;
            updateQueueDisplay();
        }
    }
}

function toggleRepeat() {
    const btn = document.getElementById('repeatBtn');
    const icon = document.getElementById('repeatIcon');
    
    if (repeatMode === 'off') {
        repeatMode = 'all';
        btn.classList.add('active');
        icon.textContent = '🔁';
        btn.title = 'تکرار همه';
    } else if (repeatMode === 'all') {
        repeatMode = 'one';
        icon.textContent = '🔂';
        btn.title = 'تکرار یک';
    } else {
        repeatMode = 'off';
        btn.classList.remove('active');
        icon.textContent = '🔁';
        btn.title = 'بدون تکرار';
    }
}

function toggleMute() {
    if (!audioPlayer) return;
    
    isMuted = !isMuted;
    const btn = document.getElementById('volumeBtn');
    const icon = document.getElementById('volumeIcon');
    
    if (isMuted) {
        audioPlayer.volume = 0;
        icon.textContent = '🔇';
    } else {
        audioPlayer.volume = volume / 100;
        icon.textContent = volume > 50 ? '🔊' : volume > 0 ? '🔉' : '🔇';
    }
}

function setVolume(value) {
    volume = parseInt(value);
    if (!audioPlayer) return;
    
    if (!isMuted) {
        audioPlayer.volume = volume / 100;
    }
    
    localStorage.setItem('musicVolume', volume);
    
    const icon = document.getElementById('volumeIcon');
    icon.textContent = volume > 50 ? '🔊' : volume > 0 ? '🔉' : '🔇';
}

function seekTo(value) {
    if (!audioPlayer || !audioPlayer.duration) return;
    
    const seekTime = (value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
}

function updateProgress() {
    if (!audioPlayer || !audioPlayer.duration) return;
    
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    document.getElementById('progressBar').value = progress;
    document.getElementById('progressBarFill').style.width = progress + '%';
    
    document.getElementById('currentTime').textContent = formatTime(audioPlayer.currentTime);
}

function updateTotalTime() {
    if (!audioPlayer || !audioPlayer.duration) return;
    
    document.getElementById('totalTime').textContent = formatTime(audioPlayer.duration);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updatePlayPauseButton() {
    const btn = document.getElementById('playPauseBtn');
    const icon = document.getElementById('playPauseIcon');
    
    if (isPlaying) {
        icon.textContent = '⏸';
        btn.title = 'توقف';
    } else {
        icon.textContent = '▶';
        btn.title = 'پخش';
    }
    
    // Update song icon in lists
    highlightCurrentSong();
}

async function toggleFavorite() {
    if (!currentSong) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/songs/${currentSong.id}/toggle-favorite/`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentSong.is_favorite = data.is_favorite;
            updateFavoriteButton();
            showToast(data.message, 'success');
        } else {
            showToast(data.error || 'خطا در به‌روزرسانی علاقه‌مندی', 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
    }
}

function updateFavoriteButton() {
    if (!currentSong) return;
    
    const btn = document.getElementById('favoriteBtn');
    const icon = document.getElementById('favoriteIcon');
    
    if (currentSong.is_favorite) {
        icon.textContent = '❤️';
        btn.classList.add('active');
        btn.title = 'حذف از علاقه‌مندی‌ها';
    } else {
        icon.textContent = '♡';
        btn.classList.remove('active');
        btn.title = 'افزودن به علاقه‌مندی‌ها';
    }
}

function updateQueueDisplay() {
    const queueCount = document.getElementById('queueCount');
    if (queueCount) {
        queueCount.textContent = queue.length;
    }
    
    const queueList = document.getElementById('queueList');
    if (!queueList) return;
    
    queueList.innerHTML = queue.map((song, index) => {
        const isActive = index === currentSongIndex;
        return `
            <div class="queue-item ${isActive ? 'active' : ''}" onclick="playSongFromQueue(${index})">
                <div class="queue-item-artwork">🎵</div>
                <div class="queue-item-info">
                    <div class="queue-item-title">${song.title}</div>
                    <div class="queue-item-artist">${song.artist || 'خواننده نامشخص'}</div>
                </div>
            </div>
        `;
    }).join('');
}

function playSongFromQueue(index) {
    currentSongIndex = index;
    playSong(queue[index]);
}

function toggleQueue() {
    const modal = document.getElementById('queueModal');
    if (modal.style.display === 'none' || !modal.style.display) {
        modal.style.display = 'block';
        updateQueueDisplay();
    } else {
        modal.style.display = 'none';
    }
}

function highlightCurrentSong() {
    // Remove all playing classes and reset icons
    document.querySelectorAll('.song-item').forEach(item => {
        item.classList.remove('playing');
        const icon = item.querySelector('.song-icon');
        if (icon) {
            icon.textContent = '🎵';
        }
    });
    
    // Add playing class to current song and update icon
    if (currentSong) {
        const songItem = document.querySelector(`.song-item[data-song-id="${currentSong.id}"]`);
        if (songItem) {
            songItem.classList.add('playing');
            const icon = songItem.querySelector('.song-icon');
            if (icon) {
                icon.textContent = isPlaying ? '▶' : '🎵';
            }
        }
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ==================== Playback State Functions ====================

let lastSaveTime = 0;
const SAVE_INTERVAL = 5000; // Save every 5 seconds

async function savePlaybackState(songId, position) {
    if (!songId || position === undefined) return;
    
    // Throttle saves to avoid too many requests
    const now = Date.now();
    if (now - lastSaveTime < SAVE_INTERVAL && position > 0) {
        return;
    }
    lastSaveTime = now;
    
    try {
        await fetch(`${API_BASE_URL}/playback-state/save/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                song_id: songId,
                position: position
            })
        });
    } catch (error) {
        console.error('Error saving playback state:', error);
    }
}

async function loadPlaybackState() {
    try {
        const response = await fetch(`${API_BASE_URL}/playback-state/`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.data && data.data.song) {
            const playbackData = data.data;
            const song = playbackData.song;
            const position = playbackData.position || 0;
            
            // Only resume if position is significant (more than 5 seconds)
            if (position > 5) {
                // Set queue to single song
                queue = [song];
                originalQueue = [song];
                currentSongIndex = 0;
                
                // Load song and set position (but don't auto-play)
                currentSong = song;
                document.getElementById('currentSongTitle').textContent = song.title;
                document.getElementById('currentSongArtist').textContent = song.artist || 'خواننده نامشخص';
                document.getElementById('musicPlayer').style.display = 'flex';
                
                audioPlayer.src = song.file_url;
                audioPlayer.load();
                
                // Set position after metadata loads
                audioPlayer.addEventListener('loadedmetadata', function setPosition() {
                    if (audioPlayer.duration && position < audioPlayer.duration) {
                        audioPlayer.currentTime = position;
                    }
                    audioPlayer.removeEventListener('loadedmetadata', setPosition);
                }, { once: true });
                
                updateFavoriteButton();
                updateQueueDisplay();
                highlightCurrentSong();
                
                showToast('آخرین آهنگ پخش شده آماده است - برای ادامه روی پخش کلیک کنید', 'info');
            }
        }
    } catch (error) {
        console.error('Error loading playback state:', error);
    }
}

