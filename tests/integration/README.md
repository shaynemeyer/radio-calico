# Integration Testing Notes

## Current Status

The integration tests require the full RadioCalico server to be running. To run integration tests manually:

1. Start the server:
   ```bash
   npm start
   ```

2. In a separate terminal, run:
   ```bash
   npm run test:integration
   ```

## Manual Testing Scenarios

Until full E2E automation is configured, test these scenarios manually:

### Single User Rating Flow
1. Open http://localhost:3000
2. Wait for song metadata to load
3. Click thumbs up button
4. Verify count increases and button becomes active
5. Click thumbs down button  
6. Verify thumbs up count decreases, thumbs down increases
7. Reload page - verify rating persists

### Multi-User Testing
1. Open site in two different browsers/incognito windows
2. Rate the same song differently in each
3. Verify both counts update independently
4. Reload both - verify ratings persist

### Error Handling
1. Disconnect network during rating
2. Verify graceful error handling
3. Reconnect and verify functionality resumes

## Future Improvements

- Configure proper test database for integration tests
- Add server startup/teardown automation
- Implement full E2E test scenarios
- Add visual regression testing