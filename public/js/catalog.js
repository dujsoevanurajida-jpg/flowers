let PRODUCTS = [], filter = 'all';

function renderProducts() {
  const box = $('#products');
  if (!box) return;
  const list = PRODUCTS.filter(p => filter === 'all' || p.category === filter);
  box.innerHTML = list.map((p, i) => `
    <article class="card rise" style="--i:${i}">
      <div class="img-box">
        <img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy"
             onerror="this.style.display='none'">
      </div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p class="muted">${esc(p.description)}</p>
        <div class="card-row">
          <span class="price">${money(p.price)}</span>
          <button class="btn-add" data-id="${p.id}">В корзину</button>
        </div>
      </div>
    </article>`).join('') || '<p class="muted">В этой категории пока пусто.</p>';
}

$('#filters')?.addEventListener('click', e => {
  const btn = e.target.closest('.chip'); if (!btn) return;
  filter = btn.dataset.cat;
  document.querySelectorAll('.chip').forEach(b => b.classList.toggle('active', b === btn));
  renderProducts();
});

$('#products')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-id]'); if (!btn) return;
  addToCart(PRODUCTS.find(p => p.id == btn.dataset.id));
});

fetch('/api/products')
  .then(r => r.json())
  .then(data => { PRODUCTS = data; renderProducts(); })
  .catch(err => console.error('Ошибка загрузки товаров:', err));