import express from "express"; import axios from "axios"; import cron from "node-cron"; import cors from "cors"; import { Telegraf } from "telegraf"; import dotenv from "dotenv"; dotenv.config();
const app=express(); app.use(cors()); app.use(express.json());
const ODDS_API_KEY=process.env.ODDS_API_KEY; const TELEGRAM_BOT_TOKEN=process.env.TELEGRAM_BOT_TOKEN; const TELEGRAM_CHAT_ID=process.env.TELEGRAM_CHAT_ID;
const bot=TELEGRAM_BOT_TOKEN?new Telegraf(TELEGRAM_BOT_TOKEN):null;
let lastMatches=[];
if(bot){
  bot.start((ctx)=>ctx.reply("✅ NEXUS APEX V4 aktif!\n\nKomutlar:\n/maclar - Günün maçları\n/test - Sistem testi"));
  bot.command("test",async(ctx)=>{
    try{
      const r=await axios.get(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`);
      ctx.reply(`✅ ${r.data.length} maç bulundu. /maclar yaz`);
      lastMatches=r.data;
    }catch(e){ctx.reply("Hata: "+e.message)}
  });
  bot.command("maclar",async(ctx)=>{
    try{
      const r=await axios.get(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`);
      lastMatches=r.data.slice(0,8);
      let msg="🔥 <b>GÜNÜN MAÇLARI</b>\n\n";
      lastMatches.forEach((m,i)=>{
        const home=m.home_team; const away=m.away_team;
        const book=m.bookmakers[0]; const odds=book?.markets[0]?.outcomes;
        msg+=`${i+1}. ${home} vs ${away}\n`;
        if(odds) msg+=`   ${odds[0].name}: ${odds[0].price} | ${odds[1].name}: ${odds[1].price}\n`;
        msg+=`\n`;
      });
      ctx.replyWithHTML(msg);
    }catch(e){ctx.reply("Hata: "+e.message)}
  });
  bot.launch().then(()=>console.log("Bot OK")).catch(e=>console.log(e.message));
}
app.get("/",(req,res)=>res.send("NEXUS APEX V4 Running"));
app.get("/api/matches",async(req,res)=>{
  try{
    const r=await axios.get(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`);
    res.json(r.data);
  }catch(e){res.status(500).json({error:e.message})}
});
cron.schedule("*/15 * * * *",async()=>{
  console.log("Cron",new Date().toISOString());
  if(!bot||!ODDS_API_KEY) return;
  try{
    const r=await axios.get(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`);
    if(r.data.length>0) bot.telegram.sendMessage(TELEGRAM_CHAT_ID,`⚽ Otomatik tarama: ${r.data.length} maç bulundu. /maclar yaz`);
  }catch(e){console.log(e.message)}
});
app.listen(process.env.PORT||8080,()=>console.log("Server 8080"));
