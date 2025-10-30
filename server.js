const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");
const app = express();
app.use(cors());

const TARGET = "https://www.kitco.com/charts/gold"; // página objetivo

// función para intentar extraer Bid desde el HTML con cheerio
function extraerBid(html) {
  const $ = cheerio.load(html);
  // Intentos: buscar texto que diga "Bid" cercano a número
  // 1) buscar elementos que contengan la palabra Bid
  let text = $.root().text();
  let m = text.match(/Bid\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)/i);
  if (m && m[1]) {
    return parseFloat(m[1].replace(/,/g, ""));
  }

  // 2) búsqueda más específica: buscar "BIT" cercano a "Bid"
  let htmlText = $.html();
  let near = htmlText.match(/BIT[\s\S]{0,200}?Bid[\s\S]{0,40}?([0-9\.,]+)/i);
  if (near && near[1]) {
    return parseFloat(near[1].replace(/,/g, ""));
  }

  return null;
}

app.get("/getbid", async (req, res) => {
  try {
    const r = await fetch(TARGET, { timeout: 10000 });
    const txt = await r.text();

    const bid = extraerBid(txt);
    if (bid !== null) {
      return res.json({ bid: bid });
    } else {
      // Si no se encontró, devolvemos status y texto para depuración
      return res.status(404).json({ error: "Bid no encontrado (html)", debugSample: txt.slice(0,2000) });
    }
  } catch (err) {
    console.error("Error proxy:", err);
    return res.status(500).json({ error: "error interno", detail: String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Proxy listo en puerto", port));
