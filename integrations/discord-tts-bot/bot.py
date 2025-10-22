#!/usr/bin/env python3
"""
Discord TTS Bot with VOICEVOX Integration
YouTube LIVE Commentary Mode
"""

import os
import asyncio
import logging
from pathlib import Path
from typing import Optional
import discord
from discord.ext import commands
import requests
import tempfile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
DISCORD_GUILD_ID = os.getenv('DISCORD_GUILD_ID')  # Optional
DISCORD_VOICE_CHANNEL_ID = os.getenv('DISCORD_VOICE_CHANNEL_ID')  # Auto-join channel
VOICEVOX_API_URL = os.getenv('VOICEVOX_API_URL', 'http://localhost:50021')
VOICEVOX_SPEAKER_ID = int(os.getenv('VOICEVOX_SPEAKER_ID', '1'))  # 1: ずんだもん (かわいい声)
TARGET_CHANNEL_ID = os.getenv('TARGET_CHANNEL_ID')  # Webhook channel to monitor

# Validate configuration
if not DISCORD_BOT_TOKEN:
    raise ValueError("DISCORD_BOT_TOKEN is required in .env file")

# Discord Bot setup
intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True
bot = commands.Bot(command_prefix='!', intents=intents)


class TTSQueue:
    """Queue for TTS requests"""
    def __init__(self):
        self.queue = asyncio.Queue()
        self.is_playing = False

    async def add(self, text: str, voice_client: discord.VoiceClient):
        """Add TTS request to queue"""
        await self.queue.put((text, voice_client))

    async def process(self):
        """Process TTS queue"""
        while True:
            try:
                text, voice_client = await self.queue.get()
                if voice_client and voice_client.is_connected():
                    await self._play_tts(text, voice_client)
                self.queue.task_done()
            except Exception as e:
                logger.error(f"Error processing TTS queue: {e}")
                await asyncio.sleep(1)

    async def _play_tts(self, text: str, voice_client: discord.VoiceClient):
        """Generate and play TTS audio"""
        try:
            self.is_playing = True
            logger.info(f"Generating TTS for: {text[:50]}...")

            # VOICEVOX API: Audio query
            audio_query_response = requests.post(
                f"{VOICEVOX_API_URL}/audio_query",
                params={"text": text, "speaker": VOICEVOX_SPEAKER_ID},
                timeout=10
            )
            audio_query_response.raise_for_status()
            audio_query = audio_query_response.json()

            # VOICEVOX API: Synthesis
            synthesis_response = requests.post(
                f"{VOICEVOX_API_URL}/synthesis",
                params={"speaker": VOICEVOX_SPEAKER_ID},
                json=audio_query,
                timeout=30
            )
            synthesis_response.raise_for_status()

            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                temp_file.write(synthesis_response.content)
                temp_path = temp_file.name

            # Play audio in Discord
            audio_source = discord.FFmpegPCMAudio(temp_path)
            voice_client.play(audio_source, after=lambda e: self._cleanup(temp_path, e))

            # Wait for playback to finish
            while voice_client.is_playing():
                await asyncio.sleep(0.1)

            logger.info("TTS playback completed")

        except requests.exceptions.RequestException as e:
            logger.error(f"VOICEVOX API error: {e}")
        except Exception as e:
            logger.error(f"TTS playback error: {e}")
        finally:
            self.is_playing = False

    def _cleanup(self, temp_path: str, error):
        """Cleanup temporary audio file"""
        if error:
            logger.error(f"Playback error: {error}")
        try:
            Path(temp_path).unlink(missing_ok=True)
        except Exception as e:
            logger.error(f"Failed to delete temp file: {e}")


# Global TTS queue
tts_queue = TTSQueue()


@bot.event
async def on_ready():
    """Bot startup event"""
    logger.info(f'Logged in as {bot.user} (ID: {bot.user.id})')
    logger.info(f'VOICEVOX API: {VOICEVOX_API_URL}')
    logger.info(f'Speaker ID: {VOICEVOX_SPEAKER_ID}')

    # Auto-join voice channel if configured
    if DISCORD_VOICE_CHANNEL_ID:
        try:
            channel = bot.get_channel(int(DISCORD_VOICE_CHANNEL_ID))
            if channel and isinstance(channel, discord.VoiceChannel):
                if not channel.guild.voice_client:
                    await channel.connect()
                    logger.info(f'Auto-joined voice channel: {channel.name}')
        except Exception as e:
            logger.error(f'Failed to auto-join voice channel: {e}')

    # Start TTS queue processor
    bot.loop.create_task(tts_queue.process())

    logger.info('Bot is ready! 🎤')


@bot.event
async def on_message(message: discord.Message):
    """Message event handler"""
    # Ignore bot's own messages
    if message.author == bot.user:
        return

    # Check if message is from target channel (if configured)
    if TARGET_CHANNEL_ID and str(message.channel.id) != TARGET_CHANNEL_ID:
        return

    # Check if message is from webhook (Claude Code notifications)
    if message.webhook_id:
        logger.info(f"Webhook message detected: {message.content[:100]}")

        # Get voice client
        voice_client = message.guild.voice_client

        # Auto-join if not connected
        if not voice_client and message.author.voice:
            channel = message.author.voice.channel
            voice_client = await channel.connect()
            logger.info(f"Joined voice channel: {channel.name}")

        # Add to TTS queue
        if voice_client:
            await tts_queue.add(message.content, voice_client)
        else:
            logger.warning("Not connected to voice channel. Skipping TTS.")

    # Process commands
    await bot.process_commands(message)


@bot.command(name='join')
async def join_voice(ctx: commands.Context):
    """Join voice channel"""
    if ctx.author.voice:
        channel = ctx.author.voice.channel
        if ctx.voice_client:
            await ctx.voice_client.move_to(channel)
        else:
            await channel.connect()
        await ctx.send(f"✅ Joined {channel.name}")
    else:
        await ctx.send("❌ You must be in a voice channel first!")


@bot.command(name='leave')
async def leave_voice(ctx: commands.Context):
    """Leave voice channel"""
    if ctx.voice_client:
        await ctx.voice_client.disconnect()
        await ctx.send("👋 Left voice channel")
    else:
        await ctx.send("❌ Not in a voice channel")


@bot.command(name='say')
async def say_text(ctx: commands.Context, *, text: str):
    """Say text with TTS"""
    voice_client = ctx.voice_client
    if not voice_client:
        if ctx.author.voice:
            channel = ctx.author.voice.channel
            voice_client = await channel.connect()
        else:
            await ctx.send("❌ Join a voice channel first!")
            return

    await tts_queue.add(text, voice_client)
    await ctx.send(f"🎤 Queued TTS: {text[:50]}...")


@bot.command(name='speaker')
async def change_speaker(ctx: commands.Context, speaker_id: int):
    """Change VOICEVOX speaker"""
    global VOICEVOX_SPEAKER_ID
    VOICEVOX_SPEAKER_ID = speaker_id
    await ctx.send(f"🎵 Changed speaker to ID: {speaker_id}")


@bot.command(name='status')
async def bot_status(ctx: commands.Context):
    """Show bot status"""
    voice_status = "✅ Connected" if ctx.voice_client else "❌ Not connected"
    queue_size = tts_queue.queue.qsize()
    embed = discord.Embed(title="🎤 TTS Bot Status", color=discord.Color.blue())
    embed.add_field(name="Voice", value=voice_status, inline=True)
    embed.add_field(name="Speaker ID", value=str(VOICEVOX_SPEAKER_ID), inline=True)
    embed.add_field(name="Queue", value=f"{queue_size} items", inline=True)
    await ctx.send(embed=embed)


def main():
    """Run bot"""
    try:
        logger.info("Starting Discord TTS Bot...")
        bot.run(DISCORD_BOT_TOKEN)
    except Exception as e:
        logger.error(f"Failed to start bot: {e}")
        raise


if __name__ == '__main__':
    main()
