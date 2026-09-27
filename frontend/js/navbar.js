const navUserId = localStorage.getItem("userId");
const navUserName = localStorage.getItem("userName");
const navUserRole = localStorage.getItem("role");

const userMenu = document.getElementById("userMenu");
const loginLink = document.getElementById("loginLink");
const cartItem = document.getElementById("cartItem");

if (userMenu && loginLink && cartItem) {

  if (navUserId) {
    userMenu.style.display = "block";
    loginLink.style.display = "none";
    cartItem.style.display = "block";

    document.getElementById("userName").textContent = navUserName;

    // show dashboard link for admins only
    const dashboardLink = document.getElementById("dashboardLink");
    if (dashboardLink && navUserRole === "admin") {
      dashboardLink.style.display = "block";
    }

  } else {
    userMenu.style.display = "none";
    loginLink.style.display = "block";
    cartItem.style.display = "none";   // 🔥 hide cart
  }
}


function toggleDropdown() {
  const menu = document.getElementById("dropdownMenu");
  if (menu) {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }
}

// logout function
function logout() {
  localStorage.clear();

  showToast("Logged out successfully 👋");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1200);
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
