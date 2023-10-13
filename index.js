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

const ver = "0.0.4"
const stm = "取得中"

client.on('ready', () => {
  console.log(`+ = = = = = = = = = = = = = = = = = = +`)
  console.log(`${client.user.tag} is online!`)
  console.log(`${client.user.tag} Version.${ver}`)
  console.log(`Discord.js@v14`)
  console.log(`+ = = = = = = = = = = = = = = = = = = +`)
  client.user.setPresence({ activities: [{ name: `動作:${stm} | Ver.${ver}`, type: ActivityType.PLAYING }],
  status: 'online'});
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

client.on('ready', () => {
  setInterval(() => {
    const pi = client.ws.ping;
    let ping
    if(pi < 130) {
      ping = "快適"
    } else if(pi < 230) {
      ping = "普通"
    } else if(pi > 230) {
      ping = "遅い"
    }
    client.user.setPresence({ activities: [{ name: `動作:${ping} | Ver.${ver}`, type: ActivityType.PLAYING }],
    status: 'online'});
  }, 10 * 1000)
  // 1000をかけて秒に変換
});

client.on('messageCreate', async message => {
  if(message.content === "!m join") {
    if(message.author.bot) return;
    try {
        // コマンドを実行したメンバーがいるボイスチャンネルを取得
        const channel = message.member.voice.channel;
        // コマンドを実行したメンバーがボイスチャンネルに入ってなければ処理を止める
        if (!channel) return message.reply('先にVCに参加してください！');
        const connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
          selfDeaf: true,
        });

    message.reply("VCに参加しました！")
  } catch (error) {
    message.channel.send("エラーが発生しました。\n" + error)
  }
  }
})

let nowplaying = false;
const qjson = {"loop": false, "q":[]};
let volumeset = false;
let volumenum;

client.on('messageCreate', async message => {
  if(message.content === "!m leave") {
  if(message.author.bot) return;
  let contf = getVoiceConnection(message.guild.id);
  if(contf === undefined) return message.reply('VCに参加していません。\n※VCで音楽再生中にbotが落ちても一定時間はbotがVCに残っているように見える場合があります。');
    try {
    nowplaying = false;
    const connection = getVoiceConnection(message.guild.id);
    connection.destroy();
    message.reply("切断リクエストを送信しました。\n※切断されていない場合は管理者権限で切断させてください。")
  } catch (error) {
    message.channel.send("エラーが発生しました。\n" + error)
  }
  }
});

client.on('messageCreate', async message => {
  if(message.content === "!m skip") {
  if(message.author.bot) return;
    message.reply("スキップしています...")
    nowplaying = false;
  }
});

client.on('messageCreate', async message => {
  if(message.content.startsWith("!m volume")) {
  if(message.author.bot) return;
    message.reply("ボリュームを設定しています...");
    try {
      const v = Number(message.content.split(" ")[2]);
      volumeset = true;
      volumenum = v;
    } catch (error) {
      message.reply("エラーが発生しました。") 
    }
  }
});

client.on('messageCreate', async message => {
  if(message.content === "!m reload") {
  if(message.author.bot) return;
    message.reply("リロード中です...")
    await client.destroy;
    process.exit(0);
  }
});

client.on('messageCreate', async message => {
  if(message.content === "!m status") {
  if(message.author.bot) return;
    message.reply("Status:" + nowplaying)
  }
});

client.on('messageCreate', async message => {
  if(message.content === "!m loop") {
  if(message.author.bot) return;
    message.reply("ループを有効にしました。")
    qjson.loop = true;
    console.log(qjson)
  }
});

client.on('messageCreate', async message => {
  if(message.content === "!m unloop") {
  if(message.author.bot) return;
    message.reply("ループを無効にしました。")
    qjson.loop = false;
    console.log(qjson)
  }
});

function delay(n){
  return new Promise(function(resolve){
      setTimeout(resolve,n*1000);
  });
}

async function plnow(player) {
  await entersState(player, AudioPlayerStatus.Playing, 5 * 1000);
  await entersState(player, AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);

  nowplaying = false;
}

async function vcqadd(message,url) {
  vcq.push(async () => {
    const contf = getVoiceConnection(message.guild.id);
    if (contf === undefined) return message.channel.send("再生を終了しました。");
    const connection = getVoiceConnection(message.guild.id);

    const player = createAudioPlayer();

    const stream = ytdl(ytdl.getURLVideoID(url), {
      filter: format => format.audioCodec === 'opus' && format.container === 'webm', //webm opus
      quality: 'highest',
      highWaterMark: 32 * 1024 * 1024,
    });

    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
    });

    resource.volume.setVolume(0.25); // 25%まで減少

    let desloop;

    if(qjson.loop === true) {
      desloop = "ループ: 有効"
    } else {
      desloop = "ループ: 無効"
    }

    message.channel.send("再生します...\n" + desloop);

    player.play(resource);

    connection.subscribe(player);

    plnow(player);
    
    nowplaying = true;

    for (let i = 1; i <= 2; i){
      await delay(3)
      if(volumeset === true) {
        try {
          volumeset = false;
          resource.volume.setVolume(volumenum);
        } catch (error) {
          message.channel.send("ボリュームの調整ができませんでした。")
        }
      }
      if(nowplaying === false) {
        i = 4;
      }
    }

    player.stop()

    if(qjson.loop === true) {
      qjson.q.push({
        "url": url,
      });

      vcqadd(message,url)
    }

    qjson.q.splice(0, 1);

    message.channel.send("再生が終了しました。")
  });
}

client.on('messageCreate', async message => {
  if (message.content.startsWith('!myt ')) {
    if (message.author.bot) return;
    const contf = getVoiceConnection(message.guild.id);
    if (contf === undefined) {
      const channel = message.member.voice.channel;
      if (!channel) return message.reply('先にVCに参加してください！');
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });
    }
    try {
      let url = message.content.split(' ')[1];
      console.log(url)
      if (url.match("/live/")) {
        // https://www.youtube.com/live/zbGWiLlCcX4?feature=share

        const rep = url.replace(/https?:\/\//g, ""); // 「https://」 の部分を削除

        // www.youtube.com/live/zbGWiLlCcX4?feature=share

        const a = rep.split("/");
        url = "https://www.youtube.com/watch?v=" + a[2];
      }

      if (!ytdl.validateURL(url)) return message.reply(`${url} は処理することができませんでした。`);

      message.reply("読み込みに成功しました。\n※キューに追加されました。");

      qjson.q.push({
        "url": url
      });

      vcqadd(message,url);

    } catch (error) {
      message.channel.send("エラーが発生しました。\n" + error);
    }
  }
});

client.on('messageCreate', async message => {
  if (message.content.startsWith('!mytasmr ')) {
    if (message.author.bot) return;
    const contf = getVoiceConnection(message.guild.id);
    if (contf === undefined) {
      const channel = message.member.voice.channel;
      if (!channel) return message.reply('先にVCに参加してください！');
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });
    }
    try {
      let url = message.content.split(' ')[1];
      console.log(url)
      if (url.match("/live/")) {
        // https://www.youtube.com/live/zbGWiLlCcX4?feature=share

        const rep = url.replace(/https?:\/\//g, ""); // 「https://」 の部分を削除

        // www.youtube.com/live/zbGWiLlCcX4?feature=share

        const a = rep.split("/");
        url = "https://www.youtube.com/watch?v=" + a[2];
      }

      if (!ytdl.validateURL(url)) return message.reply(`${url} は処理することができませんでした。`);

      message.reply("読み込みに成功しました。\n※キューに追加されました。");

      qjson.q.push({
        "url": url
      });

      vcq.push(async () => {
        const contf = getVoiceConnection(message.guild.id);
        if (contf === undefined) return message.channel.send("再生を終了しました。");
        const connection = getVoiceConnection(message.guild.id);

        const player = createAudioPlayer();

        const stream = ytdl(ytdl.getURLVideoID(url), {
          filter: format => format.audioCodec === 'opus' && format.container === 'webm', //webm opus
          quality: 'highest',
          highWaterMark: 32 * 1024 * 1024,
        });

        const resource = createAudioResource(stream, {
          inputType: StreamType.Arbitrary,
          inlineVolume: true,
        });

        resource.volume.setVolume(1.2); // 120%まで増加

        let desloop;

        if(qjson.loop === true) {
          desloop = "ループ: 有効"
        } else {
          desloop = "ループ: 無効"
        }

        message.channel.send("再生します...\n" + desloop);

        player.play(resource);

        connection.subscribe(player);

        plnow(player);
        
        nowplaying = true;

        for (let i = 1; i <= 2; i){
          await delay(3)
          if(nowplaying === false) {
            i = 4;
          }
        }

        player.stop()

        if(qjson.loop === true) {
          qjson.q.push({
            "url": url,
          });

          vcq.push(async () => {
            const contf = getVoiceConnection(message.guild.id);
            if (contf === undefined) return message.channel.send("再生を終了しました。");
            const connection = getVoiceConnection(message.guild.id);
    
            const player = createAudioPlayer();
    
            const stream = ytdl(ytdl.getURLVideoID(url), {
              filter: format => format.audioCodec === 'opus' && format.container === 'webm', //webm opus
              quality: 'highest',
              highWaterMark: 32 * 1024 * 1024,
            });
    
            const resource = createAudioResource(stream, {
              inputType: StreamType.Arbitrary,
              inlineVolume: true,
            });
    
            resource.volume.setVolume(1.2); // 25%まで減少
    
            let desloop;
    
            if(qjson.loop === true) {
              desloop = "ループ: 有効"
            } else {
              desloop = "ループ: 無効"
            }
    
            message.channel.send("再生します...\n" + desloop);
    
            player.play(resource);
    
            connection.subscribe(player);
    
            plnow(player);
            
            nowplaying = true;
    
            for (let i = 1; i <= 2; i){
              await delay(3)
              if(nowplaying === false) {
                i = 4;
              }
            }
    
            player.stop()
    
            if(qjson.loop === true) {
              qjson.q.push({
                "url": url,
              });
            }
    
            qjson.q.splice(0, 1);
    
            message.channel.send("再生が終了しました。")
          });
        }

        qjson.q.splice(0, 1);

        message.channel.send("再生が終了しました。")
      });
    } catch (error) {
      message.channel.send("エラーが発生しました。\n" + error);
    }
  }
});

client.login(process.env.TOKEN);
