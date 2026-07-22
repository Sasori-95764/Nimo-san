const axios = require("axios");
const https = require("https");

// DNS resolution via Google DoH (avoids requiring the built-in "dns" module
// which the command auto-installer would mistakenly try to npm-install)
async function resolveIP(domain) {
  try {
    const res = await axios.get(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, { timeout: 8000 });
    return res.data?.Answer?.[0]?.data || "N/A";
  } catch {
    return "N/A";
  }
}

module.exports = {
  config: {
    name:             "webinfo",
    version:          "2.1",
    author:           "MOHAMMAD AKASH",
    countDown:        5,
    role:             0,
    shortDescription: "معلومات تفصيلية عن أي موقع",
    longDescription:  "احصل على IP والـ SSL والسيرفر ووقت الاستجابة والدولة لأي موقع",
    category:         "tools",
    guide:            "{pn} <رابط الموقع>\nمثال: {pn} google.com"
  },

  langs: {
    ar: {
      missing:  "⚠️ أدخل رابط موقع\n📌 مثال: webinfo google.com",
      loading:  "🔍 جارٍ تحليل الموقع...\n🌐 %1",
      error:    "❌ فشل جلب معلومات الموقع"
    },
    en: {
      missing:  "⚠️ Please provide a valid URL\n📌 Eg: webinfo google.com",
      loading:  "🔍 Analysing website...\n🌐 %1",
      error:    "❌ Failed to fetch web info"
    }
  },

  onStart: async function ({ message, args, getLang }) {
    if (!args[0]) return message.reply(getLang("missing"));

    let input = args[0].trim().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    const domain = input;
    const url    = `https://${domain}`;

    await message.reply(getLang("loading", domain));

    try {
      // IP (via Google DNS-over-HTTPS)
      const ip = await resolveIP(domain);

      // SSL
      let ssl = "🔴 غير محمي";
      try {
        await new Promise(resolve => {
          const req = https.request({ host: domain, method: "HEAD", port: 443 }, () => {
            ssl = "🟢 محمي (SSL)";
            resolve();
          });
          req.on("error", () => resolve());
          req.setTimeout(5000, () => { req.destroy(); resolve(); });
          req.end();
        });
      } catch {}

      // Response time & server
      let responseTime = "N/A";
      let server       = "غير معروف";
      try {
        const start = Date.now();
        const res   = await axios.get(url, { timeout: 10000 });
        responseTime = Date.now() - start;
        server       = res.headers["server"] || "غير معروف";
      } catch {}

      // Country
      let country = "N/A";
      try {
        const geo = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 8000 });
        country = geo.data.country_name || "N/A";
      } catch {}

      message.reply(
`🌐 معلومات الموقع
━━━━━━━━━━━━━━━
🔗 الدومين   : ${domain}
📍 الـ IP    : ${ip}
🛡️ الأمان   : ${ssl}
⚡ الاستجابة : ${responseTime} ms
🧠 السيرفر  : ${server}
🌍 الدولة   : ${country}`
      );
    } catch (err) {
      console.error("[webinfo]", err.message);
      message.reply(getLang("error"));
    }
  }
};
