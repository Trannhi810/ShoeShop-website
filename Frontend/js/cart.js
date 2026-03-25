// Hàm dùng chung nếu cần gọi từ các trang không có inline script
async function addToCartAPI(variantId, quantity = 1) {
    const currentUser = JSON.parse(localStorage.getItem("shoeshop_user"));
    if (!currentUser) {
        alert("Vui lòng đăng nhập để thêm vào giỏ hàng");
        window.location.href = "/Frontend/pages/auth.html";
        return;
    }
    try {
        await cartApi.addToCart(variantId, quantity);
        alert("Đã thêm sản phẩm vào giỏ hàng");
    } catch (error) {
        alert("Lỗi khi thêm vào giỏ hàng: " + error.message);
    }
}