const userId = localStorage.getItem("userId");
const summaryItems = document.getElementById("summaryItems");
const totalAmountEl = document.getElementById("totalAmount");

async function loadSummary() {
  const res = await fetch(`/api/cart/${userId}`);
  const items = await res.json();

  let total = 0;
  summaryItems.innerHTML = "";

  items.forEach(item => {
    const product = item.productId;
    const qty = item.quantity;
    const price = Number(product.price.replace("₹", "").replace("$", ""));
    const itemTotal = price * qty;

    total += itemTotal;

    summaryItems.innerHTML += `
      <p>
        <b>${product.name}:</b>${qty} — ₹${itemTotal}
      </p>
    `;
  });

  totalAmountEl.textContent = total;
}

loadSummary();

async function placeOrder() {
  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const city = document.getElementById("city").value.trim();
  const pincode = document.getElementById("pincode").value.trim();

  if (!fullName || !phone || !address || !city || !pincode) {
    showToast("Please fill all delivery details");
    return;
  }

  const userId = localStorage.getItem("userId");

  const shippingAddress = { fullName, phone, address, city, pincode };

  const paymentText = document.querySelector(
    'input[name="payment"]:checked'
  ).parentElement.innerText;

  if (!paymentText.includes("Cash")) {
    showToast("Online payment coming soon!");
    return;
  }

  try {
    const res = await fetch("/api/order/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, shippingAddress })
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Order placed 🎉 Confirmation email sent 📧");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);
    } else {
      showToast(data.message || "Order failed");
    }

  } catch (err) {
    showToast("Server error. Try again!");
  }
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
