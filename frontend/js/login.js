const API = "/api/auth";

// ===== Gmail Validation =====
function isValidGmail(email) {
  const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return gmailPattern.test(email);
}

// -------- LOGIN --------
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!isValidGmail(email)) {
    showToast("Enter a valid Gmail like: xyz@gmail.com");
    return;
  }

  try {
    const response = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Login failed");
      return;
    }

    // Save token and role
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("userId", data.user._id);
    localStorage.setItem("userName", data.user.name);

    showToast("Logged in Successfully");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200)

  } catch (err) {
    showToast("Server is not running. Start backend first!");
  }
}

// -------- REGISTER --------
async function register() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!isValidGmail(email)) {
    showToast("Enter a valid Gmail like: xyz@gmail.com");
    return;
  }

  try {
    const response = await fetch(API + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Registration failed");
      return;
    }

    showToast("Account created successfully! Please login");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (err) {
    showToast("Server is not running. Start backend first!");
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