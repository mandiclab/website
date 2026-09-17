# MandićLab — website

Statički sajt za MandićLab, jednočlani projekat koji pravi 3D-štampiv
open-source DIY hardver: DJC-DIY (DJ kontroler), easyrace i drivepad
(sim racing oprema).

Dizajn je završen i odobren. Izvorni koncept je `concept/standalone.html`
— jedan fajl koji sadrži svih šest stranica. Posao u ovom repozitorijumu je da se
taj koncept pretvori u statički sajt, **bez menjanja izgleda**.

Koncept je zapakovana arhiva iz Claude Design-a: šablon stranica, logika,
slideshow komponenta, fontovi i ikonice su u njemu kodirani (base64 + gzip).
Da bi se pročitao, mora se raspakovati — u privremeni folder, ne u repozitorijum.

---

## Tvrda ograničenja

- **Statički sajt, bez build koraka.** Hostuje se na GitHub Pages. Nema Node-a,
  nema bundlera, nema npm skripti, nema CI koraka koji generiše fajlove.
  Ono što je u repozitorijumu je ono što se servira.
- **Čist HTML, CSS i vanilla JS.** Bez React-a, bez framework-a, bez
  template engine-a. Koncept je pisan u React-u — to ne prelazi ovamo.
- **Bez eksternih zavisnosti.** Nema CDN-ova, nema Google Fonts linkova,
  nema analytics-a. Fontovi se self-hostuju iz repozitorijuma.
  Ako nešto traži mrežni poziv van našeg domena, ne ide.
  Jedini dogovoreni izuzetak: ugrađen YouTube video (vidi `docs/odluke.md`).
- **Čisti URL-ovi, bez `.html`.** Svaka stranica je `index.html` u svom folderu.

---

## Struktura URL-ova

```
/index.html                      →  mandiclab.com/
/projects/index.html             →  mandiclab.com/projects/
/projects/djc-diy/index.html     →  mandiclab.com/projects/djc-diy/
/projects/easyrace/index.html    →  mandiclab.com/projects/easyrace/
/projects/drivepad/index.html    →  mandiclab.com/projects/drivepad/
/about/index.html                →  mandiclab.com/about/
/contact/index.html              →  mandiclab.com/contact/
```

Interni linkovi koriste apsolutne putanje sa kosom crtom na kraju:
`/projects/djc-diy/`, ne `../projects/djc-diy/index.html`.

U root-u idu i: `.nojekyll`, `CNAME` (sadržaj: `mandiclab.com`), `404.html`,
`robots.txt`, `sitemap.xml`.

---

## Dizajn tokeni

Definisani su u `:root`. **Koristi isključivo ove vrednosti** — ne uvodi nove
boje, veličine ni trajanja animacija bez pitanja.

```css
--bg:#0B0B0C;
--surface-1:rgba(242,242,240,0.04);
--surface-2:rgba(242,242,240,0.08);
--overlay-header:rgba(11,11,12,0.55);

--text-1:#F2F2F0;
--text-2:rgba(242,242,240,0.78);
--text-3:rgba(242,242,240,0.58);
--text-disabled:rgba(242,242,240,0.38);

--line-1:rgba(242,242,240,0.08);
--line-2:rgba(242,242,240,0.16);
--line-3:rgba(242,242,240,0.28);

--accent-rose:#E89189;
--accent-green:#9FE3C1;
--accent-blue:#9CC2EE;
--accent-gold:#E8C98C;

--fs-display:clamp(34px,4vw,56px);
--fs-h1:clamp(26px,2.8vw,38px);
--fs-h2:clamp(20px,1.9vw,24px);
--fs-h3:17px;
--fs-body:15px;
--fs-small:13px;
--fs-label:12px;

--section-y:clamp(64px,9vh,128px);
--gutter:clamp(20px,4vw,48px);
--container:1280px;
--measure:66ch;
--measure-narrow:46ch;

--dur-fast:160ms;
--dur-base:300ms;
--dur-slow:500ms;
--dur-slide:1500ms;  /* smenjivanje slika u slideshow-u */
--ease:cubic-bezier(.16,1,.3,1);
```

Font je **Montserrat**, težine 200 / 300 / 400 / 500, self-hostovan kao woff2.
Fallback stack mora postojati: `Montserrat, system-ui, sans-serif`.

---

## Pravila koja se ne krše

**Izgled se ne menja.** Koncept je prošao dizajnersku i tehničku proveru.
Ako ti se čini da nešto treba drugačije — pitaj, nemoj sam promeniti.
Svaki pomeraj u razmaku, veličini fonta ili boji je regresija dok se ne
dogovori suprotno.

**Svaka slika ima `alt`.** `<img>` uvek nosi `alt`, `width`, `height`,
`loading` i `decoding`. Bez dimenzija nema slike — to je jedini način da
nema skakanja layout-a pri učitavanju. Hero slike: `loading="eager"` i
`fetchpriority="high"`. Sve ostale: `loading="lazy"`.

Alt tekst opisuje šta se na slici vidi, ne kako se fajl zove.
`"Sklopljen DJC-DIY kontroler, pogled odozgo"` — ne `"DJC-DIY slika 1"`.

**Hijerarhija naslova.** Tačno jedan `<h1>` po stranici, bez preskakanja
nivoa. Trenutno stanje koncepta je ispravno i prenosi se kako jeste:

| Stranica | H1 |
|---|---|
| Home | hero naslov |
| Projects | „Projects", vizuelno skriven |
| DJC-DIY | „DJC-DIY" |
| easyrace | „easyrace" |
| drivepad | „drivepad" (stranica nije u konceptu, vidi `docs/odluke.md`) |
| About | „A one man project." |
| Contact | „Have a question?" |

**Pristupačnost se ne gubi u prevodu.** Koncept već ima kompletnu ARIA
strukturu — `role="tablist"`/`tab`/`tabpanel` sa navigacijom strelicama,
`aria-expanded` na menijima i FAQ akordeonu, `role="dialog"` sa focus trap-om
na lightbox-u, `prefers-reduced-motion`, dodirne mete od 24×24px. Sve to
mora preživeti prepisivanje u vanilla JS. Ako nešto ne može isto — reci,
nemoj tiho izostaviti.

**Bez browser storage-a** za bilo šta što nosi sadržaj. Stranice moraju
raditi na prvom učitavanju, u anonimnom prozoru, bez ikakvog prethodnog stanja.

---

## Kako radimo

- Radi u malim koracima i staj da proverim. Nemoj prepisati pola sajta
  u jednom potezu.
- Posle svakog koraka koji radi — commit sa jasnom porukom.
- Ako nešto nije jasno ili postoji više razumnih pristupa, pitaj pre nego
  što izabereš. Vlasnik projekta nije web programer, pa objasni izbor
  u jednoj rečenici bez žargona.
- Ne dodavaj zavisnosti, alate ni fajlove koji nisu traženi.

---

## Trenutno stanje

Sadržaj koncepta još ima placeholdere koje popunjava vlasnik projekta:
news blokovi na home stranici, opis jedne slike u galeriji, specifikacija
hidrauličke ručne na easyrace-u, količine filamenta i žice, i prazni
`FAQ` i `Terms` tabovi na easyrace stranici. Slike takođe još nisu ubačene.

To nije tvoj posao osim ako se izričito traži — prenesi ih kako jesu.
