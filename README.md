# Discord Partnership Bot

A Discord bot that facilitates server partnerships by automatically sharing promotional messages between participating servers.

## Features

- **Server Registration**: Servers can register with a description and invite link
- **Designated Channels**: Each server can set a specific channel for partnership posts
- **Automated Posting**: Bot posts partnership messages at regular intervals (default: 1 hour)
- **Duplicate Prevention**: Avoids posting the same server twice in a row
- **Server Info**: View your server's partnership information
- **Category System**: Servers are matched with others in the same category
- **Subcategories**: Detailed server classification with multiple subcategories

## Commands

- `/register [description] [invite_link] [category] [category1] [category2] [category3]` - Register your server for partnerships with a main category and subcategories (at least one subcategory is required)
- `/setchannel [channel]` - Set the channel where partnerships will be posted
- `/unregister` - Remove your server from the partnership program
- `/info` - View your server's partnership information
- `/help` - Show all available commands and their descriptions
- `/setinterval [value] [unit]` - (Bot admin only) Set the interval between partnership posts (unit can be minutes or hours)
- `/test [channel]` - (Bot admin only) Test the partnership message in a specified channel
- `/forcepost` - (Bot admin only) Manually trigger partnership posting in all channels

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a `.env` file with your bot token:
   ```env
   DISCORD_TOKEN=YOUR_BOT_TOKEN
   ```
3. Start the bot:
   ```sh
   npm start
   ```

## Notes
- Make sure your bot is invited to your server with the `applications.commands` and `bot` scopes.
