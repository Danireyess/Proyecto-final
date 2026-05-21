const API_URL = "http://localhost:3000/api";

/*Mapeo de Fotos usando Unsplash*/
const PRODUCT_IMAGES = {
  1:  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=800&fit=crop&q=80",
  3:  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop&q=80",
  4:  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop&q=80",
  5:  "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=800&fit=crop&q=80",
  6:  "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&h=800&fit=crop&q=80",
  23: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&h=800&fit=crop&q=80",
  24: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop&q=80",
  7:  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop&q=80",
  8:  "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop&q=80",
  9:  "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&h=800&fit=crop&q=80",
  10: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop&q=80",
  11: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&h=800&fit=crop&q=80",
  12: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&h=800&fit=crop&q=80",
  13: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&h=800&fit=crop&q=80",
  14: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&h=800&fit=crop&q=80",
  15: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&h=800&fit=crop&q=80",
  16: "https://images.unsplash.com/photo-1547393429-37e4e6b834c9?w=600&h=800&fit=crop&q=80",
  17: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=800&fit=crop&q=80",
  18: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=800&fit=crop&q=80",
  19: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=800&fit=crop&q=80",
  20: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=800&fit=crop&q=80",
  21: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=800&fit=crop&q=80",
};

// Catálogo dinámico global cargado desde la base de datos
let PRODUCTS = [];

/* Estado global*/
let cart = JSON.parse(localStorage.getItem("bluey_cart")) || [];
let currentUser = JSON.parse(localStorage.getItem("bluey_session")) || null;
let activeCategory = "all";

function saveCart() { localStorage.setItem("bluey_cart", JSON.stringify(cart)); }
function saveSession() { localStorage.setItem("bluey_session", JSON.stringify(currentUser)); }

function getImg(p) {
  return PRODUCT_IMAGES[p.id] || `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=800&fit=crop&q=80`;
}

//CONSULTAR TODOS LOS ARTÍCULOS DESDE LA DB 
async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/productos`);
    PRODUCTS = await res.json();
    updateCartCount();
  } catch (err) {
    console.error("Error consultando catálogo:", err);
  }
}

//Roles
function showSection(id) {
  document.querySelectorAll(".view-section").forEach(s => s.style.display = "none");
  const target = document.getElementById(id);
  if (target) target.style.display = "block";
  window.scrollTo(0, 0);
  
  if (id === "home") renderHome();
  if (id === "catalog") renderCatalog(activeCategory);
  if (id === "cart") renderCart();
  if (id === "orders") renderOrders();
  if (id === "admin-dashboard") renderAdminDashboard();
}

// Adapta visualmente la pantalla según el rol de la cuenta activa
function applyRoleUILayout() {
  const navAdmin = document.getElementById("nav-admin");
  const btnCartNav = document.getElementById("btn-cart-nav");
  const btnOrdersNav = document.getElementById("btn-orders-nav");
  const ordersTitle = document.getElementById("orders-title");
  const thCliente = document.getElementById("th-cliente");

  if (currentUser && currentUser.rol === "admin") {
    // Modo Administrador
    if (navAdmin) navAdmin.style.display = "inline-block";
    if (btnCartNav) btnCartNav.style.display = "none"; // Un admin no compra prendas
    if (btnOrdersNav) btnOrdersNav.textContent = "VER PEDIDOS GLOBALES";
    if (ordersTitle) ordersTitle.textContent = "HISTORIAL GLOBAL DE VENTAS";
    if (thCliente) thCliente.style.display = "table-cell";
  } else {
    // Modo Cliente o Invitado
    if (navAdmin) navAdmin.style.display = "none";
    if (btnCartNav) btnCartNav.style.display = "inline-block";
    if (btnOrdersNav) btnOrdersNav.textContent = "MIS PEDIDOS";
    if (ordersTitle) ordersTitle.textContent = "MIS COMPRAS";
    if (thCliente) thCliente.style.display = "none";
  }
  updateAuthUI();
}

function handleSessionBtn() { currentUser ? logout() : showSection("login"); }

function updateAuthUI() {
  const btn = document.getElementById("btn-session");
  if (btn) btn.textContent = currentUser ? "CERRAR SESIÓN" : "INICIAR SESIÓN";
}


//catalogo
function renderHome() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;
  const categories = ["mujer", "hombre", "niños", "beauty"];
  const featured = categories.flatMap(cat =>
    PRODUCTS.filter(p => p.category === cat).slice(0, 2)
  );
  grid.innerHTML = featured.map(p => productCardHTML(p)).join("");
}

function renderCatalog(category = "all", query = "") {
  activeCategory = category;
  const grid = document.getElementById("products-grid");
  const countEl = document.getElementById("results-count");
  if (!grid) return;

  const filtered = PRODUCTS.filter(p => {
    const matchCat = category === "all" || p.category === category;
    const matchQuery = p.nombre.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });

  if (countEl) countEl.textContent = `PRODUCTOS (${filtered.length})`;
  grid.innerHTML = filtered.map(p => productCardHTML(p)).join("");
}

function filterByCategory(cat) {
  activeCategory = cat;
  showSection("catalog");
}

function productCardHTML(p) {
  // Si es administrador ocultamos el botón añadir
  const actionButton = (currentUser && currentUser.rol === 'admin') 
    ? `<span style="font-size:9px; color:red; font-weight:600;">VISTA ADMIN</span>`
    : `<button class="add-quick" onclick="addToCart(${p.id})">AÑADIR</button>`;

  return `
    <article class="product-card">
      <div class="product-image">
        <img src="${getImg(p)}" alt="${p.nombre}" loading="lazy"
             onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=800&fit=crop&q=80'">
        <div style="position:absolute; bottom:15px; left:15px; right:15px; text-align:center;">
             ${actionButton}
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.nombre}</h3>
        <span class="product-price">${formatPrice(parseFloat(p.precio))}</span>
      </div>
    </article>`;
}

//carrito
function addToCart(productId) {
  if (currentUser && currentUser.rol === 'admin') {
    showToast("Los administradores no manejan carritos.");
    return;
  }
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(i => i.id === productId);
  existing ? existing.qty++ : cart.push({ id: product.id, name: product.nombre, price: parseFloat(product.precio), qty: 1 });
  saveCart(); updateCartCount();
  showToast(`${product.nombre} añadido a la cesta`);
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart(); updateCartCount(); renderCart();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(productId); return; }
  saveCart(); renderCart();
}

function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (el) el.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
}

function renderCart() {
  const listEl = document.getElementById("cart-items-list");
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");
  if (!listEl) return;

  if (!cart.length) {
    listEl.innerHTML = `<p style="padding:40px 0;color:var(--gray-500);letter-spacing:.08em;font-size:12px;">Tu cesta está vacía.</p>`;
    if (subtotalEl) subtotalEl.textContent = "0,00 MXN";
    if (totalEl) totalEl.textContent = "0,00 MXN";
    return;
  }

  listEl.innerHTML = cart.map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    const imgUrl = product ? getImg(product) : "";
    return `
    <div class="cart-item">
      <div class="item-img" style="background-image:url('${imgUrl}');background-size:cover;background-position:center top;"></div>
      <div class="item-details">
        <div class="item-header">
          <h4>${item.name}</h4>
          <button class="remove-item" onclick="removeFromCart(${item.id})">ELIMINAR</button>
        </div>
        <p class="item-ref">REF. ${String(item.id).padStart(4,"0")}/001</p>
        <div class="item-controls">
          <div class="qty-selector">
            <button onclick="changeQty(${item.id}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${item.id}, +1)">+</button>
          </div>
          <span class="item-price">${formatPrice(item.price * item.qty)}</span>
        </div>
      </div>
    </div>`;
  }).join("");

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

//PROCESAR COMPRA HACIA LA BASE DE DATOS
async function checkout() {
  if (!currentUser) { showToast("Inicia sesión para tramitar tu pedido"); showSection("login"); return; }
  if (!cart.length) { showToast("Tu cesta está vacía"); return; }
  
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const payload = {
    referencia: `#${100000 + Math.floor(Math.random() * 900000)}`,
    usuario_id: currentUser.id,
    fecha: new Date().toLocaleDateString("es-MX"),
    total: subtotal,
    items: cart
  };

  try {
    const res = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      cart = []; saveCart(); updateCartCount();
      showToast("¡Pedido tramitado correctamente en MySQL!");
      showSection("orders");
    } else {
      showToast("Hubo un error guardando tu compra.");
    }
  } catch (err) {
    console.error(err);
  }
}

//autenticar lo de la cuenta
async function handleLogin(e) {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const password = e.target.password.value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      currentUser = await res.json();
      saveSession();
      applyRoleUILayout();
      showToast(`Acceso exitoso [${currentUser.rol.toUpperCase()}]: ${currentUser.nombre}`);
      showSection("home");
    } else {
      const errData = await res.json();
      showToast(errData.message || "Correo o contraseña incorrectos");
    }
  } catch (err) {
    console.error(err);
    showToast("Error de conexión con el servidor backend");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const nombre = e.target.nombre.value.trim();
  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  const direccion = e.target.direccion?.value.trim() || "";
  const rol = document.getElementById("register-rol").value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, direccion, rol })
    });

    if (res.ok) {
      currentUser = await res.json();
      saveSession();
      applyRoleUILayout();
      showToast(`Cuenta Creada. Rol: ${currentUser.rol.toUpperCase()}`);
      showSection("home");
    } else {
      const errData = await res.json();
      showToast(errData.message || "No se pudo registrar la cuenta");
    }
  } catch (err) {
    console.error(err);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("bluey_session");
  applyRoleUILayout(); 
  showToast("Sesión cerrada"); 
  showSection("home");
}

//historial de pedidos
async function renderOrders() {
  const tbody = document.getElementById("orders-tbody");
  if (!tbody) return;
  
  if (!currentUser) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:32px 16px;color:var(--gray-500);font-size:12px;">Inicia sesión para auditar registros.</td></tr>`;
    return;
  }

  try {
    // El servidor filtrará por id si es cliente, o traerá todo si es admin
    const res = await fetch(`${API_URL}/pedidos?usuario_id=${currentUser.id}&rol=${currentUser.rol}`);
    const orders = await res.json();

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:32px 16px;color:var(--gray-500);font-size:12px;">Sin registros que mostrar en el historial.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>${o.referencia}</td>
        ${currentUser.rol === 'admin' ? `<td style="font-weight:600; color:#555;">${o.cliente_nombre}</td>` : ''}
        <td>${o.fecha}</td>
        <td><span style="color:#2ecc71; font-weight:600;">${o.status}</span></td>
        <td>${formatPrice(parseFloat(o.total))}</td>
        <td><button class="btn-link" onclick="showOrderDetail(${o.id}, '${o.referencia}')">VER DISGLOSE</button></td>
      </tr>`).join("");
  } catch (err) {
    console.error(err);
  }
}

async function showOrderDetail(dbPedidoId, userRef) {
  try {
    const res = await fetch(`${API_URL}/pedidos/${dbPedidoId}/detalles`);
    const details = await res.json();
    
    const productLines = details.map(i => `• ${i.nombre} × ${i.cantidad} — ${formatPrice(parseFloat(i.precio_unitario) * i.cantidad)}`).join("\n");
    alert(`Pedido Ref: ${userRef}\n\nEstructura del Pedido:\n${productLines}`);
  } catch (err) {
    console.error(err);
  }
}

//interfaz de admin
function renderAdminDashboard() {
  const tbody = document.getElementById("admin-products-tbody");
  if (!tbody) return;

  tbody.innerHTML = PRODUCTS.map(p => `
    <tr>
      <td>${p.id}</td>
      <td style="text-transform: uppercase; font-size:10px; color:#7a7a7a;">${p.category}</td>
      <td style="font-weight: 500;">${p.nombre}</td>
      <td>${formatPrice(parseFloat(p.precio))}</td>
      <td>
        <button style="background:none; border:none; color:red; cursor:pointer; font-size:10px; letter-spacing:0.05em;" onclick="deleteProductFromAdmin(${p.id})">ELIMINAR</button>
      </td>
    </tr>
  `).join("");
}

async function handleAdminAddProduct(e) {
  e.preventDefault();
  const nombre = document.getElementById("admin-p-name").value.trim().toUpperCase();
  const precio = parseFloat(document.getElementById("admin-p-price").value);
  const categoria = document.getElementById("admin-p-category").value;

  try {
    const res = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, precio, categoria })
    });

    if (res.ok) {
      showToast("Artículo agregado al inventario MySQL");
      document.getElementById("admin-add-product-form").reset();
      await fetchProducts(); // Recargar datos locales
      renderAdminDashboard();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteProductFromAdmin(id) {
  if (!confirm("¿Está seguro de que desea eliminar este artículo permanentemente de MySQL?")) return;
  try {
    const res = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast("Artículo borrado satisfactoriamente");
      await fetchProducts();
      renderAdminDashboard();
    }
  } catch (err) {
    console.error(err);
  }
}

//Buscador
function initSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;
  input.addEventListener("input", () => {
    if (document.getElementById("catalog")?.style.display !== "none")
      renderCatalog(activeCategory, input.value);
  });
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { showSection("catalog"); renderCatalog(activeCategory, input.value); }
  });
}

function formatPrice(n) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2 }) + " MXN";
}

let toastTimer;
function showToast(msg) {
  let t = document.getElementById("bluey-toast");
  if (!t) {
    t = document.createElement("div"); t.id = "bluey-toast";
    Object.assign(t.style, {
      position:"fixed", bottom:"32px", left:"50%",
      transform:"translateX(-50%) translateY(20px)",
      background:"#0a0a0a", color:"#fff",
      padding:"14px 28px", fontSize:"11px", letterSpacing:"0.1em",
      opacity:"0", transition:"opacity .3s ease, transform .3s ease",
      pointerEvents:"none", zIndex:"9999", whiteSpace:"nowrap",
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1"; t.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.opacity = "0"; t.style.transform = "translateX(-50%) translateY(20px)";
  }, 2800);
}

window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("login-form")?.addEventListener("submit", handleLogin);
  document.getElementById("register-form")?.addEventListener("submit", handleRegister);
  document.getElementById("admin-add-product-form")?.addEventListener("submit", handleAdminAddProduct);
  
  initSearch(); 
  await fetchProducts(); // Cargar productos desde base de datos antes de pintar
  applyRoleUILayout();   // Validar si existía sesión abierta en localStorage
  showSection("home");
});