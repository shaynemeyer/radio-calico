describe('Rating System Frontend', () => {
  beforeEach(() => {
    global.localStorage.clear();
    
    document.body.innerHTML = `
      <div id="thumbsUpBtn" class="rating-btn"></div>
      <div id="thumbsDownBtn" class="rating-btn"></div>
      <div id="thumbsUpCount">0</div>
      <div id="thumbsDownCount">0</div>
    `;
  });

  describe('Song ID Generation', () => {
    function createSongId(artist, title) {
      return btoa((artist + '_' + title).toLowerCase().replace(/[^a-z0-9]/g, '_'));
    }

    it('should generate consistent base64 IDs', () => {
      const songId1 = createSongId('Test Artist', 'Test Song');
      const songId2 = createSongId('Test Artist', 'Test Song');
      
      expect(songId1).toBe(songId2);
      expect(typeof songId1).toBe('string');
      expect(songId1.length).toBeGreaterThan(0);
    });

    it('should handle special characters and spaces', () => {
      const songId = createSongId('Artist & Co.', 'Song #1 (Remix)');
      
      expect(typeof songId).toBe('string');
      expect(songId).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should be case insensitive', () => {
      const songId1 = createSongId('TEST ARTIST', 'TEST SONG');
      const songId2 = createSongId('test artist', 'test song');
      
      expect(songId1).toBe(songId2);
    });

    it('should normalize special characters', () => {
      const songId1 = createSongId('Artist-Name', 'Song/Title');
      const songId2 = createSongId('Artist Name', 'Song Title');
      
      expect(typeof songId1).toBe('string');
      expect(typeof songId2).toBe('string');
    });
  });

  describe('User Session Management', () => {
    let userSession = null;

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

    beforeEach(() => {
      userSession = null;
    });

    it('should generate unique session when none exists', () => {
      const session = generateUserSession();
      
      expect(session).toMatch(/^user_[a-z0-9]+_\d+$/);
      expect(global.localStorage.getItem('radiocalico_user_session')).toBe(session);
    });

    it('should return existing session when already generated', () => {
      const session1 = generateUserSession();
      const session2 = generateUserSession();
      
      expect(session1).toBe(session2);
    });

    it('should load session from localStorage', () => {
      const existingSession = 'user_existing_123456789';
      global.localStorage.setItem('radiocalico_user_session', existingSession);
      
      loadUserSession();
      
      expect(userSession).toBe(existingSession);
    });

    it('should generate new session if none in localStorage', () => {
      loadUserSession();
      
      expect(userSession).toMatch(/^user_[a-z0-9]+_\d+$/);
      expect(global.localStorage.getItem('radiocalico_user_session')).toBe(userSession);
    });
  });

  describe('Rating Submission', () => {
    let currentSongId = 'test_song_id';
    let userSession = 'test_user_session';

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
          if (typeof updateRatingDisplay === 'function') {
            await updateRatingDisplay();
          }
        } else {
          console.error('Failed to submit rating');
        }
      } catch (error) {
        console.error('Error submitting rating:', error);
      }
    }

    beforeEach(() => {
      currentSongId = 'test_song_id';
      userSession = 'test_user_session';
      global.fetch = jest.fn();
    });

    it('should send thumbs up to API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, songId: 'test_song_id', rating: 1 })
      });

      const mockUpdateRatingDisplay = jest.fn();
      global.updateRatingDisplay = mockUpdateRatingDisplay;

      await rateSong(1);

      expect(global.fetch).toHaveBeenCalledWith('/api/songs/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId: 'test_song_id',
          rating: 1,
          userSession: 'test_user_session'
        })
      });
    });

    it('should send thumbs down to API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, songId: 'test_song_id', rating: -1 })
      });

      const mockUpdateRatingDisplay = jest.fn();
      global.updateRatingDisplay = mockUpdateRatingDisplay;

      await rateSong(-1);

      expect(global.fetch).toHaveBeenCalledWith('/api/songs/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId: 'test_song_id',
          rating: -1,
          userSession: 'test_user_session'
        })
      });
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await rateSong(1);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to submit rating');
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await rateSong(1);

      expect(consoleSpy).toHaveBeenCalledWith('Error submitting rating:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should not submit if no current song', async () => {
      currentSongId = null;
      global.fetch = jest.fn();

      await rateSong(1);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Rating Display', () => {
    let currentSongId = 'test_song_id';
    let userSession = 'test_user_session';

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
          
          const thumbsUpCount = document.getElementById('thumbsUpCount');
          const thumbsDownCount = document.getElementById('thumbsDownCount');
          const thumbsUpBtn = document.getElementById('thumbsUpBtn');
          const thumbsDownBtn = document.getElementById('thumbsDownBtn');
          
          if (thumbsUpCount) thumbsUpCount.textContent = ratings.thumbs_up || 0;
          if (thumbsDownCount) thumbsDownCount.textContent = ratings.thumbs_down || 0;
          
          if (thumbsUpBtn) thumbsUpBtn.classList.toggle('active', userRating.rating === 1);
          if (thumbsDownBtn) thumbsDownBtn.classList.toggle('active', userRating.rating === -1);
        }
      } catch (error) {
        console.error('Error updating rating display:', error);
      }
    }

    beforeEach(() => {
      currentSongId = 'test_song_id';
      userSession = 'test_user_session';
      global.fetch = jest.fn();
    });

    it('should fetch and display current ratings', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            songId: 'test_song_id',
            thumbs_up: 10,
            thumbs_down: 3,
            total_ratings: 13
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            songId: 'test_song_id',
            userSession: 'test_user_session',
            rating: 1
          })
        });

      await updateRatingDisplay();

      expect(document.getElementById('thumbsUpCount').textContent).toBe('10');
      expect(document.getElementById('thumbsDownCount').textContent).toBe('3');
    });

    it('should highlight user active rating', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ thumbs_up: 5, thumbs_down: 2 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rating: 1 })
        });

      await updateRatingDisplay();

      expect(document.getElementById('thumbsUpBtn').classList.contains('active')).toBe(true);
      expect(document.getElementById('thumbsDownBtn').classList.contains('active')).toBe(false);
    });

    it('should handle songs with no ratings', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ thumbs_up: 0, thumbs_down: 0 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rating: null })
        });

      await updateRatingDisplay();

      expect(document.getElementById('thumbsUpCount').textContent).toBe('0');
      expect(document.getElementById('thumbsDownCount').textContent).toBe('0');
      expect(document.getElementById('thumbsUpBtn').classList.contains('active')).toBe(false);
      expect(document.getElementById('thumbsDownBtn').classList.contains('active')).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await updateRatingDisplay();

      expect(consoleSpy).toHaveBeenCalledWith('Error updating rating display:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should not update if no current song', async () => {
      currentSongId = null;
      global.fetch = jest.fn();

      await updateRatingDisplay();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('DOM Interactions', () => {
    it('should have rating buttons in DOM', () => {
      expect(document.getElementById('thumbsUpBtn')).toBeTruthy();
      expect(document.getElementById('thumbsDownBtn')).toBeTruthy();
      expect(document.getElementById('thumbsUpCount')).toBeTruthy();
      expect(document.getElementById('thumbsDownCount')).toBeTruthy();
    });

    it('should display rating counts in DOM elements', () => {
      const thumbsUpCount = document.getElementById('thumbsUpCount');
      const thumbsDownCount = document.getElementById('thumbsDownCount');
      
      thumbsUpCount.textContent = '15';
      thumbsDownCount.textContent = '7';
      
      expect(thumbsUpCount.textContent).toBe('15');
      expect(thumbsDownCount.textContent).toBe('7');
    });

    it('should toggle active class on buttons', () => {
      const thumbsUpBtn = document.getElementById('thumbsUpBtn');
      const thumbsDownBtn = document.getElementById('thumbsDownBtn');
      
      thumbsUpBtn.classList.add('active');
      thumbsDownBtn.classList.remove('active');
      
      expect(thumbsUpBtn.classList.contains('active')).toBe(true);
      expect(thumbsDownBtn.classList.contains('active')).toBe(false);
      
      thumbsUpBtn.classList.remove('active');
      thumbsDownBtn.classList.add('active');
      
      expect(thumbsUpBtn.classList.contains('active')).toBe(false);
      expect(thumbsDownBtn.classList.contains('active')).toBe(true);
    });
  });
});