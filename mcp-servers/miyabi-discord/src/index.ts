#!/usr/bin/env node

/**
 * Miyabi Discord MCP Server
 *
 * Discord Bot and Webhook integration for Miyabi Multi-Agent System
 * Provides bot operations, webhook messaging, server management, and notifications
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client, GatewayIntentBits, EmbedBuilder, WebhookClient, TextChannel, DMChannel, NewsChannel, VoiceChannel, StageChannel, ThreadChannel, BaseChannel } from "discord.js";
import axios from "axios";

// Environment configuration
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DEFAULT_GUILD_ID = process.env.DISCORD_DEFAULT_GUILD_ID || "";
const DEFAULT_CHANNEL_ID = process.env.DISCORD_DEFAULT_CHANNEL_ID || "";

// Discord client initialization
let discordClient: Client | null = null;

async function initializeDiscordClient() {
  if (!DISCORD_BOT_TOKEN) {
    console.error("Warning: DISCORD_BOT_TOKEN not provided. Bot operations will be disabled.");
    return null;
  }

  try {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildWebhooks
      ]
    });

    await client.login(DISCORD_BOT_TOKEN);
    console.error("Discord bot logged in successfully");
    return client;
  } catch (error) {
    console.error("Failed to initialize Discord client:", error);
    return null;
  }
}

// Initialize Discord client
discordClient = await initializeDiscordClient();

// Discord Embed type definition
interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  timestamp?: string;
  url?: string;
}

// Create MCP server
const server = new Server(
  {
    name: "miyabi-discord-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool: discord_send_message
 * Send a message to a Discord channel using bot
 */
async function sendMessage(args: any) {
  if (!discordClient) {
    throw new Error("Discord bot not initialized. Check DISCORD_BOT_TOKEN.");
  }

  const channelId = args.channel_id || DEFAULT_CHANNEL_ID;
  const content = args.content;
  const embeds = args.embeds || [];

  if (!channelId) {
    throw new Error("channel_id is required or set DEFAULT_CHANNEL_ID");
  }

  if (!content && !embeds.length) {
    throw new Error("Either content or embeds is required");
  }

  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    throw new Error("Invalid channel or not a text channel");
  }

  const textChannel = channel as TextChannel | DMChannel | NewsChannel | ThreadChannel;

  const messagePayload: any = {};
  if (content) messagePayload.content = content;

  if (embeds.length > 0) {
    messagePayload.embeds = embeds.map((embed: DiscordEmbed) => {
      const embedBuilder = new EmbedBuilder();

      if (embed.title) embedBuilder.setTitle(embed.title);
      if (embed.description) embedBuilder.setDescription(embed.description);
      if (embed.color) embedBuilder.setColor(embed.color);
      if (embed.fields) embedBuilder.addFields(embed.fields);
      if (embed.footer) embedBuilder.setFooter(embed.footer);
      if (embed.thumbnail) embedBuilder.setThumbnail(embed.thumbnail.url);
      if (embed.image) embedBuilder.setImage(embed.image.url);
      if (embed.timestamp) embedBuilder.setTimestamp(new Date(embed.timestamp));
      if (embed.url) embedBuilder.setURL(embed.url);

      return embedBuilder;
    });
  }

  const message = await textChannel.send(messagePayload);

  return {
    content: [
      {
        type: "text",
        text: `Message sent successfully to channel ${channelId}. Message ID: ${message.id}`,
      },
    ],
  };
}

/**
 * Tool: discord_edit_message
 * Edit an existing message
 */
async function editMessage(args: any) {
  if (!discordClient) {
    throw new Error("Discord bot not initialized. Check DISCORD_BOT_TOKEN.");
  }

  const channelId = args.channel_id || DEFAULT_CHANNEL_ID;
  const messageId = args.message_id;
  const content = args.content;
  const embeds = args.embeds || [];

  if (!channelId || !messageId) {
    throw new Error("channel_id and message_id are required");
  }

  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    throw new Error("Invalid channel or not a text channel");
  }

  const message = await channel.messages.fetch(messageId);

  const messagePayload: any = {};
  if (content) messagePayload.content = content;

  if (embeds.length > 0) {
    messagePayload.embeds = embeds.map((embed: DiscordEmbed) => {
      const embedBuilder = new EmbedBuilder();

      if (embed.title) embedBuilder.setTitle(embed.title);
      if (embed.description) embedBuilder.setDescription(embed.description);
      if (embed.color) embedBuilder.setColor(embed.color);
      if (embed.fields) embedBuilder.addFields(embed.fields);
      if (embed.footer) embedBuilder.setFooter(embed.footer);
      if (embed.thumbnail) embedBuilder.setThumbnail(embed.thumbnail.url);
      if (embed.image) embedBuilder.setImage(embed.image.url);
      if (embed.timestamp) embedBuilder.setTimestamp(new Date(embed.timestamp));
      if (embed.url) embedBuilder.setURL(embed.url);

      return embedBuilder;
    });
  }

  await message.edit(messagePayload);

  return {
    content: [
      {
        type: "text",
        text: `Message ${messageId} edited successfully in channel ${channelId}`,
      },
    ],
  };
}

/**
 * Tool: discord_delete_message
 * Delete a message
 */
async function deleteMessage(args: any) {
  if (!discordClient) {
    throw new Error("Discord bot not initialized. Check DISCORD_BOT_TOKEN.");
  }

  const channelId = args.channel_id || DEFAULT_CHANNEL_ID;
  const messageId = args.message_id;

  if (!channelId || !messageId) {
    throw new Error("channel_id and message_id are required");
  }

  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    throw new Error("Invalid channel or not a text channel");
  }

  const message = await channel.messages.fetch(messageId);
  await message.delete();

  return {
    content: [
      {
        type: "text",
        text: `Message ${messageId} deleted successfully from channel ${channelId}`,
      },
    ],
  };
}

/**
 * Tool: discord_add_reaction
 * Add a reaction to a message
 */
async function addReaction(args: any) {
  if (!discordClient) {
    throw new Error("Discord bot not initialized. Check DISCORD_BOT_TOKEN.");
  }

  const channelId = args.channel_id || DEFAULT_CHANNEL_ID;
  const messageId = args.message_id;
  const emoji = args.emoji;

  if (!channelId || !messageId || !emoji) {
    throw new Error("channel_id, message_id, and emoji are required");
  }

  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    throw new Error("Invalid channel or not a text channel");
  }

  const message = await channel.messages.fetch(messageId);
  await message.react(emoji);

  return {
    content: [
      {
        type: "text",
        text: `Reaction ${emoji} added to message ${messageId} in channel ${channelId}`,
      },
    ],
  };
}

/**
 * Tool: discord_get_channel_info
 * Get information about a Discord channel
 */
async function getChannelInfo(args: any) {
  if (!discordClient) {
    throw new Error("Discord bot not initialized. Check DISCORD_BOT_TOKEN.");
  }

  const channelId = args.channel_id || DEFAULT_CHANNEL_ID;

  if (!channelId) {
    throw new Error("channel_id is required or set DEFAULT_CHANNEL_ID");
  }

  const channel = await discordClient.channels.fetch(channelId);

  if (!channel) {
    throw new Error("Channel not found");
  }

  const channelInfo = {
    id: channel.id,
    name: channel.isDMBased() ? "DM Channel" : (channel as TextChannel | NewsChannel | VoiceChannel | StageChannel).name,
    type: channel.type,
    guild_id: channel.isDMBased() ? null : (channel as any).guildId,
    position: channel.isDMBased() ? null : (channel as TextChannel | NewsChannel | VoiceChannel | StageChannel).position,
    topic: channel.isTextBased() && 'topic' in channel ? (channel as any).topic : null,
    nsfw: channel.isTextBased() && 'nsfw' in channel ? (channel as any).nsfw : null,
    parent_id: channel.isDMBased() ? null : (channel as any).parentId,
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(channelInfo, null, 2),
      },
    ],
  };
}

/**
 * Tool: discord_get_guild_info
 * Get information about a Discord guild (server)
 */
async function getGuildInfo(args: any) {
  if (!discordClient) {
    throw new Error("Discord bot not initialized. Check DISCORD_BOT_TOKEN.");
  }

  const guildId = args.guild_id || DEFAULT_GUILD_ID;

  if (!guildId) {
    throw new Error("guild_id is required or set DEFAULT_GUILD_ID");
  }

  const guild = await discordClient.guilds.fetch(guildId);

  if (!guild) {
    throw new Error("Guild not found");
  }

  const guildInfo = {
    id: guild.id,
    name: guild.name,
    description: guild.description,
    icon_url: guild.iconURL(),
    banner_url: guild.bannerURL(),
    member_count: guild.memberCount,
    verification_level: guild.verificationLevel,
    owner_id: guild.ownerId,
    created_at: guild.createdAt.toISOString(),
    features: guild.features,
    boost_level: guild.premiumTier,
    boost_count: guild.premiumSubscriptionCount,
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(guildInfo, null, 2),
      },
    ],
  };
}

/**
 * Tool: discord_list_channels
 * List channels in a guild
 */
async function listChannels(args: any) {
  if (!discordClient) {
    throw new Error("Discord bot not initialized. Check DISCORD_BOT_TOKEN.");
  }

  const guildId = args.guild_id || DEFAULT_GUILD_ID;

  if (!guildId) {
    throw new Error("guild_id is required or set DEFAULT_GUILD_ID");
  }

  const guild = await discordClient.guilds.fetch(guildId);
  const channels = await guild.channels.fetch();

  const channelList = channels.map(channel => ({
    id: channel?.id,
    name: channel?.name,
    type: channel?.type,
    position: channel?.position,
    parent_id: channel?.parentId,
  })).filter(channel => channel.id);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(channelList, null, 2),
      },
    ],
  };
}

/**
 * Tool: discord_webhook_send
 * Send a message via Discord webhook
 */
async function webhookSend(args: any) {
  const webhookUrl = args.webhook_url;
  const content = args.content;
  const embeds = args.embeds || [];
  const username = args.username;
  const avatarUrl = args.avatar_url;

  if (!webhookUrl) {
    throw new Error("webhook_url is required");
  }

  if (!content && !embeds.length) {
    throw new Error("Either content or embeds is required");
  }

  const payload: any = {};
  if (content) payload.content = content;
  if (username) payload.username = username;
  if (avatarUrl) payload.avatar_url = avatarUrl;

  if (embeds.length > 0) {
    payload.embeds = embeds.map((embed: DiscordEmbed) => ({
      title: embed.title,
      description: embed.description,
      color: embed.color,
      fields: embed.fields,
      footer: embed.footer,
      thumbnail: embed.thumbnail,
      image: embed.image,
      timestamp: embed.timestamp,
      url: embed.url,
    }));
  }

  const response = await axios.post(webhookUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return {
    content: [
      {
        type: "text",
        text: `Webhook message sent successfully. Status: ${response.status}`,
      },
    ],
  };
}

/**
 * Tool: discord_miyabi_notification
 * Send a formatted Miyabi system notification
 */
async function miyabiNotification(args: any) {
  const type = args.type || "info"; // info, success, warning, error
  const title = args.title;
  const message = args.message;
  const agent = args.agent;
  const task = args.task;
  const details = args.details;
  const webhookUrl = args.webhook_url;
  const channelId = args.channel_id || DEFAULT_CHANNEL_ID;

  if (!title || !message) {
    throw new Error("title and message are required");
  }

  // Define colors for different notification types
  const colors = {
    info: 0x3498db,     // Blue
    success: 0x2ecc71,  // Green
    warning: 0xf39c12,  // Orange
    error: 0xe74c3c,    // Red
  };

  // Create embed
  const embed: DiscordEmbed = {
    title: `🤖 Miyabi System - ${title}`,
    description: message,
    color: colors[type as keyof typeof colors] || colors.info,
    timestamp: new Date().toISOString(),
    footer: {
      text: "Miyabi Multi-Agent System",
      icon_url: "https://raw.githubusercontent.com/miyabi-ai/assets/main/logo-32x32.png"
    }
  };

  // Add fields if provided
  const fields = [];
  if (agent) fields.push({ name: "Agent", value: agent, inline: true });
  if (task) fields.push({ name: "Task", value: task, inline: true });
  if (details) fields.push({ name: "Details", value: details, inline: false });

  if (fields.length > 0) {
    embed.fields = fields;
  }

  // Send via webhook or bot
  if (webhookUrl) {
    return await webhookSend({
      webhook_url: webhookUrl,
      embeds: [embed],
      username: "Miyabi System",
      avatar_url: "https://raw.githubusercontent.com/miyabi-ai/assets/main/logo-64x64.png"
    });
  } else if (channelId) {
    return await sendMessage({
      channel_id: channelId,
      embeds: [embed]
    });
  } else {
    throw new Error("Either webhook_url or channel_id is required");
  }
}

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "discord_send_message",
        description: "Send a message to a Discord channel using bot",
        inputSchema: {
          type: "object",
          properties: {
            channel_id: { type: "string", description: "Discord channel ID (optional if default is set)" },
            content: { type: "string", description: "Message content" },
            embeds: {
              type: "array",
              description: "Array of Discord embeds",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  color: { type: "number" },
                  fields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        value: { type: "string" },
                        inline: { type: "boolean" }
                      },
                      required: ["name", "value"]
                    }
                  },
                  footer: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      icon_url: { type: "string" }
                    },
                    required: ["text"]
                  },
                  thumbnail: {
                    type: "object",
                    properties: {
                      url: { type: "string" }
                    },
                    required: ["url"]
                  },
                  image: {
                    type: "object",
                    properties: {
                      url: { type: "string" }
                    },
                    required: ["url"]
                  },
                  timestamp: { type: "string" },
                  url: { type: "string" }
                }
              }
            }
          }
        },
      },
      {
        name: "discord_edit_message",
        description: "Edit an existing Discord message",
        inputSchema: {
          type: "object",
          properties: {
            channel_id: { type: "string", description: "Discord channel ID" },
            message_id: { type: "string", description: "Discord message ID to edit" },
            content: { type: "string", description: "New message content" },
            embeds: {
              type: "array",
              description: "Array of Discord embeds",
              items: { type: "object" }
            }
          },
          required: ["message_id"]
        },
      },
      {
        name: "discord_delete_message",
        description: "Delete a Discord message",
        inputSchema: {
          type: "object",
          properties: {
            channel_id: { type: "string", description: "Discord channel ID" },
            message_id: { type: "string", description: "Discord message ID to delete" },
          },
          required: ["message_id"]
        },
      },
      {
        name: "discord_add_reaction",
        description: "Add a reaction to a Discord message",
        inputSchema: {
          type: "object",
          properties: {
            channel_id: { type: "string", description: "Discord channel ID" },
            message_id: { type: "string", description: "Discord message ID" },
            emoji: { type: "string", description: "Emoji to add (e.g., '✅', '❌', ':custom_emoji:')" },
          },
          required: ["message_id", "emoji"]
        },
      },
      {
        name: "discord_get_channel_info",
        description: "Get information about a Discord channel",
        inputSchema: {
          type: "object",
          properties: {
            channel_id: { type: "string", description: "Discord channel ID" },
          }
        },
      },
      {
        name: "discord_get_guild_info",
        description: "Get information about a Discord guild (server)",
        inputSchema: {
          type: "object",
          properties: {
            guild_id: { type: "string", description: "Discord guild ID" },
          }
        },
      },
      {
        name: "discord_list_channels",
        description: "List all channels in a Discord guild",
        inputSchema: {
          type: "object",
          properties: {
            guild_id: { type: "string", description: "Discord guild ID" },
          }
        },
      },
      {
        name: "discord_webhook_send",
        description: "Send a message via Discord webhook",
        inputSchema: {
          type: "object",
          properties: {
            webhook_url: { type: "string", description: "Discord webhook URL" },
            content: { type: "string", description: "Message content" },
            embeds: {
              type: "array",
              description: "Array of Discord embeds",
              items: { type: "object" }
            },
            username: { type: "string", description: "Override webhook username" },
            avatar_url: { type: "string", description: "Override webhook avatar URL" },
          },
          required: ["webhook_url"]
        },
      },
      {
        name: "discord_miyabi_notification",
        description: "Send a formatted Miyabi system notification to Discord",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["info", "success", "warning", "error"],
              description: "Notification type (default: info)"
            },
            title: { type: "string", description: "Notification title" },
            message: { type: "string", description: "Notification message" },
            agent: { type: "string", description: "Agent name (optional)" },
            task: { type: "string", description: "Task name (optional)" },
            details: { type: "string", description: "Additional details (optional)" },
            webhook_url: { type: "string", description: "Discord webhook URL (optional, will use bot if not provided)" },
            channel_id: { type: "string", description: "Discord channel ID (optional, uses default if not provided)" },
          },
          required: ["title", "message"]
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "discord_send_message":
        return await sendMessage(args);
      case "discord_edit_message":
        return await editMessage(args);
      case "discord_delete_message":
        return await deleteMessage(args);
      case "discord_add_reaction":
        return await addReaction(args);
      case "discord_get_channel_info":
        return await getChannelInfo(args);
      case "discord_get_guild_info":
        return await getGuildInfo(args);
      case "discord_list_channels":
        return await listChannels(args);
      case "discord_webhook_send":
        return await webhookSend(args);
      case "discord_miyabi_notification":
        return await miyabiNotification(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Miyabi Discord MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});