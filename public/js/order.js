function renderCart() {
  const box = $('#cart-list');
  if (!cart.length) {
    box.innerHTML = '<p class="muted">Корзина пуста. <a href="catalog.html">Выберите букет в каталоге →</a></p>';
  } else {
    box.innerHTML = cart.map(i => `
      <div class="cart-row">
        <img class="thumb" src="${esc(i.image_url)}" alt=""
             onerror="this.style.display='none'">
        <div class="c-name">${esc(i.name)}</div>
        <div class="c-qty">
          <button data-q="${i.id}" data-d="-1">−</button>
          <span>${i.qty}</span>
          <button data-q="${i.id}" data-d="1">+</button>
        </div>
        <div class="c-price">${money(i.price * i.qty)}</div>
        <button class="c-del" data-del="${i.id}" aria-label="Удалить">✕</button>
      </div>`).join('');
  }
  $('#sum').textContent = money(cartTotal());
  renderBadge();
}

$('#cart-list').addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), d = e.target.closest('[data-del]');
  if (q) {
    const it = cart.find(i => i.id == q.dataset.q);
    it.qty += +q.dataset.d;
    if (it.qty <= 0) cart = cart.filter(i => i.id != q.dataset.q);
    saveCart(); renderCart();
  }
  if (d) {
    cart = cart.filter(i => i.id != d.dataset.del);
    saveCart(); renderCart();
  }
});

$('#phone').addEventListener('input', e => {
  let d = e.target.value.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
  if (!d.startsWith('7')) d = '7' + d;
  let s = '+7';
  if (d.length > 1) s += ' (' + d.slice(1, 4);
  if (d.length >= 4) s += ') ' + d.slice(4, 7);
  if (d.length >= 7) s += '-' + d.slice(7, 9);
  if (d.length >= 9) s += '-' + d.slice(9, 11);
  e.target.value = s;
});

$('#order-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!cart.length) return toast('Сначала добавьте букет в корзину');

  const btn = $('#submit-btn');
  btn.disabled = true; btn.textContent = 'Отправляем…';

  const f = new FormData(e.target);
  const body = {
    name: f.get('name'), phone: f.get('phone'), address: f.get('address'),
    delivery_date: f.get('delivery_date'), delivery_time: f.get('delivery_time'),
    contact_method: f.get('contact_method'),
    items: cart.map(i => ({ id: i.id, qty: i.qty }))
  };

  try {
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);

    cart = []; saveCart(); renderCart();
    e.target.reset();
    btn.disabled = false; btn.textContent = 'Отправить заказ';

    document.getElementById('order-number').textContent = data.id;
    const modal = document.getElementById('success-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } catch (err) {
    toast('Ошибка: ' + err.message);
    btn.disabled = false; btn.textContent = 'Отправить заказ';
  }
});

document.getElementById('close-modal').onclick = () => {
  const modal = document.getElementById('success-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

renderCart();