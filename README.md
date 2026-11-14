# Kale Kapışması

Fesli, bıyıklı kahramanlarımız kalede kapışıyor! Rakibinin kafasına zıpla ve ez, yere çakılıp etrafı savur, kuleden hendeğe it. Kaleyi akıncılara karşı koru, Kara Paşanın tahtına saldır.

Oyna: https://akintaha2010-cloud.github.io/ananilekapisma/

- **Bölümler:** 8 bölümlük hikâye modu. Her bölümde 1-3 yıldız toplanır, bölümler sırayla açılır.
- **Etkinlikler:** Kuşatma (dalga dalga gelen akıncılardan kapıyı koru), Kaleye Saldırı (Kara Paşa boss savaşı), Mancınık Yağmuru (gökten düşen taşlardan kaç), Taç Kapışı (tacı en uzun tutan kazanır) ve klasik Kapışma.
- **5 harita, 6 tema:** Kale Avlusu, Surlar, Asma Köprü, Zindan, Taht Salonu; gece, gündüz, şafak, kış, zindan ve kuşatma ateşi.
- **Dükkân:** Maçlardan altın kazan; fes, miğfer, sarık, yeniçeri börkü, taç, bıyık çeşitleri ve yeni renkler al.
- **Online:** Oda aç, 5 harfli kodu arkadaşına söyle, farklı bilgisayarlardan 4 kişiye kadar birlikte oyna.
- 1-4 oyuncu aynı klavyede, gamepad ile veya telefonda dokunmatik tuşlarla oynar
- Boş yerlere bilgisayar rakipler eklenebilir (Kolay / Orta / Zor)
- Hicaz makamında küçük bir müzik ve sentezlenmiş efektler (M ile sesi kapat)
- Bağımlılık yok: düz HTML, CSS ve JavaScript (ES modülleri) ile canvas

## Oynamak

```bash
python3 -m http.server 8080
# tarayıcıda http://localhost:8080
```

ES modülleri `file://` üzerinden açılmadığı için bir sunucu gerekiyor. GitHub Pages ile de yayınlanabilir.

## Online nasıl çalışır?

Ayrı bir oyun sunucusu yok. Oda sahibi oyunu kendi tarayıcısında çalıştırır, diğer oyuncular tuşlarını ona gönderir, o da oyunun anlık durumunu herkese yollar. Tarayıcılar birbirine WebRTC ile doğrudan bağlanır; bağlantıyı kurmak için [PeerJS](https://peerjs.com/)'in ücretsiz sunucusu kullanılır. Bu yüzden oyun GitHub Pages'te çalışmaya devam eder. Bazı okul/iş ağları doğrudan bağlantıyı engelleyebilir.

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
npm test               # fizik, mod, kayıt ve online protokol testleri (node --test)
node tools/sim.mjs     # her mod için bilgisayar oyuncularla hızlı maç simülasyonu
```

- `js/physics.js`: hareket, platformlar, ezme / itme / çakılma kuralları
- `js/maps.js`: haritalar, temalar, hareketli platformlar
- `js/game.js`: tarayıcıdan bağımsız maç durumu (yerelde, online oda sahibinde ve simülasyonda aynı kod)
- `js/modes.js`: kuşatma, saldırı, mancınık ve taç kuralları
- `js/progress.js`: bölümler, yıldızlar, altın ve dükkân (localStorage)
- `js/online.js`: PeerJS oda bağlantısı ve anlık durum protokolü
- `js/ai.js`: bilgisayar oyuncular
- `js/character.js`: maskotun canvas çizimi
- `js/render.js`: arka plan, efektler, skor tablosu
- `js/audio.js`: Web Audio ile ses ve müzik
- `js/main.js`: oyun döngüsü ve menüler
