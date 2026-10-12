import express from "express";
import axios from "axios";
import cron from "node-cron";
import cors from "cors";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = TELEGRAM_BOT_TOKEN ? new Telegraf(TELEGRAM_BOT_TOKEN) : null;
if (bot) bot.launch().then(()=>console.log("Bot started")).catch(e=>console.log("Bot error", e.message));

async function sendTelegram(msg){
  if(!bot || !TELEGRAM_CHAT_ID) return;
  try{ await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, msg, {parse_mode:"HTML"}); }catch(e){ console.log("TG send error", e.message); }
}

app.get("/", (req,res)=> res.send("NEXUS APEX Backend Running"));
app.get("/api/test", async (req,res)=>{
  try{
    if(!ODDS_API_KEY) return res.json({error:"ODDS_API_KEY missing"});
    const r = await axios.get(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`);
    res.json({count:r.data.length});
    sendTelegram(`✅ Backend calisiyor! ${r.data.length} mac cekildi.`);
  }catch(e){ res.status(500).json({error:e.message}); }
});

cron.schedule("*/5 * * * *", ()=>{ console.log("Cron check", new Date().toISOString()); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server on ${PORT}`));
