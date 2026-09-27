const container = document.getElementById("products");
const filterButtons = document.querySelectorAll(".filter-btn");

let allProducts = [];

function renderProducts(products) {
    container.innerHTML = "";

    products.forEach(product => {
        container.innerHTML += `
      <div class="productCard">
        <div class="productImage">
          <img src="${product.img}" alt="">
        </div>
        <div class="productName">${product.name}</div>
        <div class="productCharacteristic">${product.characteristic}</div>
        <div class="productPrice">${product.price}</div>
        <div class="productAddToCartBtn" onclick="addToCart('${product._id}')">
          <button>Add to Cart</button>
        </div>
      </div>
    `;
    });
}

// fetch products
fetch("/api/products")
    .then(res => res.json())
    .then(products => {
        allProducts = products;
        console.log(allProducts);

        renderProducts(allProducts);
    });

// filter logic
filterButtons.forEach(button => {
    button.addEventListener("click", () => {

        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        const category = button.dataset.category;

        if (category === "all") {
            renderProducts(allProducts);
        } else {
            const filtered = allProducts.filter(
                product => product.category === category
            );
            renderProducts(filtered);
        }
    });
});


//add to cart
async function addToCart(productId) {

  const userId = localStorage.getItem("userId");

  if (!userId) {
    showToast("Please login to add items to cart");
    return;
  }

  await fetch("/api/cart/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId })
  });

  showToast("Added to cart 🛒");
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
