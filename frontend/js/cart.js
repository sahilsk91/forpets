const userId = localStorage.getItem("userId");
const cartList = document.getElementById("cartList");
const grandTotalEl = document.getElementById("grandTotal");

function renderCart(items) {
  cartList.innerHTML = "";
  let grandTotal = 0;

  items.forEach(item => {
    const product = item.productId;
    const qty = item.quantity;
    const price = Number(product.price.replace("$", "").replace("₹", ""));
    const total = price * qty;

    grandTotal += total;

    cartList.innerHTML += `
  <div class="cart-row">
    <div>${product.name}</div>
    <div>₹${price}</div>
    <div class="quantity">
      <button onclick="updateQuantity('${product._id}', 'decrease')">-</button>
      ${qty}
      <button onclick="updateQuantity('${product._id}', 'increase')">+</button>
    </div>
    <div>₹${total}</div>
    <div>
      <button class="cart-remove-btn"
        onclick="removeFromCart('${product._id}')">
        Remove
      </button>
    </div>
  </div>
`;

  });

  grandTotalEl.textContent = grandTotal;
}

async function loadCart() {
  const userId = localStorage.getItem("userId");
  const res = await fetch(`/api/cart/${userId}`);
  const items = await res.json();
  renderCart(items);
}

loadCart();


async function removeFromCart(productId) {
  const userId = localStorage.getItem("userId");

  await fetch("/api/cart/remove", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId })
  });

  // 🔁 Always reload cart from backend
  loadCart();
}

// update quantity
async function updateQuantity(productId, action) {
  const userId = localStorage.getItem("userId");

  const res = await fetch("/api/cart/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, action })
  });

  const updatedItems = await res.json();

  renderCart(updatedItems);  // 🔁 re-render
}

// go to checkout page 
async function goToCheckout() {
  const userId = localStorage.getItem("userId");

  const res = await fetch(`/api/cart/${userId}`);
  const items = await res.json();

  if (!items || items.length === 0) {
    showToast("Your cart is empty 🛒");
    return;
  }

  window.location.href = "checkout.html";
}

// toast message
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
