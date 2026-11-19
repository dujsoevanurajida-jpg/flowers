const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => n.toLocaleString('ru-RU') + ' ₽';

let cart = [];
try { cart = JSON.parse(localStorage.getItem('bloom-cart')) || []; } catch { cart = []; }

const saveCart = () => localStorage.setItem('bloom-cart', JSON.stringify(cart));
const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);
const cartTotal = () => cart.reduce((s, i) => s + i.price * i.qty, 0);

function renderBadge() {
  const b = $('#cart-count');
  if (b) b.textContent = cartCount();
}

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = 1;
  clearTimeout(toast.id);
  toast.id = setTimeout(() => t.style.opacity = 0, 2200);
}

function addToCart(p) {
  if (!p) return;
  const item = cart.find(i => i.id === p.id);
  item ? item.qty++ : cart.push({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
    qty: 1
  });
  saveCart();
  renderBadge();
  toast(`«${p.name}» в корзине`);
}

document.addEventListener('DOMContentLoaded', () => renderBadge());
renderBadge();