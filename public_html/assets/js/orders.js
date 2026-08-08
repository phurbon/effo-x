(async function () {
  try {
    await Auth0Client.getClient();
    const authed = await Auth0Client.isAuthenticated();
    if (!authed) return;

    const token = await Auth0Client.getToken();
    const response = await fetch('api/orders_list.php', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const tableBody = document.querySelector('[data-orders-body]');
    const countEls = document.querySelectorAll('[data-orders-count]');
    if (!tableBody) return;

    if (!response.ok) {
      tableBody.innerHTML = '<tr><td colspan="3">Unable to load orders.</td></tr>';
      countEls.forEach((el) => { el.textContent = '0'; });
      return;
    }

    const orders = await response.json();
    if (!orders.length) {
      tableBody.innerHTML = '<tr><td colspan="3">No orders yet.</td></tr>';
      countEls.forEach((el) => { el.textContent = '0'; });
      return;
    }

    countEls.forEach((el) => { el.textContent = String(orders.length); });
    tableBody.innerHTML = orders.map(order => {
      const date = order.created_at ? new Date(order.created_at).toLocaleString() : '—';
      const amount = order.amount ? `$${Number(order.amount).toFixed(2)}` : '—';
      const id = order.order_id || '—';
      return `<tr><td data-label="Date">${date}</td><td data-label="Amount">${amount}</td><td data-label="Order ID">${id}</td></tr>`;
    }).join('');
  } catch (err) {
    console.error('Orders load failed:', err);
  }
})();
