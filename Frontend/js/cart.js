function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(productId) {
  const cart = getCart();
  const product = products.find(item => item.id === productId);

  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  saveCart(cart);
  alert("Đã thêm sản phẩm vào giỏ hàng");
}

function increaseQty(productId) {
  const cart = getCart();
  const item = cart.find(product => product.id === productId);
  if (!item) return;

  item.quantity += 1;
  saveCart(cart);
  renderCart();
}

function decreaseQty(productId) {
  let cart = getCart();
  const item = cart.find(product => product.id === productId);
  if (!item) return;

  item.quantity -= 1;

  cart = cart.filter(product => product.quantity > 0);
  saveCart(cart);
  renderCart();
}

function removeItem(productId) {
  let cart = getCart();
  cart = cart.filter(product => product.id !== productId);
  saveCart(cart);
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById("cartContainer");
  const cartSummary = document.getElementById("cartSummary");
  if (!cartContainer || !cartSummary) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartContainer.innerHTML = `<p class="empty-cart">Giỏ hàng của bạn đang trống.</p>`;
    cartSummary.innerHTML = `
      <h3>Tóm tắt đơn hàng</h3>
      <p>Tổng tiền: 0đ</p>
      <button class="checkout-btn" disabled>Thanh toán</button>
    `;
    return;
  }

  cartContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-image" />
      <div class="cart-info">
        <h3>${item.name}</h3>
        <p>Danh mục: ${item.category}</p>
        <p>Giá: ${item.price.toLocaleString("vi-VN")}đ</p>
      </div>
      <div class="cart-actions">
        <div class="qty-box">
          <button onclick="decreaseQty(${item.id})">-</button>
          <span>${item.quantity}</span>
          <button onclick="increaseQty(${item.id})">+</button>
        </div>
        <p class="item-total">${(item.price * item.quantity).toLocaleString("vi-VN")}đ</p>
        <button class="remove-btn" onclick="removeItem(${item.id})">Xóa</button>
      </div>
    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartSummary.innerHTML = `
    <h3>Tóm tắt đơn hàng</h3>
    <p>Số sản phẩm: ${cart.length}</p>
    <p class="summary-total">Tổng tiền: ${total.toLocaleString("vi-VN")}đ</p>
    <button class="checkout-btn" onclick="goCheckout()">Thanh toán</button>
  `;
}

function goCheckout() {
  alert("Bạn có thể làm tiếp trang checkout sau.");
}