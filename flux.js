const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function getSafeUsername(api, userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    return (userInfo[userID]?.name || "user").replace(/[^a-zA-Z0-9]/g, "_");
  } catch {
    return "user";
  }
}

module.exports = {
  config: {
    name: "fluxpro",
    aliases: ["fluxai", "fluxp"],
    version: "1.0",
    author: "Farhan",
    countDown: 10,
    role: 0,
    shortDescription: "Generate images with Flux 1.1 Pro Ultra",
    longDescription: "Create high-quality AI images using Flux 1.1 Pro Ultra model with optional seed support.",
    category: "image",
    guide: "{pn} <prompt> [seed=123]\nExample: {pn} cyberpunk samurai in neon city seed=42"
  },

  onStart: async function ({ api, event, args, message }) {
    const fullInput = args.join(" ").trim();
    if (!fullInput) {
      return message.reply("⚠️ Please provide a prompt.\nExample: flux anime girl with neon sword seed=789");
    }

    // Parse prompt and optional seed
    let prompt = fullInput;
    let seed = Math.floor(Math.random() * 1000000); // Default random seed
    const seedMatch = fullInput.match(/seed=(\d+)/i);
    if (seedMatch) {
      seed = parseInt(seedMatch[1], 10);
      prompt = fullInput.replace(/seed=\d+/i, "").trim();
    }

    if (!prompt) {
      return message.reply("❌ Prompt is required.");
    }

    const username = await getSafeUsername(api, event.senderID);
    const waitMsg = await message.reply(`🎨 Generating Flux Ultra image...\n🖌️ Prompt: "${prompt}"\n🌱 Seed: ${seed}\nPlease wait ⏳`);

    try {
      await fs.ensureDir(path.join(__dirname, "cache"));

      const apiURL = `https://dev.oculux.xyz/api/flux-1.1-pro-ultra`;
      const apiRes = await axios.get(apiURL, {
        params: { prompt, seed: seed.toString() },
        timeout: 60000,
        responseType: "arraybuffer"
      });

      const imgPath = path.join(__dirname, `cache/flux_${username}_${seed}.png`);
      await fs.writeFile(imgPath, apiRes.data);

      await message.reply({
        body: `✅ Flux Ultra generated!\nPrompt: ${prompt}\nSeed: ${seed}`,
        attachment: fs.createReadStream(imgPath)
      }, waitMsg.messageID);

      // Auto cleanup after 30s
      setTimeout(() => fs.existsSync(imgPath) && fs.unlinkSync(imgPath), 30000);

    } catch (err) {
      console.error("Flux Ultra Error:", err.message);
      message.reply("❌ Failed to generate Flux image. Try again later.", waitMsg.messageID);
    }
  }
};
