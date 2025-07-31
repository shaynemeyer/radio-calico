# RadioCalico System Architecture

This document describes the system architecture for the RadioCalico live streaming web application.

## Architecture Overview

RadioCalico is a Node.js-based web application that provides live radio streaming with user interaction features including song ratings and metadata display.

## System Architecture Diagram

```mermaid
graph TB
    %% External Services
    subgraph "External Services (CloudFront)"
        Stream[HLS Stream<br/>live.m3u8]
        Metadata[Metadata API<br/>metadatav2.json]
        AlbumArt[Album Art<br/>cover.jpg]
    end

    %% Frontend
    subgraph "Frontend (Static Files)"
        HTML[index.html<br/>Main Interface]
        CSS[styles.css<br/>Styling & Responsive Design]
        JS[site.js<br/>Application Logic]
        Logo[RadioCalicoLogoTM.png<br/>Brand Logo]
        HLS[HLS.js Library<br/>Browser Compatibility]
    end

    %% Backend
    subgraph "Backend (Node.js/Express)"
        Server[server.js<br/>Express Server<br/>Port 3000]
        
        subgraph "API Endpoints"
            UserAPI["/api/users<br/>GET, POST"]
            RatingAPI["/api/songs/rate<br/>POST"]
            RatingGetAPI["/api/songs/:songId/ratings<br/>GET"]
            UserRatingAPI["/api/songs/:songId/user-rating/:userSession<br/>GET"]
        end
    end

    %% Database
    subgraph "Database (SQLite)"
        DB[(database.db)]
        UsersTable[users table<br/>id, name, email, created_at]
        RatingsTable[song_ratings table<br/>id, song_id, user_session, rating, created_at]
    end

    %% User/Browser
    Browser[User Browser<br/>Radio Interface]

    %% Connections
    Browser -->|HTTP Requests| Server
    Browser -->|Static Files| HTML
    Browser -->|Static Files| CSS
    Browser -->|Static Files| JS
    Browser -->|Static Files| Logo
    
    JS -->|HLS Streaming| HLS
    HLS -->|Fetch Stream| Stream
    JS -->|Fetch Metadata<br/>Every 30s| Metadata
    JS -->|Fetch Album Art| AlbumArt
    
    JS -->|API Calls| UserAPI
    JS -->|Rating Submissions| RatingAPI
    JS -->|Get Ratings| RatingGetAPI
    JS -->|Get User Rating| UserRatingAPI
    
    Server -->|Database Queries| DB
    DB --> UsersTable
    DB --> RatingsTable
    
    Server -->|CORS Enabled| Browser
    Server -->|Graceful Shutdown<br/>SIGINT| DB

    %% Styling
    classDef external fill:#e1f5fe
    classDef frontend fill:#f3e5f5
    classDef backend fill:#e8f5e8
    classDef database fill:#fff3e0
    classDef user fill:#fce4ec
    
    class Stream,Metadata,AlbumArt external
    class HTML,CSS,JS,Logo,HLS frontend
    class Server,UserAPI,RatingAPI,RatingGetAPI,UserRatingAPI backend
    class DB,UsersTable,RatingsTable database
    class Browser user
```

## Components

### Frontend
- **Static Files**: HTML, CSS, JavaScript served by Express
- **HLS.js**: JavaScript library for HTTP Live Streaming compatibility
- **User Interface**: Radio controls, metadata display, rating system

### Backend
- **Express Server**: Node.js web server on port 3000
- **REST API**: Endpoints for user management and song ratings
- **CORS**: Cross-origin resource sharing enabled

### Database
- **SQLite**: Local database file (database.db)
- **Tables**: Users and song ratings with proper relationships

### External Services
- **CloudFront CDN**: Hosts HLS stream, metadata API, and album art
- **Real-time Updates**: Metadata fetched every 30 seconds

## Data Flow

1. **Streaming**: Browser fetches HLS stream via HLS.js library
2. **Metadata**: JavaScript polls metadata API every 30 seconds
3. **User Interaction**: Rating submissions sent to backend API
4. **Data Persistence**: User data and ratings stored in SQLite database
5. **Real-time Updates**: Album art and track information updated dynamically

## Security Features

- CORS configuration for cross-origin requests
- Input validation on API endpoints
- Session-based user tracking (localStorage)
- Graceful database connection handling