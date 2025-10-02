const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "mj",
  KJ: ["mj"],
  Auth: 0,
  Class: "ai",
  Info: "imagine",
  Owner: "Hina"
};

module.exports.onType = async ({args, sh}) => {
  const prompt = args.join(" ");
  if (!prompt) return sh.reply("Please enter the text to create the image");
  try {
    sh.reply("⚙️ | Creating...");
    // ✅ New API with usePolling=true
    const res = await axios.get(
      "https://dev.oculux.xyz/api/mj-proxy-pub?prompt=" + encodeURIComponent(prompt) + "&usePolling=false"
    );
    // ✅ Processing the result
    const imgs = res.data.results || res.data;
    if (!imgs || !Array.isArray(imgs)) {
      return sh.reply("⚠️ | Images not found in response:\n" + JSON.stringify(res.data));
    }
    let attachments = [];
    let filepaths = [];
    for (let img of imgs) {
      const filename = Math.floor(Math.random() * 100000) + ".png";
      const filepath = __dirname + "/cache/" + filename;
      const response = await axios.get(img, { responseType: "stream" });
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
      attachments.push(fs.createReadStream(filepath));
      filepaths.push(filepath);
    }
    await sh.reply({ attachment: attachments });
    for (let fp of filepaths) fs.unlinkSync(fp);
  } catch (e) {
    sh.reply("❌ | An error occurred:\n" + e.toString());
  }
};
