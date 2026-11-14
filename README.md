# Kale Kapışması

Fesli, bıyıklı kahramanlarımız kalede kapışıyor! Rakibinin kafasına zıpla ve ez, yere çakılıp etrafı savur, kuleden hendeğe it. Son ayakta kalan kazanır.

- 1-4 oyuncu aynı klavyede, gamepad ile veya telefonda dokunmatik tuşlarla oynar
- Boş yerlere bilgisayar rakipler eklenebilir (Kolay / Orta / Zor)
- 8 farklı renk, 3 / 5 / 7 can seçeneği
- Hicaz makamında küçük bir müzik ve sentezlenmiş efektler (M ile sesi kapat)
- Bağımlılık yok: düz HTML, CSS ve JavaScript (ES modülleri) ile canvas

## Oynamak

```bash
python3 -m http.server 8080
# tarayıcıda http://localhost:8080
```

ES modülleri `file://` üzerinden açılmadığı için bir sunucu gerekiyor. GitHub Pages ile de yayınlanabilir.

## Tuşlar

| Oyuncu | Yürü | Zıpla | Çakıl / aşağı in | İt |
| --- | --- | --- | --- | --- |
| 1 | A / D | W | S | Q |
| 2 | ← / → | ↑ | ↓ | Sağ Shift |
| 3 | J / L | I | K | U |
| 4 | Num 4 / 6 | Num 8 | Num 5 | Num 7 |
| Gamepad | Sol çubuk | A | B / aşağı | X / RB |

Esc veya P: mola, Enter: başlat, M: ses.

## Kurallar

- **Ezme:** Bir rakibin kafasına üstten düşersen bir canı gider. Zıplamayı basılı tutarsan daha yükseğe sekersin.
- **Çift zıplama:** Havada bir kez daha zıplanır.
- **Çakılma:** Havada aşağı tuşu ile hızla yere çakılırsın; indiğin yerdeki rakipler savrulur. Tahta platformlarda aşağı tuşu ile aşağı inersin.
- **İtme:** Kısa bir hamle yapar, çarptığın rakibi fırlatır. Hendeğe düşen bir can kaybeder.
- Ezildikten veya yeniden doğduktan sonra kısa bir süre yanıp sönersin ve ezilemezsin.

## Geliştirme

```bash
npm test               # fizik ve yapay zeka testleri (node --test)
node tools/sim.mjs     # 4 bilgisayar oyuncuyla hızlı maç simülasyonu
```

- `js/physics.js`: hareket, platformlar, ezme / itme / çakılma kuralları
- `js/level.js`: kale haritası ve hareketli asansör
- `js/ai.js`: bilgisayar oyuncular
- `js/character.js`: maskotun canvas çizimi
- `js/render.js`: arka plan, efektler, skor tablosu
- `js/audio.js`: Web Audio ile ses ve müzik
- `js/main.js`: oyun döngüsü ve menüler
