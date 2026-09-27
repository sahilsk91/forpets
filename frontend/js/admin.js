const adminUserId = localStorage.getItem("userId");
const API = "/api/admin";

let topProductsChart = null;
let revenueChart = null;

// ---------- load everything ----------
async function loadDashboard() {
  if (!adminUserId) {
    showToast("Please login first");
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return;
  }

  try {
    const res = await fetch(`${API}/stats?userId=${adminUserId}`);
    if (res.status === 403) {
      document.getElementById("dashboardApp").innerHTML =
        "<p style='text-align:center;color:#e0561d;font-size:18px;'>⛔ Admin access only</p>";
      return;
    }
    const stats = await res.json();

    renderStatCards(stats);
    renderHotSelling(stats.hotSelling);
    renderTopProductsChart(stats.topProducts);
    renderRevenueChart(stats.dailyRevenue);
    renderOrdersTable(stats.recentOrders);
  } catch (err) {
    showToast("Failed to load dashboard");
  }
}

// ---------- summary cards ----------
function renderStatCards(stats) {
  const cards = [
    { value: stats.totalOrders, label: "Total Orders" },
    { value: `₹${stats.totalRevenue}`, label: "Total Revenue" },
    { value: stats.totalCustomers, label: "Customers" },
    { value: stats.statusCounts.Delivered || 0, label: "Delivered" },
  ];

  document.getElementById("statCards").innerHTML = cards
    .map(
      (c) => `
      <div class="stat-card">
        <h2>${c.value}</h2>
        <p>${c.label}</p>
      </div>`
    )
    .join("");
}

// ---------- hot selling ----------
function renderHotSelling(hotSelling) {
  const card = document.getElementById("hotSellingCard");
  const list = document.getElementById("hotSellingList");

  if (!hotSelling || hotSelling.length === 0) {
    card.style.display = "none";
    return;
  }

  card.style.display = "block";
  list.innerHTML = hotSelling
    .map(
      (p) =>
        `<span class="hot-badge">🔥 ${p.name} — ${p.quantitySold} sold</span>`
    )
    .join("");
}

// ---------- charts ----------
function renderTopProductsChart(topProducts) {
  const ctx = document.getElementById("topProductsChart");
  if (!topProducts || topProducts.length === 0) {
    ctx.replaceWith(
      Object.assign(document.createElement("p"), {
        textContent: "No sales yet — place some orders to see data.",
      })
    );
    return;
  }

  const top5 = topProducts.slice(0, 5);

  if (topProductsChart) topProductsChart.destroy();
  topProductsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: top5.map((p) => p.name),
      datasets: [
        {
          label: "Units sold",
          data: top5.map((p) => p.quantitySold),
          backgroundColor: "#ff8c42",
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } },
    },
  });
}

function renderRevenueChart(dailyRevenue) {
  const ctx = document.getElementById("revenueChart");
  if (!dailyRevenue || dailyRevenue.length === 0) return;

  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dailyRevenue.map((d) => d.date),
      datasets: [
        {
          label: "Revenue (₹)",
          data: dailyRevenue.map((d) => d.revenue),
          borderColor: "#ff8c42",
          backgroundColor: "rgba(255,140,66,0.15)",
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: { plugins: { legend: { display: false } } },
  });
}

// ---------- orders table ----------
async function renderOrdersTable(orders) {
  const tbody = document.querySelector("#ordersTable tbody");
  const statuses = ["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

  tbody.innerHTML = "";

  for (const order of orders) {
    const customer = order.userId
      ? `${order.userId.name || ""} (${order.userId.email || ""})`
      : "Unknown";

    const items = order.items
      .map((i) => (i.productId ? `${i.productId.name} × ${i.quantity}` : ""))
      .filter(Boolean)
      .join("<br>");

    const addr = order.shippingAddress
      ? `${order.shippingAddress.fullName}, ${order.shippingAddress.city} — ${order.shippingAddress.pincode}<br>📞 ${order.shippingAddress.phone}`
      : "—";

    const options = statuses
      .map(
        (s) =>
          `<option value="${s}" ${s === order.status ? "selected" : ""}>${s}</option>`
      )
      .join("");

    tbody.innerHTML += `
      <tr>
        <td style="font-size:12px;">#${order._id}</td>
        <td>${customer}</td>
        <td>${items}</td>
        <td>₹${order.totalAmount}</td>
        <td style="font-size:12px;">${addr}</td>
        <td><b>${order.status}</b></td>
        <td>
          <select class="status-select" onchange="updateStatus('${order._id}', this)">
            ${options}
          </select>
        </td>
      </tr>`;
  }
}

// ---------- update status (sends email) ----------
async function updateStatus(orderId, selectEl) {
  const status = selectEl.value;

  try {
    const updateRes = await fetch(
      `/api/order/${orderId}/status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    const data = await updateRes.json();

    if (updateRes.ok) {
      selectEl.classList.add("saved");
      showToast(`Status updated → ${status} 📧 email sent`);
      setTimeout(() => selectEl.classList.remove("saved"), 2000);
    } else {
      showToast(data.message || "Update failed");
    }
  } catch (err) {
    showToast("Server error");
  }
}

// ---------- toast ----------
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

loadDashboard();
