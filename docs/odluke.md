# Odluke i otvorene stavke

Ovaj fajl postoji iz jednog razloga: **sprečava da se namerne odluke iz
koncepta „poprave" u nešto pogrešno.** Nekoliko stvari u kodu izgleda kao
greška dok se ne zna zašto je tu.

Pročitaj pre nego što počneš da prepisuješ koncept u statične stranice.

---

## Namerno, iako izgleda kao greška

**Projects H1 je vizuelno skriven.**
`<h1 style="position:absolute;width:1px;height:1px;clip:rect(0,0,0,0);…">Projects</h1>`
Stranica po dizajnu nema vidljiv naslov, ali mora imati H1. Ne pretvaraj ga
u vidljiv naslov i ne briši ga.

**Search input ima `transform: scale(0.75)`.**
Pravi `font-size` je `16px`, a `scale` ga vraća na vizuelnih 12px. Razlog:
iOS Safari automatski zumira stranicu kad korisnik dodirne polje sa fontom
manjim od 16px. Širina `calc(133.3333% - 33.34px)` je kompenzacija za to
skaliranje i matematika je proverena. **Ne pojednostavljuj ovo nazad na
`font-size:12px`** — vratio bi bag na iPhone-u.

**Pill tagovi su 11px.** U kodu stoji komentar koji to objašnjava — svesno
odstupanje od skale tipografije, kontrast 8.3:1 ili bolji, dozvoljeno samo
za pill tagove. Drugde 11px ostaje zabranjen.

**News redovi koriste `direction: rtl`.** To je trik za naizmenični raspored
slika i teksta. Oba deteta imaju `direction: ltr` reset, pa tekst ne curi u
RTL. Nije bag.

**Dodirne mete su veće od onoga što se vidi.** Tačkice slideshow-a: vidljiv
kvadratić 8×8px unutar `<button>` od 24×24px sa `margin:-8px`. Social ikonice
u footeru: ikonica 16×16px unutar `<a>` od 24×24px sa `margin:-4px`.
Negativna margina održava razmak na ekranu nepromenjenim. Ne „sređuj"
dimenzije na jednu vrednost — izgubio bi dodirnu metu.

**Pauza slideshow-a ima dva odvojena mehanizma.** `paused` je trajna odluka
korisnika preko dugmeta. `hover`, `focus` i `hidden` su privremene pauze koje
se same otpuštaju. Ne spajaj ih u jedan flag.

**easyrace ima datum `2026-10-28`, u budućnosti.** Planirani datum izlaska.
Sort „Newest" ga zato stavlja iznad DJC-DIY. Tako treba.

**`drivepad` nema svoju stranicu** (`page: null`). Namerno dok projekat ne
sazri. Kartica na Projects stranici postoji, klik ne vodi nigde.

---

## Dogovoreno pri prelasku na statički sajt

**YouTube video na DJC-DIY je ugrađen direktno** (`<iframe>`), iako CLAUDE.md
inače zabranjuje mrežne pozive van našeg domena. Odluka vlasnika
(2026-09-17): ugrađen plejer izgleda lepše od slike sa play dugmetom.
Ne zamenjuj ga „fasadom" koja učitava YouTube tek na klik.

**Prelaz između stranica je CSS view transition.** U konceptu stranica bledi
pri promeni jer je sve jedna stranica; na statičkom sajtu isti efekat daje
CSS `@view-transition`, bez JavaScript-a. Firefox ga ne podržava i tamo je
prelaz trenutan — to je prihvaćeno, ne dodaji JS zamenu.

**Domen je `mandiclab.com`, bez www.** Stari sajt je bio na
`www.mandiclab.com`; od novog sajta CNAME sadrži samo `mandiclab.com`, a
GitHub Pages preusmerava www na njega.

**Slike na karticama Projects stranice su uvek 16:9.** Svesno odstupanje od
koncepta, gde je slika na desktopu oko 3:2, a na užim ekranima 16:10. Da tekst
ne bi ostao pretesan, kartica na širokim ekranima je 24 kvadratića mreže
umesto 21 (visina ostaje 7): slika je ~570px, tekst ~532px — tekst uži od
slike, ali što bliži njoj (25 kvadratića bi ga učinilo širim). Kartice se
slažu jedna ispod druge čim puna širina od 24 kvadratića ne staje (ispod
1170px umesto 1060px), pa uska kolona teksta ne može da se pojavi.

**Assembly slike na DJC-DIY su SVG u A4 položenom formatu**, pa njihovi okviri
dobijaju A4 proporcije umesto 16:9 iz placeholder-a u konceptu. Ivica i
pozadina okvira ostaju iste.

**Hero slike su 5120×2160.** Važi za Home slideshow i hero slike projekata.
Ostale slike su 16:9, osim galerije, gde svaka slika zadržava svoje proporcije.

**Ikonice u footeru ne menjaju boju na hover.** Koncept ima pravilo koje bi
ih posvetlilo, ali ga poništava stil upisan direktno na element, pa se u
konceptu ništa ne menja. Preneto je tako kako se vidi.

**Demo i Tutorial video na DJC-DIY su ispravljeni u odnosu na koncept.**
Koncept je zamenio YouTube adrese: `Z4C7toXesU8` je tutorijal („How To Make
A DIY DJ Controller - Detailed Tutorial"), a `WDb8kAIuzXc` demo („PRO DJ vs
DIY DJ Controller"). Ispravljeno je i na dugmadima i u linkovima u tekstu —
ne vraćaj adrese iz koncepta.

**Promena videa na DJC-DIY: bez pomeranja, i čeka učitavanje.** U konceptu
okvir se pomeri ulevo i vrati posle 0,2s, pa se vidi kako novi YouTube plejer
„iskače" dok se učitava. Sada okvir stoji, stari video izbledi, novi se učitava
skriven i pojavljuje se tek kada ga YouTube javi kao učitanog (plus kratka
pauza da plejer iscrta sliku). Dugme se obeležava odmah na klik.

**Godina u footeru se menja sama** (`assets/js/site.js`), kao u konceptu. U
HTML-u stoji rezervna godina za posetioce bez JavaScript-a.

---

## Jedna stvar koja se NE prenosi

`_reassertTabFocus` — petlja koja 900ms posle pritiska strelice vraća fokus
na dugme taba, sa komentarom *„a later commit pass can replace the tab node
and drop focus"*.

To je zaobilaznica za runtime iz Claude Design-a, koji ume da zameni DOM čvor
i ispusti fokus. U običnom HTML-u taj problem ne postoji. **Nemoj prepisivati
ovu petlju u vanilla JS** — samo postavi fokus jednom i gotovo. Nuspojava
originala je da Tab pritisnut odmah posle strelice bude vraćen nazad.

---

## Što mora preživeti prepisivanje

Koncept ima kompletnu pristupačnost i sve je provereno da radi. Pri prelasku
na vanilla JS ovo su konkretne stvari koje se lako tiho izgube:

**Tabovi** (DJC-DIY i easyrace) — `role="tablist"` / `tab` / `tabpanel`,
`aria-selected`, `aria-controls`, `aria-labelledby`, roving tabindex
(aktivni tab `0`, ostali `-1`), navigacija strelicama levo/desno plus
Home/End.

**Meniji** (Sort, Filter) — `aria-haspopup="menu"`, `aria-expanded`,
`role="menu"` i `role="menuitem"`, zatvaranje na Escape i na klik izvan menija.

**FAQ akordeon** — `aria-expanded`, `aria-controls`, odgovor je
`role="region"` sa `aria-labelledby`, i `visibility:hidden` kad je zatvoren
(inače ga screen reader čita uprkos `max-height:0`).

**Lightbox** — `role="dialog"`, `aria-modal="true"`, fokus se pri otvaranju
prebacuje na dugme za zatvaranje, Tab i Shift+Tab kruže unutar modala,
pozadina dobija `aria-hidden` dok je otvoren, i fokus se pri zatvaranju vraća
tačno na sliku iz koje je otvoren. Escape zatvara, strelice menjaju sliku.

**Slideshow** — `prefers-reduced-motion` potpuno isključuje autoplay,
`visibilitychange` pauzira kad tab nije aktivan, touch swipe radi,
strelice levo/desno rade kad je fokus unutar slideshow-a.

**Globalno** — `@media (prefers-reduced-motion: reduce)` blok koji gasi sve
animacije i tranzicije, plus `:focus-visible` outline definisan svuda.

---

## Otvorene stavke

Sadržaj koji popunjava vlasnik projekta, ne ti:

- dva news bloka na home stranici — naslov, tekst i odredište CTA dugmeta
- opis slike `ml-gal-2` u galeriji
- specifikacija hidrauličke ručne na easyrace-u (sada `Specification TBD`)
- količine filamenta i žice na easyrace bundle-ovima (sada `X g`, `X m`)
- `FAQ` i `Terms` tabovi na easyrace stranici — postoje, kompletno su
  ožičeni, ali su prazni
- sve slike i njihovi `alt` tekstovi

Pred lansiranje easyrace-a:

- Privacy Policy stranica. `Terms` tab za sam proizvod već postoji na
  easyrace stranici, ali Privacy Policy nema gde da stoji.
