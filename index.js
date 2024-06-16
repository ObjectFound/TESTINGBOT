const { Client, GatewayIntentBits, REST, SlashCommandBuilder, Routes, Activities, ActivityType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const guildId = '1066667894500495390';
const clientId = '1246448334101545030';
const ownerId = '994537793378336808';
const warningThreshold = 3;
const muteDuration = 300000; // 5 minutes

const warnings = {};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Set the bot's activity
  client.user.setActivity({
    name: 'MY SERVER OFCOURSE!',
    type: ActivityType.Playing,
    url: 'https://www.youtube.com/watch?v=uegQ7hsGyJg'
  });
});

const commands = [
  new SlashCommandBuilder()
    .setName('direct-message')
    .setDescription('Sends a direct message to a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to send the message to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true))
,
  new SlashCommandBuilder()
    .setName('delete-messages')
    .setDescription('Deletes a number of messages in a specific channel.')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to delete messages from')
        .setRequired(true)
    )
,
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Sends an announcement in a channel')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Title of the announcement')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description of the announcement')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send the announcement in')
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken('MTI0NjQ0ODMzNDEwMTU0NTAzMA.GxgTY5.RPTxYpbR0aZT0kf7TEMBKD-cCsb1O9fCIpghC0'); // Replace 'YOUR_BOT_TOKEN' with your actual bot token

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Set the route to register guild-specific commands
    const commandsRoute = Routes.applicationGuildCommands(clientId, guildId);

    await rest.put(
      commandsRoute,
      { body: commands },
    );

    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'direct-message') {
    const user = interaction.options.getUser('user');
    const message = interaction.options.getString('message');

    try {
      await user.send(message);
    } catch (error) {
      console.error(error);
    }
  } else if (interaction.commandName === 'delete-messages') {
    const amount = interaction.options.getInteger('amount');
    const channel = interaction.options.getChannel('channel');

    try {
      const messages = await channel.messages.fetch({ limit: amount });
      await channel.bulkDelete(messages);
    } catch (error) {
      console.error(error);
    }
  } else if (interaction.commandName === 'announce') {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const channel = interaction.options.getChannel('channel');

    try {
      await channel.send(`**${title}**\n${description}`);
    } catch (error) {
      console.error(error);
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.id === ownerId) return;

  if (message.mentions.users.has(ownerId)) {
    const user = message.author;
    const guild = message.guild;

    if (!warnings[user.id]) warnings[user.id] = 0;

    warnings[user.id]++;

    if (warnings[user.id] >= warningThreshold) {
      await user.timeout(muteDuration, 'Mentioning the owner too many times');
      warnings[user.id] = 0;
    } else {
      await message.reply(`You have been warned for mentioning the owner. You have ${warningThreshold - warnings[user.id]} warnings left.`);
    }

    // Delete the message after 5 seconds
    setTimeout(() => {
      message.delete();
    }, 5000);

    // Delete the logs after 5 seconds
    setTimeout(() => {
      message.channel.messages.fetch({ limit: 1 }).then((messages) => {
        messages.first().delete();
      });
    }, 5000);
  }
});

client.login('MTI0NjQ0ODMzNDEwMTU0NTAzMA.GxgTY5.RPTxYpbR0aZT0kf7TEMBKD-cCsb1O9fCIpghC0'); // Replace 'YOUR_BOT_TOKEN' with your actual bot token
