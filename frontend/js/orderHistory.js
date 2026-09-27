const userId = localStorage.getItem("userId");
const orderList = document.getElementById("orderList");

const TRACK_STEPS = ["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"];

async function loadOrders() {
  const res = await fetch(`/api/order/user/${userId}`);
  const orders = await res.json();

  if (!Array.isArray(orders) || orders.length === 0) {
    orderList.innerHTML = "<p style='text-align:center;'>No orders yet</p>";
    return;
  }

  orderList.innerHTML = "";

  orders.forEach(order => {
    let itemsHTML = "";
    let total = order.totalAmount;

    order.items.forEach(item => {
      itemsHTML += `
        <div class="order-item">
          <span>${item.productId.name} × ${item.quantity}</span>
        </div>
      `;
    });

    orderList.innerHTML += `
      <div class="order-box">
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        ${itemsHTML}
        <p><strong>Total:</strong> ₹${total}</p>
        <p><strong>Payment Method:</strong>${order.paymentMethod}</p>
        ${renderTracking(order.status)}
      </div>
    `;
  });
}

// ---------- tracking timeline ----------
function renderTracking(status) {
  if (status === "Cancelled") {
    return `
      <div class="tracking">
        <div class="track-step cancelled">
          <div class="dot">✕</div>
          <small>Order Cancelled</small>
        </div>
      </div>`;
  }

  const currentIndex = TRACK_STEPS.indexOf(status);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const progressPercent = (safeIndex / (TRACK_STEPS.length - 1)) * 100;

  const steps = TRACK_STEPS.map((step, i) => {
    const icon = i <= safeIndex ? "✔" : "";
    const label =
      step === "Out for Delivery" ? "Out for<br>Delivery" : step;
    return `
      <div class="track-step ${i <= safeIndex ? "done" : ""}">
        <div class="dot">${icon}</div>
        <small>${label}</small>
      </div>`;
  }).join("");

  return `
    <div class="tracking">
      <div class="progress-line" style="width:${progressPercent * 0.88}%;"></div>
      ${steps}
    </div>
    <p style="text-align:center;margin:4px 0 0;color:#e0561d;font-size:13px;">
      Current status: <b>${status}</b>
    </p>`;
}

loadOrders();
