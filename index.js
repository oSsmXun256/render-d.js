const { Client, GatewayIntentBits, Partials, PermissionsBitField, ClientUser } = require('discord.js');
const client = new Client({ 
  intents: [GatewayIntentBits.GuildVoiceStates,GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent]
  ,restTimeOffset: 50
  ,partials: [Partials.Channel] });
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { ActionRowBuilder, MessageActionRow, ButtonBuilder, ButtonStyle, InteractionType, ActivityType } = require('discord.js');
const { entersState, AudioPlayerStatus, getVoiceConnection, createAudioPlayer, createAudioResource, joinVoiceChannel,  StreamType, NoSubscriberBehavior } = require('@discordjs/voice');

const axios = require('axios');
const async = require('async');

client.on('ready', () => {
    console.log(`+ = = = = = = = = = = = = = = = = = = +`)
    console.log(`${client.user.tag} is online!`)
    console.log(`${client.user.tag} Version.1.0.0`)
    console.log(`Discord.js@v14`)
    console.log(`+ = = = = = = = = = = = = = = = = = = +`)
    client.user.setPresence({ activities: [{ name: `Ping: 取得中`, type: ActivityType.PLAYING }],
    status: 'online'});
});

client.on('ready', () => {
  setInterval(() => {
    const ping = client.ws.ping;
    client.user.setPresence({ activities: [{ name: `Ping: ${ping}`, type: ActivityType.PLAYING }],
    status: 'online'});
  }, 10 * 1000)
  // 1000をかけて秒に変換
});

const vcq = async.queue(async (task, callback) => {
    try {
      await task();
      callback();
    } catch (error) {
      console.log("エラー : " + error);
      callback(error);
    }
}, 1);

// 追加 join.push()
// 削除 const index = join.indexOf(message.channelId);
//      join.splice(index, 1);

const join = [];

client.on('messageCreate', async message => {
    if(message.content === "!zn join") {
      if(message.author.bot) return;
      try {
        // コマンドを実行したメンバーがいるボイスチャンネルを取得
        const channel = message.member.voice.channel;
        // コマンドを実行したメンバーがボイスチャンネルに入ってなければ処理を止める
        if (!channel) return message.reply('先にボイスチャンネルに参加しろなのだ');
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true,
        });
  
        join.push(message.channelId)
        message.reply("ボイスチャンネルに接続したのだ。\n※このチャンネルのメッセージのみ読み上げるのだ。");
    } catch (error) {
        message.channel.send("エラーが発生したのだ。\n" + error)
    }
    }
});

client.on('messageCreate', async message => {
    if(message.content === "!zn leave") {
    if(message.author.bot) return;
      try {
        const connection = getVoiceConnection(message.guild.id);
        connection.destroy();
        const index = join.indexOf(message.channelId);
        join.splice(index, 1);
        message.reply("切断したのだ。\n※切断されてなかったら管理者権限で切断してほしいのだ。");
    } catch (error) {
        message.channel.send("エラーが発生したのだ。\n" + error)
    }
    }
});

client.on('messageCreate', async message => {
    if(message.content === "!zn reload") {
    if(message.author.bot) return;
      await message.reply("リロードするのだ。")
      await client.destroy;
      process.exit(0);
    }
});

const wait = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
};

// https://api.tts.quest/v3/voicevox/synthesis?text=ああああ&speaker=3

//  ?text=<文字>
//  &speaker=3  <=これずんだもん
const rpc = axios.create({ baseURL: "https://api.tts.quest/v3/voicevox/synthesis/", proxy: false });

async function genAudio(text) {
    const response = await rpc.get("?text=" + encodeURI(text) + "&speaker=3")

    console.log("+ = = = = = = = = = +")
    console.log(response.data)

    for(let i = 0;i <= 1; i) {
        const status_json = await axios.get(response.data.audioStatusUrl)

        console.log(status_json.data)

        if(status_json.data.isAudioReady) {
            i = 2;
        } else {
            await wait()
        }
    }

    return response.data.mp3DownloadUrl;
}

client.on('messageCreate', async message => {
    if (message.content.startsWith('!') || !message.guild) return;
    if (message.author.bot) return;
    if (join.includes(message.channelId)) {
      console.log("メッセージ読み上げ処理を開始します。")
      console.log("+ = = = = = = = = = +")
      console.log(message.content);
      console.log("+ = = = = = = = = = +")
      try {
        vcq.push(async () => {
          let noTagStr = message.content.replace(/<[^>]+>/g, '');
          noTagStr = noTagStr.replace(/\|\|.*?\|\|/g, 'スポイラー');
          console.log(noTagStr)
          const mp3_url = await genAudio(noTagStr);
  
          const connection = getVoiceConnection(message.guild.id);
  
          const player = createAudioPlayer();
  
          const resource = createAudioResource(mp3_url, {
            inputType: StreamType.Arbitrary,
          });
  
          player.play(resource);
  
          connection.subscribe(player);
  
          await entersState(player, AudioPlayerStatus.Playing, 10 * 1000);
          await entersState(player, AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);
        });
      } catch (error) {
        console.log("エラー : " + error);
        return;
      }
    }
});

client.login(process.env.TOKEN);
