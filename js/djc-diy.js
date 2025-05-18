const imagePaths = [
  "../../assets/project-photos/djc-diy/001.png",
  "../../assets/project-photos/djc-diy/002.png",
  "../../assets/project-photos/djc-diy/003.png",
  "../../assets/project-photos/djc-diy/004.png",
  "../../assets/project-photos/djc-diy/005.png",
  "../../assets/project-photos/djc-diy/006.png",
  "../../assets/project-photos/djc-diy/007.png"
];

let currentIndex = 0;
let slideshowActive = true;
let slideshowInterval;

const mainImage = document.getElementById("main-image");
const thumbnailContainer = document.getElementById("thumbnail-container");

function updateMainImage(index) {
  const img = document.getElementById("main-image");

  // fade out
  img.classList.add("fade-out");

  // posle fade out-a menjamo sliku i fade in
  setTimeout(() => {
    img.src = imagePaths[index];
    img.classList.remove("fade-out");

    document.querySelectorAll(".thumbnail-container img").forEach((thumb, i) => {
      thumb.classList.toggle("selected", i === index);
    });
  }, 500); // mora da bude isto kao u CSS transition: 0.5s
}

function nextImage() {
  currentIndex = (currentIndex + 1) % imagePaths.length;
  updateMainImage(currentIndex);
}

function prevImage() {
  currentIndex = (currentIndex - 1 + imagePaths.length) % imagePaths.length;
  updateMainImage(currentIndex);
}

function stopSlideshow() {
  slideshowActive = false;
  clearInterval(slideshowInterval);
}

function startSlideshow() {
  slideshowInterval = setInterval(() => {
    if (slideshowActive) {
      nextImage();
    }
  }, 3000);
}

function createThumbnails() {
  imagePaths.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    if (index === currentIndex) img.classList.add("selected");
    img.addEventListener("click", () => {
      currentIndex = index;
      updateMainImage(currentIndex);
      stopSlideshow();
    });
    thumbnailContainer.appendChild(img);
  });
}

mainImage.addEventListener("click", () => {
  const overlay = document.createElement("div");
  overlay.className = "fullscreen-overlay";
  const img = document.createElement("img");
  img.src = imagePaths[currentIndex];
  img.className = "fullscreen-image";
  overlay.appendChild(img);
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
});

document.addEventListener("DOMContentLoaded", () => {
  createThumbnails();
  startSlideshow();
  document.querySelector(".next").addEventListener("click", () => stopSlideshow());
  document.querySelector(".prev").addEventListener("click", () => stopSlideshow());
});


function showTab(tab, event) {
  // Aktiviraj dugme
  document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");

  // Prikaži odgovarajući .tab-section
  document.querySelectorAll(".tab-section").forEach(section => {
    section.classList.toggle("hidden", section.dataset.tab !== tab);
  });
}