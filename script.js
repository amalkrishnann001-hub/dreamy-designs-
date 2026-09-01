// Dreamy Designs customer website
// Products are loaded from the same Firestore collection used by DD Admin.

const firebaseConfig = {
  apiKey: "AIzaSyBdYWBLspsfNZ_T3C3sUPZLo3AzqitnO9Y",
  authDomain: "dreamy-designs-admin.firebaseapp.com",
  projectId: "dreamy-designs-admin",
  storageBucket: "dreamy-designs-admin.firebasestorage.app",
  messagingSenderId: "421647280739",
  appId: "1:421647280739:web:86d07f7c0b733b79cca656"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const IMG = "images/";
const whatsappNumber = "7306302117";

let products = [];
let currentProductId = null;

function normalizeCategory(category) {
  const value = String(category || "").toLowerCase().trim();
  if (value.includes("frame")) return "frames";
  if (value.includes("gift")) return "gifts";
  if (value.includes("print")) return "printing";
  return "other";
}

function imageUrl(value) {
  if (!value) return IMG + "placeholder.jpg";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("images/")) return value;
  return IMG + value;
}

function productImages(product) {
  const list = [];
  if (product.image) list.push(imageUrl(product.image));
  if (Array.isArray(product.gallery)) {
    product.gallery.forEach(v => {
      const url = imageUrl(v);
      if (!list.includes(url)) list.push(url);
    });
  }
  if (!list.length) list.push(IMG + "placeholder.jpg");
  return list;
}

function displayPrice(price) {
  if (price === undefined || price === null || price === "") return "Contact for price";
  const value = Number(price);
  if (Number.isFinite(value)) return "₹" + value.toLocaleString("en-IN");
  return String(price);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function loadProducts() {
  db.collection("products").onSnapshot(snapshot => {
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    products.sort((a,b) => {
      const at = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      const bt = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return bt - at;
    });
    renderProducts("all");
    renderMarquee();
  }, error => {
    console.error(error);
    document.getElementById("productGrid").innerHTML =
      '<div class="small-note">Unable to load products. Check Firestore read permissions.</div>';
  });
}

function renderProducts(filter = "all") {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";
  const filtered = products.filter(p => filter === "all" || normalizeCategory(p.category) === filter);

  if (!filtered.length) {
    grid.innerHTML = '<div class="small-note">No products available.</div>';
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("article");
    card.className = "product";
    card.onclick = () => openProduct(p.id);
    const reviews = getReviews(p.id);
    const avg = reviews.length ? (reviews.reduce((a,r) => a + r.rating, 0) / reviews.length).toFixed(1) : "New";
    card.innerHTML = `
      <img class="product-img" src="${escapeHtml(imageUrl(p.image))}" alt="${escapeHtml(p.name || "Product")}" onerror="this.src='images/placeholder.jpg'">
      <div class="product-body">
        <h3>${escapeHtml(p.name || "Unnamed Product")}</h3>
        <div class="price">${escapeHtml(displayPrice(p.price))}</div>
        <div class="rating">${reviews.length ? "Rating " + avg + " (" + reviews.length + ")" : "New product"}</div>
        <div class="small-note">Tap to view details</div>
      </div>`;
    grid.appendChild(card);
  });
}

function renderMarquee() {
  const items = products.filter(p => p.topSelling === true);
  const html = items.map(p => `
    <div class="sell-card" onclick="openProduct('${escapeHtml(p.id)}')">
      <img src="${escapeHtml(imageUrl(p.image))}" alt="${escapeHtml(p.name || "Product")}" onerror="this.src='images/placeholder.jpg'">
      <div class="sell-info"><b>${escapeHtml(p.name || "Product")}</b><span>${escapeHtml(displayPrice(p.price))}</span></div>
    </div>`).join("");

  document.getElementById("marqueeTrack1").innerHTML = html || '<div class="small-note" style="padding:20px">No top-selling products yet.</div>';
  document.getElementById("marqueeTrack2").innerHTML = html;
}

function filterProducts(category, button) {
  document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
  if (button) button.classList.add("active");
  renderProducts(category);
}

function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  currentProductId = id;
  location.hash = "product/" + id;
  document.getElementById("homePage").style.display = "none";
  document.getElementById("detailPage").style.display = "block";

  document.getElementById("detailName").textContent = p.name || "Product";
  document.getElementById("detailPrice").textContent = displayPrice(p.price);
  document.getElementById("detailDescription").textContent = p.description || "No description available.";

  const reviews = getReviews(id);
  const avg = reviews.length ? (reviews.reduce((a,r) => a + r.rating, 0) / reviews.length).toFixed(1) : "";
  document.getElementById("detailRating").textContent = reviews.length ? "Rating " + avg + " / 5" : "No reviews yet";

  const images = productImages(p);
  const main = document.getElementById("detailMainImage");
  main.src = images[0];
  main.alt = p.name || "Product";
  main.onerror = () => main.src = IMG + "placeholder.jpg";

  const thumbs = document.getElementById("detailThumbs");
  thumbs.innerHTML = "";
  images.forEach((src, i) => {
    const t = document.createElement("img");
    t.className = "thumb" + (i === 0 ? " active" : "");
    t.src = src;
    t.alt = (p.name || "Product") + " image " + (i + 1);
    t.onerror = () => t.src = IMG + "placeholder.jpg";
    t.onclick = () => {
      main.src = src;
      document.querySelectorAll(".thumb").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
    };
    thumbs.appendChild(t);
  });

  renderReviews(id);
  window.scrollTo(0, 0);
}

function goHome() {
  location.hash = "";
  document.getElementById("detailPage").style.display = "none";
  document.getElementById("homePage").style.display = "block";
  window.scrollTo(0, 0);
}

function orderCurrentProduct() {
  const p = products.find(x => x.id === currentProductId);
  if (!p) return;

  const message = `Hello Dreamy Designs!\n\nI would like to order:\nProduct: ${p.name}\nPrice: ${displayPrice(p.price)}\n\nPlease share the customization/order details.`;
  window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message), "_blank");
}

function orderProduct(productName, price) {
  const message = `Hello Dreamy Designs!\n\nI would like to order:\nProduct: ${productName}\nPrice: ${price}\n\nPlease provide the order details.`;
  window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message), "_blank");
}

function contactWhatsApp() {
  const message = "Hello Dreamy Designs!\n\nI would like to know more about your products.";
  window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message), "_blank");
}

function reviewKey(id) {
  return "dreamy_reviews_" + id;
}

function getReviews(id) {
  try { return JSON.parse(localStorage.getItem(reviewKey(id)) || "[]"); }
  catch (e) { return []; }
}

function submitReview() {
  const id = currentProductId;
  const name = document.getElementById("reviewName").value.trim();
  const text = document.getElementById("reviewText").value.trim();
  const rating = Number(document.getElementById("reviewRating").value);

  if (!name || !text) {
    alert("Please enter your name and review.");
    return;
  }

  const reviews = getReviews(id);
  reviews.unshift({ name, text, rating, date: new Date().toLocaleDateString() });
  localStorage.setItem(reviewKey(id), JSON.stringify(reviews));

  document.getElementById("reviewName").value = "";
  document.getElementById("reviewText").value = "";
  renderReviews(id);
}

function renderReviews(id) {
  const box = document.getElementById("reviewsList");
  const reviews = getReviews(id);

  if (!reviews.length) {
    box.innerHTML = '<div class="small-note">No reviews yet. Be the first to review this product.</div>';
    return;
  }

  box.innerHTML = reviews.map(r => `
    <div class="review">
      <strong>${escapeHtml(r.name)}</strong>
      <div class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
      <div>${escapeHtml(r.text)}</div>
      <div class="small-note">${escapeHtml(r.date)}</div>
    </div>`).join("");
}

window.addEventListener("hashchange", () => {
  const match = location.hash.match(/^#product\/(.+)$/);
  if (match) openProduct(decodeURIComponent(match[1]));
  else goHome();
});

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  const match = location.hash.match(/^#product\/(.+)$/);
  if (match) setTimeout(() => openProduct(decodeURIComponent(match[1])), 500);
});
