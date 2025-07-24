const { setupServer } = require('msw/node');
const { http, HttpResponse } = require('msw');

const handlers = [
  http.get('https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json', () => {
    return HttpResponse.json({
      artist: 'Test Artist',
      title: 'Test Song',
      album: 'Test Album',
      date: '2023',
      prev_artist_1: 'Previous Artist 1',
      prev_title_1: 'Previous Song 1',
      prev_artist_2: 'Previous Artist 2',
      prev_title_2: 'Previous Song 2'
    });
  }),

  http.post('/api/songs/rate', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      songId: body.songId,
      rating: body.rating
    });
  }),

  http.get('/api/songs/:songId/ratings', ({ params }) => {
    return HttpResponse.json({
      songId: params.songId,
      thumbs_up: 5,
      thumbs_down: 2,
      total_ratings: 7
    });
  }),

  http.get('/api/songs/:songId/user-rating/:userSession', ({ params }) => {
    return HttpResponse.json({
      songId: params.songId,
      userSession: params.userSession,
      rating: 1
    });
  })
];

const server = setupServer(...handlers);

module.exports = { server, handlers };