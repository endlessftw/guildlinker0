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
    name: 'setinterval',
    description: 'Set the interval between partnership posts (admin only)',
    options: [
      { name: 'value', type: 4, description: 'Interval value', required: true },
      { name: 'unit', type: 3, description: 'minutes or hours', required: true }
    ]
  },
  {
    name: 'test',
    description: 'Test the partnership message in a channel (admin only)',
    options: [
      { name: 'channel', type: 7, description: 'Channel', required: true }
    ]
  },
  {
    name: 'forcepost',
    description: 'Manually trigger partnership posting (admin only)'
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
          '🛠️ **/setinterval** — Set the interval between partnership posts (admin only)\n' +
          '   ┗ _/setinterval [value] [unit]_\n' +
          '\n' +
          '🧪 **/test** — Test the partnership message in a channel (admin only)\n' +
          '   ┗ _/test [channel]_\n' +
          '\n' +
          '🚀 **/forcepost** — Manually trigger partnership posting (admin only)\n' +
          '\n' +          '🛑 **/shutdown** — Shut down the bot (bot owner only)\n' +
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

  if (["setinterval", "test", "forcepost"].includes(commandName)) {
    await interaction.reply({
      ephemeral: true,
      embeds: [{
        color: 0xffd700,
        title: '⚠️ Not Implemented',
        description: 'This command is not implemented yet. Stay tuned for updates!',
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
  for (const server of allServers) {
    if (!server.channel) continue;
    // Find potential partners (not self, same category or subcategory, have channel)
    const partners = allServers.filter(s =>
      s.guild_id !== server.guild_id &&
      s.channel &&
      (
        s.category === server.category ||
        (s.subcategories && server.subcategories && s.subcategories.some(sub => server.subcategories.includes(sub)))
      )
    );
    if (partners.length === 0) continue;
    // Avoid posting the same partner twice in a row
    let partner = partners[Math.floor(Math.random() * partners.length)];
    if (lastPosted[server.guild_id] && partners.length > 1) {
      let tries = 0;
      while (partner.guild_id === lastPosted[server.guild_id] && tries < 5) {
        partner = partners[Math.floor(Math.random() * partners.length)];
        tries++;
      }
    }
    lastPosted[server.guild_id] = partner.guild_id;
    // Fetch latest icon URL for partner
    let partnerIcon = partner.icon_url;
    let memberCount = null;
    try {
      const partnerGuild = await client.guilds.fetch(partner.guild_id);
      partnerIcon = partnerGuild.iconURL({ dynamic: true, size: 256 }) || partner.icon_url;
      memberCount = partnerGuild.memberCount;
      // Update icon_url in Supabase
      await supabase.from('partnerships').update({ icon_url: partnerIcon, server_name: partnerGuild.name }).eq('guild_id', partner.guild_id);
    } catch {}
    // Compose partnership embed
    const embed = {
      title: `🌟 ${partner.server_name || 'Partner Server'} 🌟`,
      description:
        `━━━━━━━━━━━━━━━━━━\n` +
        `**📝 Description:**\n${partner.description}\n\n` +
        `🔗 **Invite:** [Join Here](${partner.invite_link})\n\n` +
        `🏷️ **Category:** \n${partner.category}\n\n` +
        `🏷️ **Subcategories:** \n${(partner.subcategories || []).join(', ') || 'None'}\n\n` +
        (memberCount !== null ? `👥 **Members:** ${memberCount}\n\n` : '') +
        `━━━━━━━━━━━━━━━━━━` ,
      thumbnail: partnerIcon ? { url: partnerIcon } : undefined,
      color: 0x6a5acd,
      footer: { text: '🤝 Partnership Opportunity' }
    };
    try {
      const guild = await client.guilds.fetch(server.guild_id);
      const channel = await guild.channels.fetch(server.channel);
      if (channel && channel.isTextBased()) {
        await channel.send({ content: '🤝 **Partnership Opportunity!**', embeds: [embed] });
      }
    } catch (err) {
      console.error(`Failed to post partnership in ${server.guild_id}:`, err);
    }
  }
}

client.login(process.env.DISCORD_TOKEN);
