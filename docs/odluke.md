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
RTL. Nije bag. Strane zavise od položaja reda (svaki drugi je obrnut), pa se
nova vest samo doda **iznad** postojećih, kopiranjem postojećeg reda kao
šablona — ostale se same prebace na suprotnu stranu. Najnovija vest je uvek
prva, sa slikom levo.

**Dodirne mete su veće od onoga što se vidi.** Tačkice slideshow-a: vidljiv
kvadratić 8×8px unutar `<button>` od 24×24px sa `margin:-8px`. Social ikonice
u footeru: ikonica 16×16px unutar `<a>` od 24×24px sa `margin:-4px`.
Negativna margina održava razmak na ekranu nepromenjenim. Ne „sređuj"
dimenzije na jednu vrednost — izgubio bi dodirnu metu.

**Promena slike u galeriji je obično pretapanje celog sadržaja.** Fotografije
su raznih oblika, pa je klizanje (i pomeranje okvira) seklo. Sada ceo sadržaj —
slika i tekst pored nje — izbledi, slika i tekst se zamene dok se ništa ne vidi,
pa se sve vrati. Strelice levo i desno i X stoje na mestu i ne blede; X je
fiksan u gornjem desnom uglu, poravnat sa desnom strelicom. Brzi klikovi samo
pomeraju cilj, pa se stigne na tačnu sliku.

**Pozadina iza lightbox-a je tamnija nego u konceptu** (`rgba(11,11,12,0.55)`
umesto `0.34`), uz isti blur: stranica se i dalje nazire, ali tekst pored slike
ima dovoljan kontrast. Tagovi pored slike počinju u visini gornje ivice slike,
a ako u `.md` nema teksta ispod njih, poslednji tag nema ni liniju. Prvi tag
je spušten 8px ispod te ivice, da ikonica ne deluje kao da viri iznad slike.



**easyrace hero je isti slideshow kao na druge dve stranice.** U konceptu je
bila jedna slika sa tri ukrasne sličice ispod, koje ništa ne rade; sada je
`.product-slideshow` sa sličicama koje se same prave od slika i prebacuju
sliku, kao na DJC-DIY i drivepad-u. Stari `.er-hero` i `.er-thumbs` su obrisani.
**Hero na stranicama projekata ide od ivice do ivice i na telefonu.** Pravilo
koje ispod 640px daje sekcijama 16px sa strana preskače `.product`, jer taj
razmak već nosi `.product-body`; inače bi hero fotografija imala belinu sa
strana, a na Home stranici je nema.
**Slika u lightbox-u ne ide preko celog ekrana.** Najviše 80% širine i 76%
visine prozora (na telefonu 88% i 68%), a najviše 1440×900px, pa ostaje vazduha
oko nje i na velikom monitoru. Kada ima teksta sa strane, širina se dodatno
umanjuje za tu kolonu. Na telefonu se dodatno drži dalje od strelica, da ne
ide do njih.


**Ispod galerije stoji poziv da se pošalje svoja slika** (nije u konceptu, na
zahtev vlasnika): slika se šalje u Discord zajednicu, u kanal `#🖼️lab-gallery`,
uz opcione naloge na mrežama i poruku. Ispod toga, sitnijim slovima, stoje
uslovi tog kanala (MandićLab sme slobodno da koristi poslate slike i snimke).
Isti tekst stoji na DJC-DIY i na drivepad stranici.
**Tekst uz sliku u galeriji dolazi iz `.md` fajla pored slike.** Slika
`1.webp` čita `1.md` iz istog foldera (`lightbox.js` ga uzme tek kad se slika
otvori, sa našeg domena). Redovi oblika `instagram: ime` postaju link sa
ikonicom te mreže (`instagram`, `youtube`, `tiktok`, `github`, `ko-fi`,
`discord`); ako je vrednost puna adresa, koristi se ona. Discord nema javni
profil, pa se bez adrese prikaže samo ikonica i ime, bez linka. Sve ostalo
postaje pasusi, prazan red razdvaja pasuse. Nema fajla ili je prazan — slika
se otvara sama, po sredini. Tekst se ubacuje kao čist tekst, ne kao HTML.

**Strelice nemaju podlogu ni na dodirnim ekranima.** Koncept im na telefonu
daje tamni kvadratić (`background: rgba(11,11,12,0.38)`); sada je samo
strelica, na svim uređajima. Na dodiru ostaju stalno vidljive, jer nema hover-a.

**Pauza slideshow-a ima dva odvojena mehanizma.** `paused` je trajna odluka
korisnika preko dugmeta. `hover`, `focus` i `hidden` su privremene pauze koje
se same otpuštaju. Ne spajaj ih u jedan flag.

**Slike u slideshow-u su jedna traka.** U konceptu je bilo pretapanje; sada su
slike na traci: svaka stoji tačno jednu širinu od sledeće, a korak pomeri celu
traku za jednu širinu, odatle gde se zatekne (`slideshow.js` upisuje položaje
i trajanja direktno na slike). Zato klik usred prelaza ne prekida traku: sve
se pomeri za isti iznos, pa razmaci ostaju isti, a pošto put bude duži u istom
vremenu, traka se prirodno ubrza. Slika koja se traži a još izlazi (kod dve
slike svaki brzi drugi klik) dobija kopiju (`.is-ghost`) koja nastavi da
izlazi umesto nje, pa ona može da uđe sa suprotne strane; kopija nema naslov
kao naslov ni linkove, da se ne broje dvaput. Trajanje jednog koraka je
`--dur-slide` (1,5s), kriva `--ease` (brz start, meko sleganje). Važi za sve
slideshow-e: hero, hero na stranicama projekata i slike u vestima.

**Home hero se ne zaustavlja na hover** (`data-hover-pause="off"`) jer prekriva
ceo ekran, pa bi miš stalno stajao preko njega; ima svoje dugme za pauzu, a
pauza na fokus i na neaktivan tab ostaje. Interval mu je 9s umesto 6s. Vesti
na home stranici i dalje staju na hover, jer nemaju dugme za pauzu.

**Dugme play/pause nema okvir** — znak je viši od kvadratića (12px) i deblji
(crte pauze 3px), da se jasno vidi preko slike. Na hover blago naraste, bez sjaja, na
klik se stisne, a novi znak (play ili pause) naraste na mesto. Dodirna meta
ostaje 24×24px.

**Po sredini se centriraju kvadratići, ne ceo red.** Dugme play/pause stoji
levo od njih, ali se u centriranju ne računa: `.slide-dots` na desnoj strani
dobija prazan protivteg iste širine (`::after`, 8px), pa kvadratići padaju
tačno na sredinu okvira. Pravilo je pod `:has(.slide-play)` — gde dugmeta nema,
nema ni protivtega.

**easyrace ima datum `2026-10-28`, u budućnosti.** Planirani datum izlaska.
Sort „Newest" ga zato stavlja iznad DJC-DIY. Tako treba.

**`drivepad` ima svoju stranicu** (`/projects/drivepad/`), iako je u konceptu
nema (`page: null`) — dodata na zahtev vlasnika. Strukturno je identična
DJC-DIY stranici (slideshow, Ko-fi obaveštenje, isti tabovi, galerija,
lightbox); tekst je drivepad-ov. „Show more" na drivepad kartici vodi na nju.
Dok linkovi ne budu spremni, dugmad za video nemaju `data-video` (okvir je
prazan), a GitHub Repo, Download i PCBWay dugmad su `<a>` bez `href` —
izgledaju isto, ali ne vode nigde i ne dobijaju fokus. Tabela 3D štampanih
delova i koraci sklapanja su namerno prazni.

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

**easyrace kartica nema „In development" tag.** U konceptu ga ima, ali sajt
se objavljuje tek kada je easyrace završen. „In development" ostaje samo na
drivepad-u, pa filter „In development" prikazuje samo njega.

**DJC-DIY ima obaveštenje o podršci na Ko-fi-ju** (nije u konceptu, dodato na
zahtev vlasnika). Stoji ispod uvodnog pasusa i iznad trake sa tabovima, od
ivice do ivice kao traka. Zlatni okvir sa blagim sjajem i zlatni naslov velikim
slovima (boje „In development" taga, sjaj kao kod bundle kartica); sama poruka
je običnim slovima da bi se lako čitala. Ton je namerno blag — obaveštenje,
ne molba.

**DJC-DIY tekst izmenjen u odnosu na koncept, na zahtev vlasnika.** Opis
mikrokontrolera i žice u tabeli elektronskih komponenti usklađen je sa
easyrace delovima (`Pro Micro - ATmega32U4 - USB Type-C`, `≥ 24 AWG`), a iz
rečenice o PCBWay-u je izbačen deo „where you can also see the whole project".
Naslov „Info" u Overview-u sada glasi „Specs", a novi naslov „Info" stoji iznad
rečenica o videima i PCBWay-u (isto i na drivepad-u).

**Dugmad GitHub Repo / Download / Support zadržavaju svoju širinu.** U konceptu
na srednjim širinama ne prelaze u novi red pa poslednje ispadne van kolone, a
ispod 640px se razvuku preko cele širine. Sada su uvek svoje prirodne širine i
prelaze u sledeći red kada nema mesta.

**Neobjavljeni projekti se skrivaju oznakom `data-draft`.** Sve što nosi
`data-draft` (sada kartice easyrace i drivepad na Projects stranici) ne vidi
se na pravom sajtu, a vidi se kada se sajt otvori lokalno (`localhost` ili
`127.0.0.1`), pa se pre objave može pregledati bez ikakvog prebacivanja pred
push. Na pravom sajtu takva kartica ne učestvuje ni u pretrazi, sortiranju i
filteru. Same stranice neobjavljenih projekata i dalje postoje na svojoj
adresi (i u javnom repozitorijumu), ali nisu u `sitemap.xml` i imaju
`noindex`, pa ih pretraživači ne prikazuju.

Kada se projekat objavljuje:

1. u `projects/index.html` obriši `data-draft` sa kartice projekta;
2. na stranici projekta obriši komentar „Unreleased" i red
   `<meta name="robots" content="noindex">` ispod njega;
3. vrati adresu stranice u `sitemap.xml`.

**Tekst preko Home hero-a stoji unutar svoje slike.** U konceptu tekst je bio
jedan i prikazivao se samo preko prve slike. Sada svaka slika može imati svoj
`.hero-gradient` i `.hero-text`, pa tekst bledi zajedno sa tom slikom, a slika
bez teksta prikazuje samo fotografiju. Naslov prve slike je `<h1>` stranice,
ostale slike koriste `<h2>`. Linkovi na slici koja se ne vidi ispadaju iz
redosleda tabulatora (slideshow.js), da fokus ne ode na nevidljivo dugme.
Prva slika je o DJC-DIY, druga o demou DJ Tweety-ja (njegovi nalozi i dugme
„See demo" ka YouTube demou), treća je „Stay tuned" (YouTube,
Instagram, Discord zajednica) uz istu rečenicu o podršci na Ko-fi-ju kao na
DJC-DIY stranici.

**Slika u „What's new" kartici može imati više fotografija** (nije u konceptu,
na zahtev vlasnika). Koristi isti slideshow kao hero (`data-indicator="none"`):
fotografije se same smenjuju istim prelazom, bez tačkica, jer je
kartica vest, a detalji su na stranici projekta; strelice postoje svuda gde ima
više slika. Staje dok je miš preko slike
ili tab nije aktivan, a uz `prefers-reduced-motion` stoji na prvoj fotografiji.

**Home hero je visok `100svh`, ne `100vh`.** Na telefonu `100vh` računa visinu
kao da je traka sa adresom sakrivena, pa je donji deo hero-a (tekst i dugme)
bio ispod ekrana dok je traka vidljiva. `100svh` je visina sa vidljivom
trakom; `100vh` ostaje ispred kao rezerva za starije pregledače. Ne vraćaj na
samo `100vh`.

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

**Otvoreni odgovor ide do svoje visine, ne do fiksne.** `max-height` je
`var(--faq-h)`, a `product.js` je izmeri (`scrollHeight`) na klik i upiše na
sam odgovor. Ranije je stajalo fiksnih `200px`: pošto je odgovor visok 60–130px,
expo krivulja je vidljivi deo pređe za ~50ms a preostalih 450ms je trošila na
prazan hod, pa je otvaranje izgledalo kao da škljocne dok je zatvaranje
izgledalo mekano. Meri se na klik, a ne pri učitavanju, jer FAQ stoji u
skrivenom tabu — skriven element se meri kao nula. Otvoren odgovor se premeri
i pri promeni veličine prozora, jer se tekst tad prelama u drugu visinu.

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

- slike za DJC-DIY v1.1.0 vest na home stranici
- opcioni `.md` fajlovi uz slike u galeriji (kredit i opis)
- specifikacija hidrauličke ručne na easyrace-u (sada `Specification TBD`)
- količine filamenta i žice na easyrace bundle-ovima (sada `X g`, `X m`)
- `FAQ` i `Terms` tabovi na easyrace stranici — postoje, kompletno su
  ožičeni, ali su prazni
- sve slike i njihovi `alt` tekstovi (easyrace hero sada prima više slika, kao
  DJC-DIY)
- drivepad stranica: YouTube video snimci i linkovi ka njima, GitHub/Download
  i PCBWay linkovi, tabela 3D štampanih delova i koraci sklapanja

Pred lansiranje easyrace-a:

- Privacy Policy stranica. `Terms` tab za sam proizvod već postoji na
  easyrace stranici, ali Privacy Policy nema gde da stoji.
