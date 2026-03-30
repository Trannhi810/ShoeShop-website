let products = [];
let filteredProducts = [];

let currentPage = 1;
const perPage = 8;

/* ===================== LOAD API ===================== */
async function loadProductsFromAPI() {
  try {
    const res = await fetch("http://localhost:3000/api/products");
    const data = await res.json();

    products = data;
    filteredProducts = [...products];

    renderProducts(filteredProducts);

  } catch (err) {
    console.log("Lỗi API:", err);
  }
}

/* ===================== RENDER ===================== */
function renderProducts(productArray) {
  const productList = document.getElementById("productList");
  if (!productList) return;

  if (!productArray || productArray.length === 0) {
    productList.innerHTML = `<p class="empty-text">Không tìm thấy sản phẩm phù hợp.</p>`;
    return;
  }



  // PHÂN TRANG
  const start = (currentPage - 1) * perPage;
  const pageData = productArray.slice(start, start + perPage);

  productList.innerHTML = pageData.map(product => `
    <div class="product-card">
      <img 
        src="${product.image || product.images?.[0] || ''}" 
        alt="${product.name}" 
        class="product-image"
      />
      <div class="product-body">
        <p class="product-category">${product.category?.name || product.category || ''}</p>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${(product.price || 0).toLocaleString("vi-VN")}đ</p>
        <p class="product-desc">${product.description || ''}</p>
        <button class="primary-btn" onclick="addToCart('${product._id}')">Thêm vào giỏ</button>
      </div>
    </div>
  `).join("");

  renderPagination(productArray.length);
}

/* ===================== PAGINATION ===================== */
function renderPagination(totalItems) {
  const container = document.getElementById("pagination");
  if (!container) return;

  const totalPages = Math.ceil(totalItems / perPage);

  container.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    container.innerHTML += `
      <span class="page-btn ${i === currentPage ? 'active' : ''}" 
        onclick="changePage(${i})">${i}</span>
    `;
  }
}

function changePage(page) {
  currentPage = page;
  renderProducts(filteredProducts);
}

/* ===================== FILTER ===================== */
function filterProducts() {
  currentPage = 1;

  const searchValue = document.getElementById("searchInput").value.trim().toLowerCase();
  const categoryValue = document.getElementById("categoryFilter").value;
  const priceValue = document.getElementById("priceFilter").value;

  let filtered = [...products];

  if (searchValue) {
    filtered = filtered.filter(product =>
      product.name.toLowerCase().includes(searchValue)
    );
  }

  if (categoryValue) {
    filtered = filtered.filter(product =>
      (product.category?.name || product.category) === categoryValue
    );
  }

  if (priceValue === "under-2000000") {
    filtered = filtered.filter(product => product.price < 2000000);
  }

  if (priceValue === "2000000-3000000") {
    filtered = filtered.filter(product => product.price >= 2000000 && product.price <= 3000000);
  }

  if (priceValue === "over-3000000") {
    filtered = filtered.filter(product => product.price > 3000000);
  }

  filteredProducts = filtered;
  renderProducts(filteredProducts);
}

/* ===================== RESET ===================== */
function resetFilter() {
  currentPage = 1;

  document.getElementById("searchInput").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("priceFilter").value = "";

  filteredProducts = [...products];
  renderProducts(filteredProducts);
}

/* ===================== INIT ===================== */
document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromAPI();
});