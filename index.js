const { Client, GatewayIntentBits, Partials, PermissionsBitField, ClientUser } = require('discord.js');
const client = new Client({ 
  intents: [GatewayIntentBits.GuildVoiceStates,GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent]
  ,restTimeOffset: 50
  ,partials: [Partials.Channel] });
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { ActionRowBuilder, MessageActionRow, ButtonBuilder, ButtonStyle, InteractionType, ActivityType } = require('discord.js');
const { entersState, AudioPlayerStatus, getVoiceConnection, createAudioPlayer, createAudioResource, joinVoiceChannel,  StreamType, NoSubscriberBehavior } = require('@discordjs/voice');

const ytdl = require('ytdl-core');
const axios = require('axios');
const fs = require('fs');
const async = require('async');

client.on('ready', () => {
  console.log(`+ = = = = = = = = = = = = = = = = = = +`)
  console.log(`${client.user.tag} is online!`)
  console.log(`${client.user.tag} Version.1.0.0`)
  console.log(`Discord.js@v14`)
  console.log(`+ = = = = = = = = = = = = = = = = = = +`)
  client.user.setPresence({ activities: [{ name: `Online!`, type: ActivityType.PLAYING }],
  status: 'online'});
});

client.login(process.env.TOKEN);
