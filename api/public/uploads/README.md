# Uploads Directory

This directory stores uploaded files when Bunny CDN is not configured or unavailable.

## Structure

```
uploads/
├── images/              # Phase 2 - Generated/uploaded images
│   └── {teamId}/
│       └── {timestamp}.png
└── submissions/         # Phase 3 - File submissions
    └── {teamId}/
        └── {timestamp}-{filename}
```

## Access

Files are served via the API server at:
- `http://localhost:3001/uploads/images/{teamId}/{filename}`
- `http://localhost:3001/uploads/submissions/{teamId}/{filename}`

## Note

This folder is ignored by git (.gitignore) and is only used for local development.
In production, use Bunny CDN for better performance and reliability.

