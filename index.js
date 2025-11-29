const express = require("express");
const { Telegraf, Markup } = require("telegraf");

// Bot token — BotFather’dan olingan tokenni ENV orqali olish
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_CHAT_ID = -1003113473319;

// User data saqlash uchun ob'ekt
const userData = {};
const showNewRequest = {}; // foydalanuvchi “Yangi murojaat” tugmasini ko'rsatish flagi

// ---------------- BOT LOGIKASI ----------------

// /start komandasi
bot.start((ctx) => {
  const userId = ctx.from.id;
  userData[userId] = {}; // eski ma'lumotlarni tozalaymiz

  // Birinchi marta start bosganda Yangi murojaat tugmasi ko'rinmaydi
  const buttons = [["✳️ Taklif", "❗️ Shikoyat", "💬 Fikr"]];
  if (showNewRequest[userId]) {
    buttons.push(["🆕 Yangi murojaat"]);
  }

  ctx.reply(
    "Assalomu alaykum! 👋\n\n" +
      "Siz ZIN-NUR Academy murojaatlar botidasiz.\n\n" +
      "Bu bot orqali siz:\n" +
      "• Taklif ✳️\n" +
      "• Shikoyat ❗️\n" +
      "• Fikr va mulohazalaringizni yuborishingiz mumkin 💬\n\n" +
      "Ismingizni yozishingiz yoki anonim xabar qoldirishingiz mumkin.\n\n" +
      "Boshlash uchun pastdagi tugmalardan birini tanlang:",
    Markup.keyboard(buttons).oneTime().resize()
  );
});

// Yangi murojaat tugmasi
bot.hears("🆕 Yangi murojaat", (ctx) => {
  const userId = ctx.from.id;
  userData[userId] = {}; // yangi murojaat boshlash uchun ma'lumotlarni tozalaymiz
  return bot.start(ctx); // start logikasini chaqiramiz
});

// Murojaat turini tanlash
bot.hears(["✳️ Taklif", "❗️ Shikoyat", "💬 Fikr"], (ctx) => {
  const userId = ctx.from.id;
  userData[userId] = { category: ctx.message.text };

  ctx.reply(
    "Qaysi filialga yo'naltiraylik? Iltimos tanlang:",
    Markup.keyboard([["🏢 Uchtepa", "🏢 Sergeli"]])
      .oneTime()
      .resize()
  );
});

// Filial tanlash
bot.hears(["🏢 Uchtepa", "🏢 Sergeli"], (ctx) => {
  const userId = ctx.from.id;
  if (!userData[userId]) userData[userId] = {};
  userData[userId].branch = ctx.message.text;

  ctx.reply(
    "Ismingizni yozing yoki anonim qolish uchun /skip bosing",
    Markup.keyboard([["/skip"]])
      .oneTime()
      .resize()
  );
});

// Text xabarlar
bot.on("text", (ctx) => {
  const userId = ctx.from.id;

  if (!userData[userId] || !userData[userId].category) return;

  // Ism
  if (!userData[userId].fullName) {
    if (ctx.message.text.toLowerCase() === "/skip") {
      userData[userId].fullName = "Anonim";
    } else {
      userData[userId].fullName = ctx.message.text;
    }

    ctx.reply(
      "Bu murojaat qaysi bo'lim uchun? Iltimos, tanlang",
      Markup.keyboard([["🏢 Ma’muriyat", "📚 O‘quv bo‘limi"]])
        .oneTime()
        .resize()
    );
    return;
  }

  // Bo‘lim
  if (!userData[userId].department) {
    if (
      ctx.message.text === "🏢 Ma’muriyat" ||
      ctx.message.text === "📚 O‘quv bo‘limi"
    ) {
      userData[userId].department = ctx.message.text;
      ctx.reply(
        "Endi murojaatingiz matnini yozib yuboring:",
        Markup.removeKeyboard()
      );
    } else {
      ctx.reply("Iltimos, faqat pastdagi tugmalardan tanlang.");
    }
    return;
  }

  // Xabar matni
  if (!userData[userId].messageText) {
    userData[userId].messageText = ctx.message.text;
    ctx.reply(
      "Agar istasangiz, o‘qiyotgan guruh nomingizni yozing (masalan: A1-8:00) yoki /skip bosing.\n\n" +
        "Bu murojaatingiz tez ko'rib chiqlishiga yordam beradi.",
      Markup.keyboard([["/skip"]])
        .oneTime()
        .resize()
    );
    return;
  }

  // Guruh
  if (!userData[userId].group) {
    if (ctx.message.text.toLowerCase() === "/skip") {
      userData[userId].group = "Ko‘rsatilmagan";
    } else {
      userData[userId].group = ctx.message.text;
    }

    // Yakuniy tasdiq
    const data = userData[userId];
    ctx.reply(
      `✅ Murojaatingiz tayyor!\n\n` +
        `Filial: ${data.branch}\n` +
        `Turi: ${data.category}\n` +
        `Ism: ${data.fullName}\n` +
        `Bo‘lim: ${data.department}\n` +
        `Guruh: ${data.group}\n` +
        `Xabar: ${data.messageText}\n\n` +
        `Murojaatingizni yuboraylikmi?`,
      Markup.keyboard([["✅ Ha, yuboring", "❌ Bekor qilish"]])
        .oneTime()
        .resize()
    );
    return;
  }

  // Tasdiqlash
  if (ctx.message.text === "✅ Ha, yuboring") {
    const data = userData[userId];

    ctx.reply(
      "Rahmat! Murojaatingiz qabul qilindi. Tez orada ijobiy hal qilamiz. 😊",
      Markup.removeKeyboard()
    );

    bot.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `📩 Yangi murojaat!\n\n` +
        `Filial: ${data.branch}\n` +
        `Turi: ${data.category}\n` +
        `Ism: ${data.fullName}\n` +
        `Qaysi Bo‘limga: ${data.department}\n` +
        `O'quvchi Guruhi: ${data.group}\n` +
        `Xabar: ${data.messageText}`
    );

    // Murojaat tugagach, userData’ni tozalaymiz va Yangi murojaat tugmasini ko‘rsatamiz
    delete userData[userId];
    showNewRequest[userId] = true;
    return;
  }

  if (ctx.message.text === "❌ Bekor qilish") {
    ctx.reply("Murojaatingiz bekor qilindi.", Markup.removeKeyboard());
    delete userData[userId];
    showNewRequest[userId] = true; // Bekor qilinsa ham Yangi murojaat tugmasi chiqadi
    return;
  }
});

// ---------------- EXPRESS SERVER ----------------
const app = express();
app.use(express.json());

// Webhook endpoint
app.post("/webhook", (req, res) => {
  // Telegramga 200 OK darhol jo'natamiz
  res.sendStatus(200);

  // Bot update’ni async tarzda handle qilamiz
  bot.handleUpdate(req.body).catch((err) => {
    console.error("Update error:", err);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
