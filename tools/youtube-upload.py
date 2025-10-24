#!/usr/bin/env python3
"""
youtube-upload.py - Automated YouTube video upload via YouTube Data API v3

Usage:
    python3 youtube-upload.py --file video.mp4 --title "Title" --description "Description"

Features:
    - OAuth 2.0 authentication
    - Resumable upload for large files
    - Custom thumbnail upload
    - Category and privacy settings
    - Comprehensive error handling

Prerequisites:
    pip3 install google-api-python-client google-auth-oauthlib google-auth-httplib2

Setup:
    1. Create OAuth 2.0 credentials in Google Cloud Console
    2. Download credentials JSON file
    3. Run script - will open browser for authentication
    4. Token saved to token.json for future use
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    from googleapiclient.http import MediaFileUpload
except ImportError:
    print("❌ Error: Required packages not installed")
    print("Install: pip3 install google-api-python-client google-auth-oauthlib google-auth-httplib2")
    sys.exit(1)


# YouTube API scopes
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

# YouTube category IDs
CATEGORIES = {
    'film_animation': '1',
    'autos_vehicles': '2',
    'music': '10',
    'pets_animals': '15',
    'sports': '17',
    'short_movies': '18',
    'travel_events': '19',
    'gaming': '20',
    'videoblogging': '21',
    'people_blogs': '22',
    'comedy': '23',
    'entertainment': '24',
    'news_politics': '25',
    'howto_style': '26',
    'education': '27',
    'science_technology': '28',  # Default for Miyabi
    'nonprofits_activism': '29',
}


class YouTubeUploader:
    """YouTube video uploader with OAuth 2.0 authentication"""

    def __init__(self, credentials_file: str = 'credentials.json', token_file: str = 'token.json'):
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.youtube = None

    def authenticate(self) -> bool:
        """Authenticate with YouTube API using OAuth 2.0"""
        creds = None

        # Load existing token
        if os.path.exists(self.token_file):
            try:
                creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
            except Exception as e:
                print(f"⚠️  Warning: Failed to load token: {e}")

        # Refresh or get new token
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    print("🔄 Refreshing access token...")
                    creds.refresh(Request())
                except Exception as e:
                    print(f"❌ Token refresh failed: {e}")
                    creds = None

            # Authenticate with OAuth flow
            if not creds:
                if not os.path.exists(self.credentials_file):
                    print(f"❌ Error: Credentials file not found: {self.credentials_file}")
                    print("\nSetup Instructions:")
                    print("1. Go to: https://console.cloud.google.com/apis/credentials")
                    print("2. Create OAuth 2.0 Client ID (Desktop app)")
                    print("3. Download JSON and save as 'credentials.json'")
                    return False

                try:
                    print("🔐 Authenticating with Google OAuth 2.0...")
                    flow = InstalledAppFlow.from_client_secrets_file(self.credentials_file, SCOPES)
                    creds = flow.run_local_server(port=0)
                except Exception as e:
                    print(f"❌ Authentication failed: {e}")
                    return False

            # Save token for future use
            try:
                with open(self.token_file, 'w') as token:
                    token.write(creds.to_json())
                print(f"✅ Token saved to {self.token_file}")
            except Exception as e:
                print(f"⚠️  Warning: Failed to save token: {e}")

        # Build YouTube API client
        try:
            self.youtube = build('youtube', 'v3', credentials=creds)
            print("✅ YouTube API authenticated")
            return True
        except Exception as e:
            print(f"❌ Failed to build YouTube API client: {e}")
            return False

    def upload_video(
        self,
        file_path: str,
        title: str,
        description: str = '',
        category: str = '28',
        tags: Optional[list] = None,
        privacy: str = 'public',
        thumbnail: Optional[str] = None,
    ) -> Optional[str]:
        """Upload video to YouTube

        Args:
            file_path: Path to video file
            title: Video title
            description: Video description
            category: Category ID (default: 28 = Science & Technology)
            tags: List of tags
            privacy: Privacy status (public/unlisted/private)
            thumbnail: Path to thumbnail image (optional)

        Returns:
            Video ID if successful, None otherwise
        """
        if not self.youtube:
            print("❌ Error: Not authenticated. Call authenticate() first.")
            return None

        if not os.path.exists(file_path):
            print(f"❌ Error: Video file not found: {file_path}")
            return None

        # Default tags
        if tags is None:
            tags = ['Miyabi', 'AI', '自律開発', 'ゆっくり解説', 'プログラミング']

        # Video metadata
        body = {
            'snippet': {
                'title': title,
                'description': description,
                'categoryId': category,
                'tags': tags,
                'defaultLanguage': 'ja',
                'defaultAudioLanguage': 'ja',
            },
            'status': {
                'privacyStatus': privacy,
                'selfDeclaredMadeForKids': False,
            },
        }

        try:
            # Get file size for progress reporting
            file_size = os.path.getsize(file_path)
            print(f"📤 Uploading video: {os.path.basename(file_path)} ({file_size / 1024 / 1024:.1f} MB)")

            # Create media upload (resumable)
            media = MediaFileUpload(
                file_path,
                chunksize=1024 * 1024,  # 1MB chunks
                resumable=True,
                mimetype='video/*',
            )

            # Insert video
            request = self.youtube.videos().insert(
                part='snippet,status',
                body=body,
                media_body=media,
            )

            response = None
            last_progress = 0

            # Upload with progress reporting
            while response is None:
                try:
                    status, response = request.next_chunk()
                    if status:
                        progress = int(status.progress() * 100)
                        if progress > last_progress:
                            print(f"   Progress: {progress}%")
                            last_progress = progress
                except HttpError as e:
                    if e.resp.status in [500, 502, 503, 504]:
                        # Retry on server errors
                        print(f"⚠️  Server error {e.resp.status}, retrying...")
                        continue
                    else:
                        raise

            video_id = response['id']
            video_url = f"https://youtu.be/{video_id}"
            print(f"✅ Video uploaded successfully!")
            print(f"   Video ID: {video_id}")
            print(f"   URL: {video_url}")

            # Upload thumbnail if provided
            if thumbnail and os.path.exists(thumbnail):
                self.upload_thumbnail(video_id, thumbnail)

            return video_id

        except HttpError as e:
            print(f"❌ HTTP Error: {e.resp.status}")
            print(f"   Reason: {e.error_details}")
            return None
        except Exception as e:
            print(f"❌ Upload failed: {e}")
            return None

    def upload_thumbnail(self, video_id: str, thumbnail_path: str) -> bool:
        """Upload custom thumbnail for video

        Args:
            video_id: YouTube video ID
            thumbnail_path: Path to thumbnail image

        Returns:
            True if successful, False otherwise
        """
        if not self.youtube:
            print("❌ Error: Not authenticated")
            return False

        if not os.path.exists(thumbnail_path):
            print(f"⚠️  Warning: Thumbnail not found: {thumbnail_path}")
            return False

        try:
            print(f"📷 Uploading thumbnail: {os.path.basename(thumbnail_path)}")

            media = MediaFileUpload(thumbnail_path, mimetype='image/jpeg', resumable=True)

            self.youtube.thumbnails().set(videoId=video_id, media_body=media).execute()

            print("✅ Thumbnail uploaded successfully")
            return True

        except HttpError as e:
            print(f"⚠️  Warning: Thumbnail upload failed: {e.resp.status}")
            return False
        except Exception as e:
            print(f"⚠️  Warning: Thumbnail upload failed: {e}")
            return False

    def get_channel_info(self) -> Optional[dict]:
        """Get authenticated user's channel information"""
        if not self.youtube:
            print("❌ Error: Not authenticated")
            return None

        try:
            request = self.youtube.channels().list(part='snippet,statistics', mine=True)
            response = request.execute()

            if 'items' in response and len(response['items']) > 0:
                channel = response['items'][0]
                return {
                    'id': channel['id'],
                    'title': channel['snippet']['title'],
                    'subscribers': channel['statistics'].get('subscriberCount', 'Hidden'),
                    'views': channel['statistics']['viewCount'],
                    'videos': channel['statistics']['videoCount'],
                }
            else:
                print("❌ Error: No channel found")
                return None

        except Exception as e:
            print(f"❌ Failed to get channel info: {e}")
            return None


def main():
    parser = argparse.ArgumentParser(
        description='Upload video to YouTube via YouTube Data API v3',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Basic upload
    python3 youtube-upload.py --file video.mp4 --title "My Video"

    # Full options
    python3 youtube-upload.py \\
        --file video.mp4 \\
        --title "Miyabi開発進捗 2025-10-24" \\
        --description "AI自律開発プロジェクト進捗報告" \\
        --category 28 \\
        --tags "Miyabi,AI,Rust" \\
        --thumbnail thumbnail.png \\
        --privacy public

    # Get channel info
    python3 youtube-upload.py --channel-info
        """,
    )

    parser.add_argument('--file', type=str, help='Video file path')
    parser.add_argument('--title', type=str, help='Video title')
    parser.add_argument('--description', type=str, default='', help='Video description')
    parser.add_argument(
        '--category',
        type=str,
        default='28',
        help='Category ID (28=Science & Technology)',
    )
    parser.add_argument('--tags', type=str, help='Comma-separated tags')
    parser.add_argument(
        '--privacy',
        type=str,
        default='public',
        choices=['public', 'unlisted', 'private'],
        help='Privacy status',
    )
    parser.add_argument('--thumbnail', type=str, help='Thumbnail image path')
    parser.add_argument(
        '--credentials',
        type=str,
        default='credentials.json',
        help='OAuth credentials file',
    )
    parser.add_argument(
        '--token',
        type=str,
        default='token.json',
        help='Token cache file',
    )
    parser.add_argument(
        '--channel-info',
        action='store_true',
        help='Show channel information',
    )

    args = parser.parse_args()

    # Initialize uploader
    uploader = YouTubeUploader(credentials_file=args.credentials, token_file=args.token)

    # Authenticate
    if not uploader.authenticate():
        sys.exit(1)

    # Show channel info
    if args.channel_info:
        info = uploader.get_channel_info()
        if info:
            print("\n📺 Channel Information:")
            print(f"   Title: {info['title']}")
            print(f"   ID: {info['id']}")
            print(f"   Subscribers: {info['subscribers']}")
            print(f"   Total Views: {info['views']}")
            print(f"   Videos: {info['videos']}")
        return

    # Upload video
    if not args.file or not args.title:
        print("❌ Error: --file and --title are required")
        parser.print_help()
        sys.exit(1)

    tags = args.tags.split(',') if args.tags else None

    video_id = uploader.upload_video(
        file_path=args.file,
        title=args.title,
        description=args.description,
        category=args.category,
        tags=tags,
        privacy=args.privacy,
        thumbnail=args.thumbnail,
    )

    if video_id:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
