const streamUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';
const metadataUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json';
const albumArtUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg';
let audio = document.getElementById('audioPlayer');
let hls;
let isPlaying = false;
let metadataInterval;
let currentSongId = null;
let userSession = null;

const playBtn = document.getElementById('playBtn');
const volumeSlider = document.getElementById('volumeSlider');
const status = document.getElementById('status');
const currentTrackDiv = document.getElementById('currentTrack');
const recentTracksDiv = document.getElementById('recentTracks');
const albumArtContainer = document.getElementById('albumArtContainer');
const ratingSection = document.getElementById('ratingSection');
const thumbsUpBtn = document.getElementById('thumbsUpBtn');
const thumbsDownBtn = document.getElementById('thumbsDownBtn');
const thumbsUpCount = document.getElementById('thumbsUpCount');
const thumbsDownCount = document.getElementById('thumbsDownCount');

function updateStatus(message, type = 'loading') {
    if (type === 'playing') {
        status.textContent = '0:35 / Live';
    } else {
        status.textContent = message;
    }
}

function initializePlayer() {
    if (Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
        });
        
        hls.loadSource(streamUrl);
        hls.attachMedia(audio);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            updateStatus('Stream loaded and ready', 'loading');
        });
        
        hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS error:', data);
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        updateStatus('Network error - retrying...', 'error');
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        updateStatus('Media error - attempting recovery...', 'error');
                        hls.recoverMediaError();
                        break;
                    default:
                        updateStatus('Fatal error occurred', 'error');
                        hls.destroy();
                        break;
                }
            }
        });
        
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = streamUrl;
        updateStatus('Using native HLS support', 'loading');
    } else {
        updateStatus('HLS is not supported in this browser', 'error');
    }
}


volumeSlider.addEventListener('input', function() {
    const volume = this.value / 100;
    audio.volume = volume;
});

audio.addEventListener('loadstart', () => {
    updateStatus('Loading stream...', 'loading');
});

audio.addEventListener('canplay', () => {
    updateStatus('Ready to play', 'loading');
});

audio.addEventListener('playing', () => {
    updateStatus('Playing live stream...', 'playing');
    isPlaying = true;
    playBtn.textContent = '⏸';
});

audio.addEventListener('pause', () => {
    updateStatus('Stream paused', 'loading');
    isPlaying = false;
    playBtn.textContent = '▶';
});

audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    updateStatus('Error loading stream', 'error');
    isPlaying = false;
    playBtn.textContent = '▶';
});

audio.volume = 1.0;

function generateUserSession() {
    if (!userSession) {
        userSession = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('radiocalico_user_session', userSession);
    }
    return userSession;
}

function loadUserSession() {
    userSession = localStorage.getItem('radiocalico_user_session');
    if (!userSession) {
        generateUserSession();
    }
}

function createSongId(artist, title) {
    return btoa((artist + '_' + title).toLowerCase().replace(/[^a-z0-9]/g, '_'));
}

async function rateSong(rating) {
    if (!currentSongId) return;
    
    try {
        const response = await fetch('/api/songs/rate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                songId: currentSongId,
                rating: rating,
                userSession: userSession
            })
        });
        
        if (response.ok) {
            await updateRatingDisplay();
        } else {
            console.error('Failed to submit rating');
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
    }
}

async function updateRatingDisplay() {
    if (!currentSongId) return;
    
    try {
        const [ratingsResponse, userRatingResponse] = await Promise.all([
            fetch(`/api/songs/${currentSongId}/ratings`),
            fetch(`/api/songs/${currentSongId}/user-rating/${userSession}`)
        ]);
        
        if (ratingsResponse.ok && userRatingResponse.ok) {
            const ratings = await ratingsResponse.json();
            const userRating = await userRatingResponse.json();
            
            thumbsUpCount.textContent = ratings.thumbs_up || 0;
            thumbsDownCount.textContent = ratings.thumbs_down || 0;
            
            thumbsUpBtn.classList.toggle('active', userRating.rating === 1);
            thumbsDownBtn.classList.toggle('active', userRating.rating === -1);
        }
    } catch (error) {
        console.error('Error updating rating display:', error);
    }
}

function fetchMetadata() {
    fetch(metadataUrl)
        .then(response => response.json())
        .then(data => {
            updateCurrentTrack(data);
            updateRecentTracks(data);
            updateAlbumArt();
        })
        .catch(error => {
            console.error('Error fetching metadata:', error);
            currentTrackDiv.innerHTML = '<div class="loading-metadata">Error loading track information</div>';
            recentTracksDiv.innerHTML = '<div class="loading-metadata">Error loading recent tracks</div>';
            showAlbumArtError();
        });
}

function updateAlbumArt() {
    const timestamp = Date.now();
    const img = document.createElement('img');
    img.className = 'album-art-large';
    img.alt = 'Album Art';
    img.src = `${albumArtUrl}?t=${timestamp}`;
    
    img.onload = function() {
        albumArtContainer.innerHTML = '';
        albumArtContainer.appendChild(img);
    };
    
    img.onerror = function() {
        showAlbumArtError();
    };
}

function showAlbumArtError() {
    albumArtContainer.innerHTML = '<div class="album-art-placeholder-large">No Image</div>';
}

function updateCurrentTrack(data) {
    const trackHtml = `
        <h2 class="artist-name">${data.artist || 'Unknown Artist'}</h2>
        <h3 class="song-title">${data.title || 'Unknown Title'}</h3>
        <p class="album-info">${data.album || 'Unknown Album'}${data.date ? ` (${data.date})` : ''}</p>
    `;
    currentTrackDiv.innerHTML = trackHtml;
    
    
    const newSongId = createSongId(data.artist || 'Unknown Artist', data.title || 'Unknown Title');
    if (newSongId !== currentSongId) {
        currentSongId = newSongId;
        ratingSection.style.display = 'block';
        updateRatingDisplay();
    }
}

function updateRecentTracks(data) {
    const recentTracks = [];
    for (let i = 1; i <= 5; i++) {
        const artist = data[`prev_artist_${i}`];
        const title = data[`prev_title_${i}`];
        if (artist && title) {
            recentTracks.push({ artist, title });
        }
    }
    
    if (recentTracks.length > 0) {
        const tracksHtml = recentTracks.map(track => `
            <div class="track-item">
                <strong>${track.artist}:</strong> <em>${track.title}</em>
            </div>
        `).join('');
        recentTracksDiv.innerHTML = tracksHtml;
    } else {
        recentTracksDiv.innerHTML = '<div class="loading-metadata">No recent tracks available</div>';
    }
}

function startMetadataUpdates() {
    fetchMetadata();
    metadataInterval = setInterval(fetchMetadata, 30000);
}

function stopMetadataUpdates() {
    if (metadataInterval) {
        clearInterval(metadataInterval);
        metadataInterval = null;
    }
}

playBtn.addEventListener('click', function() {
    if (!isPlaying) {
        audio.play().then(() => {
            isPlaying = true;
            playBtn.textContent = '⏸';
            updateStatus('Playing live stream...', 'playing');
            startMetadataUpdates();
        }).catch(error => {
            console.error('Play error:', error);
            updateStatus('Error playing stream', 'error');
        });
    } else {
        audio.pause();
        isPlaying = false;
        playBtn.textContent = '▶';
        updateStatus('Stream paused', 'loading');
        stopMetadataUpdates();
    }
});

thumbsUpBtn.addEventListener('click', () => rateSong(1));
thumbsDownBtn.addEventListener('click', () => rateSong(-1));

loadUserSession();
initializePlayer();
fetchMetadata();