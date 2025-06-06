import { Client, GatewayIntentBits, Partials, Collection, ChannelType } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import dotenv from 'dotenv';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

// Supabase setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel]
});

// Predefined categories and subcategories
const CATEGORY_CHOICES = [
  { name: 'Gaming', value: 'gaming' },
  { name: 'Anime/Manga', value: 'anime_manga' },
  { name: 'Cars', value: 'cars' },
  { name: 'Music', value: 'music' },
  { name: 'Technology', value: 'technology' },
  { name: 'Art', value: 'art' },
  { name: 'Education', value: 'education' },
  { name: 'Sports', value: 'sports' },
  { name: 'Movies/TV', value: 'movies_tv' },
  { name: 'Roleplay', value: 'roleplay' },
  { name: 'Community', value: 'community' },
  { name: 'Memes', value: 'memes' },
  { name: 'Programming', value: 'programming' },
  { name: 'Science', value: 'science' },
  { name: 'Other', value: 'other' }
];

// Command definitions
const commands = [
  {
    name: 'register',
    description: 'Register your server for partnerships',
    options: [
      { name: 'description', type: 3, description: 'Server description', required: true },
      { name: 'invite_link', type: 3, description: 'Permanent invite link', required: true },
      { name: 'category', type: 3, description: 'Main category', required: true, choices: CATEGORY_CHOICES },
      { name: 'category1', type: 3, description: 'Subcategory 1', required: true, choices: CATEGORY_CHOICES },
      { name: 'category2', type: 3, description: 'Subcategory 2', required: false, choices: CATEGORY_CHOICES },
      { name: 'category3', type: 3, description: 'Subcategory 3', required: false, choices: CATEGORY_CHOICES }
    ]
  },
  {
    name: 'setchannel',
    description: 'Set the channel for partnership posts',
    options: [
      { name: 'channel', type: 7, description: 'Channel', required: true }
    ]
  },
  {
    name: 'unregister',
    description: 'Remove your server from the partnership program'
  },
  {
    name: 'info',
    description: 'View your server partnership info'
  },
  {
    name: 'help',
    description: 'Show all available commands'
  },
  {
    name: 'shutdown',
    description: 'Shut down the bot (bot owner only)'
  },
  {
    name: 'status',
    description: 'Show the current status of the bot and number of registered servers'
  },
  {
    name: 'invite',
    description: 'Get the bot invite link and official server link'
  }
];

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
client.once('ready', async () => {
  try {
    await rest.put(
      Routes.applicationCommands((await client.application?.fetch() || client.user).id),
      { body: commands }
    );
    console.log('Slash commands registered.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
  // Set activity to show number of registered servers
  try {
    const { count } = await supabase.from('partnerships').select('*', { count: 'exact', head: true });
    client.user.setActivity(`${count || 0} servers being linked`, { type: 3 }); // type 3 = WATCHING
  } catch (err) {
    client.user.setActivity('servers being linked', { type: 3 });
  }
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, guildId, options, channel, user } = interaction;

  if (commandName === 'help') {
    await interaction.reply({
      ephemeral: true,
      embeds: [{
        color: 0x6a5acd,
        title: '🤖 GuildLinker Partnership Bot Help',
        description:
          '━━━━━━━━━━━━━━━━━━\n' +
          '✨ **Available Commands** ✨\n' +
          '━━━━━━━━━━━━━━━━━━\n' +
          '📝 **/register** — Register your server for partnerships\n' +
          '   ┗ _/register [description] [invite_link] [category] [category1] [category2] [category3]_\n' +
          '   ┗ _Tip: Use `/n` in your description to start a new line!_\n' +
          '\n' +
          '📢 **/setchannel** — Set the channel for partnership posts\n' +
          '   ┗ _/setchannel [channel]_\n' +
          '\n' +
          '❌ **/unregister** — Remove your server from the partnership program\n' +
          '\n' +
          'ℹ️ **/info** — View your server partnership info\n' +
          '\n' +
          '🛑 **/shutdown** — Shut down the bot (bot owner only)\n' +
          '\n' +
          '🔗 **/invite** — Get the bot invite link and official server\n' +
          '━━━━━━━━━━━━━━━━━━',
        footer: { text: 'GuildLinker Bot' }
      }]
    });
    return;
  }

  if (commandName === 'register') {
    let desc = options.getString('description');
    // Replace /n with real newlines, but preserve actual newlines from Discord
    desc = desc.replace(/\s*\/n\s*/g, '\n');
    // No need to strip or modify real newlines
    const invite = options.getString('invite_link');
    const category = options.getString('category');
    const cat1 = options.getString('category1');
    const cat2 = options.getString('category2');
    const cat3 = options.getString('category3');
    const subcategories = [cat1, cat2, cat3].filter(Boolean);
    const serverName = interaction.guild?.name || 'Unknown';
    const iconURL = interaction.guild?.iconURL({ dynamic: true, size: 256 }) || null;
    const upsertData = {
      guild_id: guildId,
      server_name: serverName,
      icon_url: iconURL,
      description: desc,
      invite_link: invite,
      category,
      subcategories,
      channel: null
    };
    const { error } = await supabase.from('partnerships').upsert(upsertData);
    if (error) {
      console.error('Supabase register error:', error, 'Tried to upsert:', upsertData);
      await interaction.reply({
        ephemeral: true,
        embeds: [{
          color: 0xff5555,
          title: '❌ Registration Failed',
          description: 'There was an error registering your server. Please try again later or contact support.',
          footer: { text: client.user.username }
        }]
      });
    } else {
      await interaction.reply({
        ephemeral: true,
        embeds: [{
          color: 0x57f287,
          title: '✅ Registration Successful',
          description: 'Your server has been registered for partnerships!\n\nUse **/setchannel** to set your partnership channel.',
          footer: { text: client.user.username }
        }]
      });
    }
    return;
  }

  if (commandName === 'setchannel') {
    const ch = options.getChannel('channel');
    if (!ch || ch.type !== ChannelType.GuildText) {
      await interaction.reply({ content: 'Please select a text channel.', ephemeral: true });
      return;
    }
    // Update channel in Supabase
    const { error } = await supabase.from('partnerships').update({ channel: ch.id }).eq('guild_id', guildId);
    if (error) {
      await interaction.reply({
        ephemeral: true,
        embeds: [{
          color: 0xff5555,
          title: '❌ Channel Not Set',
          description: 'Failed to set the partnership channel. Please try again.',
          footer: { text: client.user.username }
        }]
      });
      return;
    }
    await interaction.reply({
      ephemeral: true,
      embeds: [{
        color: 0x57f287,
        title: '📢 Channel Set',
        description: `Partnership channel set to <#${ch.id}>!`,
        footer: { text: client.user.username }
      }]
    });
    return;
  }

  if (commandName === 'unregister') {
    const { error } = await supabase.from('partnerships').delete().eq('guild_id', guildId);
    if (error) {
      await interaction.reply({
        ephemeral: true,
        embeds: [{
          color: 0xff5555,
          title: '❌ Unregister Failed',
          description: 'Failed to unregister your server. Please try again.',
          footer: { text: client.user.username }
        }]
      });
    } else {
      await interaction.reply({
        ephemeral: true,
        embeds: [{
          color: 0xff5555,
          title: '❌ Unregistered',
          description: 'Your server has been removed from the partnership program.',
          footer: { text: client.user.username }
        }]
      });
    }
    return;
  }

  if (commandName === 'info') {
    // Fetch latest icon URL from Discord
    const serverName = interaction.guild?.name || 'Unknown';
    const iconURL = interaction.guild?.iconURL({ dynamic: true, size: 256 }) || null;
    // Update icon_url in Supabase for this guild
    await supabase.from('partnerships').update({ icon_url: iconURL, server_name: serverName }).eq('guild_id', guildId);
    const { data, error } = await supabase.from('partnerships').select('*').eq('guild_id', guildId).single();
    if (error || !data) {
      await interaction.reply({
        ephemeral: true,
        embeds: [{
          color: 0xff5555,
          title: 'ℹ️ Not Registered',
          description: 'Your server is not registered for partnerships.',
          footer: { text: client.user.username }
        }]
      });
      return;
    }
    await interaction.reply({
      ephemeral: true,
      embeds: [{
        color: 0x6a5acd,
        title: `ℹ️ ${data.server_name || 'Server Info'}`,
        description:
          '━━━━━━━━━━━━━━━━━━\n' +
          `**📝 Description:**\n${data.description}\n\n` +
          `🔗 **Invite:** ${data.invite_link}\n` +
          `🏷️ **Category:** ${data.category}\n` +
          `🏷️ **Subcategories:** ${(data.subcategories || []).join(', ') || 'None'}\n` +
          `📢 **Channel:** ${data.channel ? `<#${data.channel}>` : 'Not set'}\n` +
          '━━━━━━━━━━━━━━━━━━',
        thumbnail: iconURL ? { url: iconURL } : undefined,
        footer: { text: client.user.username }
      }]
    });
    return;
  }

  if (commandName === 'shutdown') {
    // Only allow the bot owner to use this command
    const app = await client.application?.fetch();
    const ownerId = app?.owner?.id || app?.owner?.user?.id;
    if (user.id !== ownerId) {
      await interaction.reply({
        ephemeral: true,
        embeds: [{
          color: 0xff5555,
          title: '❌ Permission Denied',
          description: 'Only the bot owner can shut down the bot.',
          footer: { text: client.user.username }
        }]
      });
      return;
    }
    await interaction.reply({
      ephemeral: true,
      embeds: [{
        color: 0xff5555,
        title: '🛑 Shutting Down',
        description: 'The bot is shutting down. See you soon! 👋',
        footer: { text: client.user.username }
      }]
    });
    setTimeout(() => process.exit(0), 1000);
    return;
  }

  if (commandName === 'status') {
    // Fetch the number of registered servers from Supabase
    const { count, error } = await supabase.from('partnerships').select('*', { count: 'exact', head: true });
    if (error) {
      await interaction.reply({
        ephemeral: true,
        embeds: [{
          color: 0xff5555,
          title: '❌ Status Error',
          description: 'Failed to fetch bot status. Please try again later.',
          footer: { text: 'GuildLinker Bot' }
        }]
      });
      return;
    }
    await interaction.reply({
      ephemeral: true,
      embeds: [{
        color: 0x6a5acd,
        title: '📊 GuildLinker Status',
        description:
          '━━━━━━━━━━━━━━━━━━\n' +
          `🤖 **Bot Status:** Online\n` +
          `🌐 **Registered Servers:** ${count}\n` +
          `🕒 **Uptime:** ${(process.uptime() / 60).toFixed(1)} minutes\n` +
          '━━━━━━━━━━━━━━━━━━',
        footer: { text: 'GuildLinker Bot' }
      }]
    });
    return;
  }

  if (commandName === 'invite') {
    await interaction.reply({
      ephemeral: true,
      embeds: [
        {
          color: 0x6a5acd,
          title: '🤖 Invite GuildLinker to Your Server!',
          description:
            '**Add GuildLinker to your server:**\n' +
            '[Invite Link](https://discord.com/oauth2/authorize?client_id=1376795987116298251&permissions=2147601472&integration_type=0&scope=bot)\n\n' +
            '**Join the Official GuildLinker Discord:**\n' +
            '[Official Server](https://discord.gg/gF434TXafj)',
          footer: { text: 'GuildLinker Bot' }
        }
      ]
    });
    return;
  }
});

// Partnership posting interval (in ms)
let postIntervalMs = 60 * 60 * 1000; // 1 hour by default
let lastPosted = {};
let lastPostTime = null;
let intervalStarted = false;

// Track previous partnerships to avoid repeats
let previousPairs = new Set();

client.once('ready', () => {
  if (!intervalStarted) {
    postPartnerships(); // Post immediately on startup
    setInterval(postPartnerships, postIntervalMs);
    intervalStarted = true;
  }
});

async function postPartnerships() {
  lastPostTime = Date.now();
  // Fetch all registered servers from Supabase
  const { data: allServers, error } = await supabase.from('partnerships').select('*');
  if (error || !allServers) {
    console.error('Failed to fetch partnerships:', error);
    return;
  }
  // Filter servers with a channel set
  const eligibleServers = allServers.filter(s => s.channel);
  const paired = new Set();
  const newPairs = new Set();
  for (let i = 0; i < eligibleServers.length; i++) {
    const serverA = eligibleServers[i];
    if (paired.has(serverA.guild_id)) continue;
    // Find a partner for serverA that hasn't been paired with it before, if possible
    let partner = eligibleServers.find((s, j) =>
      i !== j &&
      !paired.has(s.guild_id) &&
      (
        s.category === serverA.category ||
        (s.subcategories && serverA.subcategories && s.subcategories.some(sub => serverA.subcategories.includes(sub)))
      ) &&
      !previousPairs.has([serverA.guild_id, s.guild_id].sort().join('-'))
    );
    // If all have been paired before, fallback to any eligible partner
    if (!partner) {
      partner = eligibleServers.find((s, j) =>
        i !== j &&
        !paired.has(s.guild_id) &&
        (
          s.category === serverA.category ||
          (s.subcategories && serverA.subcategories && s.subcategories.some(sub => serverA.subcategories.includes(sub)))
        )
      );
    }
    if (!partner) continue;
    // Mark both as paired
    paired.add(serverA.guild_id);
    paired.add(partner.guild_id);
    // Track this pair for next time
    newPairs.add([serverA.guild_id, partner.guild_id].sort().join('-'));
    // Fetch member counts and icons
    let serverAIcon = serverA.icon_url;
    let serverAMemberCount = null;
    let partnerIcon = partner.icon_url;
    let partnerMemberCount = null;
    try {
      const guildA = await client.guilds.fetch(serverA.guild_id);
      serverAIcon = guildA.iconURL({ dynamic: true, size: 256 }) || serverA.icon_url;
      serverAMemberCount = guildA.memberCount;
      await supabase.from('partnerships').update({ icon_url: serverAIcon, server_name: guildA.name }).eq('guild_id', serverA.guild_id);
    } catch {}
    try {
      const guildB = await client.guilds.fetch(partner.guild_id);
      partnerIcon = guildB.iconURL({ dynamic: true, size: 256 }) || partner.icon_url;
      partnerMemberCount = guildB.memberCount;
      await supabase.from('partnerships').update({ icon_url: partnerIcon, server_name: guildB.name }).eq('guild_id', partner.guild_id);
    } catch {}
    // Compose embeds
    const botInviteLink = '(https://discord.com/oauth2/authorize?client_id=1376795987116298251&permissions=2147601472&integration_type=0&scope=bot)';
    const embedA = {
      title: `🌟 ${partner.server_name || 'Partner Server'} 🌟`,
      description:
        `━━━━━━━━━━━━━━━━━━\n` +
        `**📝 Description:**\n${partner.description}\n\n` +
        `🔗 **Invite:** [Join Here](${partner.invite_link})\n\n` +
        `🏷️ **Category:** \n${partner.category}\n\n` +
        `🏷️ **Subcategories:** \n${(partner.subcategories || []).join(', ') || 'None'}\n\n` +
        (partnerMemberCount !== null ? `👥 **Members:** ${partnerMemberCount}\n\n` : '') +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${botInviteLink}` ,
      thumbnail: partnerIcon ? { url: partnerIcon } : undefined,
      color: 0x6a5acd,
      footer: { text: '🤝 Partnership Opportunity' }
    };
    const embedB = {
      title: `🌟 ${serverA.server_name || 'Partner Server'} 🌟`,
      description:
        `━━━━━━━━━━━━━━━━━━\n` +
        `**📝 Description:**\n${serverA.description}\n\n` +
        `🔗 **Invite:** [Join Here](${serverA.invite_link})\n\n` +
        `🏷️ **Category:** \n${serverA.category}\n\n` +
        `🏷️ **Subcategories:** \n${(serverA.subcategories || []).join(', ') || 'None'}\n\n` +
        (serverAMemberCount !== null ? `👥 **Members:** ${serverAMemberCount}\n\n` : '') +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${botInviteLink}` ,
      thumbnail: serverAIcon ? { url: serverAIcon } : undefined,
      color: 0x6a5acd,
      footer: { text: '🤝 Partnership Opportunity' }
    };
    // Post in both servers
    try {
      const guildA = await client.guilds.fetch(serverA.guild_id);
      const channelA = await guildA.channels.fetch(serverA.channel);
      if (channelA && channelA.isTextBased()) {
        await channelA.send({ content: '🤝 **Partnership Opportunity!**', embeds: [embedA] });
      }
    } catch (err) {
      console.error(`Failed to post partnership in ${serverA.guild_id}:`, err);
    }
    try {
      const guildB = await client.guilds.fetch(partner.guild_id);
      const channelB = await guildB.channels.fetch(partner.channel);
      if (channelB && channelB.isTextBased()) {
        await channelB.send({ content: '🤝 **Partnership Opportunity!**', embeds: [embedB] });
      }
    } catch (err) {
      console.error(`Failed to post partnership in ${partner.guild_id}:`, err);
    }
  }
  // Update previousPairs for next cycle
  previousPairs = newPairs;
}

client.login(process.env.DISCORD_TOKEN);
