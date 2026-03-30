function renderProducts(productArray) {
  const productList = document.getElementById("productList");
  if (!productList) return;

  if (!productArray || productArray.length === 0) {
    productList.innerHTML = `<p class="empty-text">Không tìm thấy sản phẩm phù hợp.</p>`;
    return;
  }

  productList.innerHTML = productArray.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" />
      <div class="product-body">
        <p class="product-category">${product.category}</p>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${product.price.toLocaleString("vi-VN")}đ</p>
        <p class="product-desc">${product.description}</p>
        <button class="primary-btn" onclick="addToCart(${product.id})">Thêm vào giỏ</button>
      </div>
    </div>
  `).join("");
}

function filterProducts() {
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
    filtered = filtered.filter(product => product.category === categoryValue);
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

  renderProducts(filtered);
}

function resetFilter() {
  document.getElementById("searchInput").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("priceFilter").value = "";
  renderProducts(products);
}