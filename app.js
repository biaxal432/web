const SCRIPT_URL = 'https://script.google.com/macros/s/TU_SCRIPT_ID/exec'; 
// Reemplaza TU_SCRIPT_ID con el ID real de tu Apps Script publicado (URL de implementación web)

// Variables para sesiones simples (localStorage)
function saveSession(user) {
  localStorage.setItem('userSession', JSON.stringify(user));
}

function loadSession() {
  const user = localStorage.getItem('userSession');
  return user ? JSON.parse(user) : null;
}

function clearSession() {
  localStorage.removeItem('userSession');
}

function redirectToRolePage(role) {
  if (role === 'admin') window.location.href = 'admin.html';
  else if (role === 'employee') window.location.href = 'employee.html';
}

// ----------------------- LOGIN ---------------------------
if (document.getElementById('loginForm')) {
  const form = document.getElementById('loginForm');
  const errorDiv = document.getElementById('loginError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    if (!username || !password || !role) {
      errorDiv.textContent = 'Completa todos los campos.';
      return;
    }

    errorDiv.textContent = 'Validando...';

    try {
      const response = await fetch(`${SCRIPT_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&role=${role}`);
      const data = await response.json();

      if (data.success) {
        saveSession({ username, role });
        redirectToRolePage(role);
      } else {
        errorDiv.textContent = 'Usuario o contraseña incorrectos.';
      }
    } catch (err) {
      errorDiv.textContent = 'Error de conexión.';
    }
  });
}

// ----------------- LOGOUT ------------------
if (document.getElementById('logoutBtn')) {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}

// ---------------- ADMIN PANELES ----------------
if (document.body.classList.contains('admin-page') || document.title.includes('Administrador')) {
  const main = document.getElementById('adminMain');

  // Validar sesión
  const session = loadSession();
  if (!session || session.role !== 'admin') {
    alert('Acceso no autorizado');
    window.location.href = 'index.html';
  }

  // Botones menú
  document.getElementById('btnSucursales').addEventListener('click', () => loadSucursales());
  document.getElementById('btnEmpleados').addEventListener('click', () => loadEmpleados());
  document.getElementById('btnInventario').addEventListener('click', () => loadInventario());
  document.getElementById('btnVentas').addEventListener('click', () => loadVentas());
  document.getElementById('btnMermas').addEventListener('click', () => loadMermas());
  document.getElementById('btnReportes').addEventListener('click', () => loadReportes());

  // Carga inicial
  loadSucursales();

  // Funciones para cargar cada módulo
  async function loadSucursales() {
    main.innerHTML = '<h2>Sucursales</h2><div id="sucursalesContainer"></div><hr><h3>Agregar Sucursal</h3><form id="formAddSucursal"><input type="text" id="newSucursal" placeholder="Nombre sucursal" required /><button class="btn" type="submit">Agregar</button></form><div id="msgSucursales"></div>';

    const container = document.getElementById('sucursalesContainer');
    const form = document.getElementById('formAddSucursal');
    const msg = document.getElementById('msgSucursales');

    // Traer sucursales
    const res = await fetch(`${SCRIPT_URL}?action=getSucursales`);
    const data = await res.json();
    if (data.success) {
      if(data.sucursales.length === 0) container.textContent = 'No hay sucursales registradas.';
      else {
        const ul = document.createElement('ul');
        data.sucursales.forEach(s => {
          const li = document.createElement('li');
          li.textContent = s;
          ul.appendChild(li);
        });
        container.appendChild(ul);
      }
    } else container.textContent = 'Error al cargar sucursales.';

    form.onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('newSucursal').value.trim();
      if (!nombre) return;
      const resAdd = await fetch(`${SCRIPT_URL}?action=addSucursal&nombre=${encodeURIComponent(nombre)}`);
      const dAdd = await resAdd.json();
      if (dAdd.success) {
        msg.textContent = 'Sucursal agregada.';
        loadSucursales();
      } else {
        msg.textContent = 'Error al agregar sucursal.';
      }
    };
  }

  async function loadEmpleados() {
    main.innerHTML = `<h2>Empleados</h2>
      <div id="empleadosContainer"></div>
      <hr>
      <h3>Agregar Empleado</h3>
      <form id="formAddEmpleado">
        <input type="text" id="empNombre" placeholder="Nombre" required />
        <input type="text" id="empUsuario" placeholder="Usuario" required />
        <input type="password" id="empPass" placeholder="Contraseña" required />
        <select id="empRol" required>
          <option value="" disabled selected>Selecciona rol</option>
          <option value="admin">Administrador</option>
          <option value="employee">Empleado</option>
        </select>
        <select id="empSucursal" required>
          <option value="" disabled selected>Selecciona sucursal</option>
        </select>
        <button class="btn" type="submit">Agregar</button>
      </form>
      <div id="msgEmpleados"></div>`;

    const container = document.getElementById('empleadosContainer');
    const form = document.getElementById('formAddEmpleado');
    const msg = document.getElementById('msgEmpleados');

    // Cargar sucursales para select
    const resSuc = await fetch(`${SCRIPT_URL}?action=getSucursales`);
    const dataSuc = await resSuc.json();
    const sel = document.getElementById('empSucursal');
    sel.innerHTML = '<option value="" disabled selected>Selecciona sucursal</option>';
    if (dataSuc.success) {
      dataSuc.sucursales.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        sel.appendChild(o);
      });
    }

    // Cargar empleados
    const res = await fetch(`${SCRIPT_URL}?action=getEmpleados`);
    const data = await res.json();
    if (data.success) {
      if(data.empleados.length === 0) container.textContent = 'No hay empleados registrados.';
      else {
        const table = document.createElement('table');
        table.innerHTML = `<thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Sucursal</th></tr></thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');
        data.empleados.forEach(emp => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${emp.nombre}</td><td>${emp.usuario}</td><td>${emp.rol}</td><td>${emp.sucursal}</td>`;
          tbody.appendChild(tr);
        });
        container.appendChild(table);
      }
    } else container.textContent = 'Error al cargar empleados.';

    form.onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('empNombre').value.trim();
      const usuario = document.getElementById('empUsuario').value.trim();
      const password = document.getElementById('empPass').value.trim();
      const rol = document.getElementById('empRol').value;
      const sucursal = document.getElementById('empSucursal').value;
      if (!nombre || !usuario || !password || !rol || !sucursal) return;

      const resAdd = await fetch(`${SCRIPT_URL}?action=addEmpleado&nombre=${encodeURIComponent(nombre)}&usuario=${encodeURIComponent(usuario)}&password=${encodeURIComponent(password)}&rol=${rol}&sucursal=${encodeURIComponent(sucursal)}`);
      const dAdd = await resAdd.json();
      if (dAdd.success) {
        msg.textContent = 'Empleado agregado.';
        loadEmpleados();
      } else {
        msg.textContent = 'Error al agregar empleado.';
      }
    };
  }

  async function loadInventario() {
    main.innerHTML = `<h2>Inventario</h2>
      <div id="inventarioContainer"></div>
      <hr>
      <h3>Agregar Producto</h3>
      <form id="formAddProducto">
        <select id="productoSucursal" required></select>
        <input type="text" id="prodNombre" placeholder="Producto" required />
        <select id="prodUnidad" required>
          <option value="" disabled selected>Unidad de medida</option>
          <option value="kilo">Kilo</option>
          <option value="litro">Litro</option>
          <option value="pieza">Pieza</option>
        </select>
        <input type="number" id="prodCantidad" placeholder="Cantidad" min="0" step="any" required />
        <input type="number" id="prodPrecioCompra" placeholder="Precio compra" min="0" step="any" required />
        <input type="number" id="prodPrecioVenta" placeholder="Precio venta" min="0" step="any" required />
        <input type="number" id="prodStockMin" placeholder="Stock mínimo (opcional)" min="0" step="any" />
        <button class="btn" type="submit">Agregar Producto</button>
      </form>
      <div id="msgInventario"></div>`;

    const sucSelect = document.getElementById('productoSucursal');
    const container = document.getElementById('inventarioContainer');
    const form = document.getElementById('formAddProducto');
    const msg = document.getElementById('msgInventario');

    // Cargar sucursales
    const resSuc = await fetch(`${SCRIPT_URL}?action=getSucursales`);
    const dataSuc = await resSuc.json();
    sucSelect.innerHTML = '<option value="" disabled selected>Selecciona sucursal</option>';
    if (dataSuc.success) {
      dataSuc.sucursales.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        sucSelect.appendChild(o);
      });
    }

    // Cargar inventario
    async function fetchInventario() {
      container.innerHTML = 'Cargando inventario...';
      const resInv = await fetch(`${SCRIPT_URL}?action=getInventario`);
      const dataInv = await resInv.json();
      if (dataInv.success) {
        if(dataInv.inventario.length === 0) {
          container.textContent = 'No hay productos registrados.';
          return;
        }
        const table = document.createElement('table');
        table.innerHTML = `<thead>
          <tr>
            <th>Sucursal</th>
            <th>Producto</th>
            <th>Unidad</th>
            <th>Cantidad</th>
            <th>Precio Compra</th>
            <th>Precio Venta</th>
            <th>Stock Mínimo</th>
          </tr>
        </thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');
        dataInv.inventario.forEach(prod => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${prod.sucursal}</td>
            <td>${prod.producto}</td>
            <td>${prod.unidad}</td>
            <td>${prod.cantidad}</td>
            <td>$${prod.precioCompra.toFixed(2)}</td>
            <td>$${prod.precioVenta.toFixed(2)}</td>
            <td>${prod.stockMin !== '' ? prod.stockMin : '-'}</td>
          `;
          tbody.appendChild(tr);
        });
        container.innerHTML = '';
        container.appendChild(table);
      } else {
        container.textContent = 'Error cargando inventario.';
      }
    }

    fetchInventario();

    form.onsubmit = async (e) => {
      e.preventDefault();
      const sucursal = sucSelect.value;
      const producto = document.getElementById('prodNombre').value.trim();
      const unidad = document.getElementById('prodUnidad').value;
      const cantidad = parseFloat(document.getElementById('prodCantidad').value);
      const precioCompra = parseFloat(document.getElementById('prodPrecioCompra').value);
      const precioVenta = parseFloat(document.getElementById('prodPrecioVenta').value);
      const stockMin = document.getElementById('prodStockMin').value;

      if(!sucursal || !producto || !unidad || isNaN(cantidad) || isNaN(precioCompra) || isNaN(precioVenta)) {
        msg.textContent = 'Completa todos los campos obligatorios.';
        return;
      }

      const url = `${SCRIPT_URL}?action=addProducto&` +
        `sucursal=${encodeURIComponent(sucursal)}` +
        `&producto=${encodeURIComponent(producto)}` +
        `&unidad=${encodeURIComponent(unidad)}` +
        `&cantidad=${cantidad}` +
        `&precioCompra=${precioCompra}` +
        `&precioVenta=${precioVenta}` +
        `&stockMin=${encodeURIComponent(stockMin)}`;

      const resAdd = await fetch(url);
      const dAdd = await resAdd.json();
      if (dAdd.success) {
        msg.textContent = 'Producto agregado al inventario.';
        form.reset();
        fetchInventario();
      } else {
        msg.textContent = 'Error al agregar producto.';
      }
    };
  }

  async function loadVentas() {
    main.innerHTML = '<h2>Ventas Diarias</h2><div id="ventasContainer">Cargando...</div>';

    const container = document.getElementById('ventasContainer');
    const res = await fetch(`${SCRIPT_URL}?action=getVentas`);
    const data = await res.json();

    if (data.success) {
      if(data.ventas.length === 0) container.textContent = 'No hay ventas registradas.';
      else {
        const table = document.createElement('table');
        table.innerHTML = `<thead><tr><th>Sucursal</th><th>Empleado</th><th>Fecha</th><th>Cliente</th><th>Total</th></tr></thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');
        data.ventas.forEach(v => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${v.sucursal}</td>
            <td>${v.empleado}</td>
            <td>${v.fecha}</td>
            <td>${v.cliente || '-'}</td>
            <td>$${v.total.toFixed(2)}</td>`;
          tbody.appendChild(tr);
        });
        container.innerHTML = '';
        container.appendChild(table);
      }
    } else container.textContent = 'Error cargando ventas.';
  }

  async function loadMermas() {
    main.innerHTML = '<h2>Mermas</h2><div id="mermasContainer"></div><hr><h3>Registrar Merma</h3><form id="formAddMerma"><select id="mermaSucursal" required></select><input type="text" id="mermaProducto" placeholder="Producto" required /><input type="number" id="mermaCantidad" placeholder="Cantidad" min="0" step="any" required /><button class="btn" type="submit">Registrar Merma</button></form><div id="msgMermas"></div>';

    const sucSelect = document.getElementById('mermaSucursal');
    const container = document.getElementById('mermasContainer');
    const form = document.getElementById('formAddMerma');
    const msg = document.getElementById('msgMermas');

    // Cargar sucursales
    const resSuc = await fetch(`${SCRIPT_URL}?action=getSucursales`);
    const dataSuc = await resSuc.json();
    sucSelect.innerHTML = '<option value="" disabled selected>Selecciona sucursal</option>';
    if (dataSuc.success) {
      dataSuc.sucursales.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        sucSelect.appendChild(o);
      });
    }

    // Cargar mermas
    async function fetchMermas() {
      container.innerHTML = 'Cargando mermas...';
      const resMer = await fetch(`${SCRIPT_URL}?action=getMermas`);
      const dataMer = await resMer.json();
      if (dataMer.success) {
        if(dataMer.mermas.length === 0) {
          container.textContent = 'No hay mermas registradas.';
          return;
        }
        const table = document.createElement('table');
        table.innerHTML = `<thead><tr><th>Sucursal</th><th>Producto</th><th>Cantidad</th><th>Fecha</th></tr></thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');
        dataMer.mermas.forEach(m => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${m.sucursal}</td><td>${m.producto}</td><td>${m.cantidad}</td><td>${m.fecha}</td>`;
          tbody.appendChild(tr);
        });
        container.innerHTML = '';
        container.appendChild(table);
      } else {
        container.textContent = 'Error cargando mermas.';
      }
    }

    fetchMermas();

    form.onsubmit = async (e) => {
      e.preventDefault();
      const sucursal = sucSelect.value;
      const producto = document.getElementById('mermaProducto').value.trim();
      const cantidad = parseFloat(document.getElementById('mermaCantidad').value);

      if (!sucursal || !producto || isNaN(cantidad)) {
        msg.textContent = 'Completa todos los campos.';
        return;
      }

      const resAdd = await fetch(`${SCRIPT_URL}?action=addMerma&sucursal=${encodeURIComponent(sucursal)}&producto=${encodeURIComponent(producto)}&cantidad=${cantidad}`);
      const dAdd = await resAdd.json();

      if (dAdd.success) {
        msg.textContent = 'Merma registrada.';
        form.reset();
        fetchMermas();
      } else {
        msg.textContent = 'Error al registrar merma.';
      }
    };
  }

  async function loadReportes() {
    main.innerHTML = '<h2>Reportes de Ventas por Sucursal</h2><canvas id="chartVentas" width="900" height="400"></canvas>';

    // Usaremos Chart.js vía CDN para gráficas
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = cargarGrafica;
      document.head.appendChild(script);
    } else {
      cargarGrafica();
    }

    async function cargarGrafica() {
      const res = await fetch(`${SCRIPT_URL}?action=getVentas`);
      const data = await res.json();

      if (!data.success) {
        main.innerHTML += '<p>Error cargando datos para gráfica.</p>';
        return;
      }

      const ventas = data.ventas;
      const ventasPorSucursal = {};

      ventas.forEach(v => {
        ventasPorSucursal[v.sucursal] = (ventasPorSucursal[v.sucursal] || 0) + v.total;
      });

      const ctx = document.getElementById('chartVentas').getContext('2d');

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(ventasPorSucursal),
          datasets: [{
            label: 'Ventas Totales (MXN)',
            data: Object.values(ventasPorSucursal),
            backgroundColor: '#ff2d8f'
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: { labels: { color: '#ff2d8f' } }
          }
        }
      });
    }
  }
}

// ------------------ EMPLOYEE --------------------
if (document.body.classList.contains('employee-page') || document.title.includes('Ventas')) {
  const session = loadSession();
  if (!session || session.role !== 'employee') {
    alert('Acceso no autorizado');
    window.location.href = 'index.html';
  }

  // Variables de DOM
  const sucursalSelect = document.getElementById('sucursalSelect');
  const productosTableBody = document.querySelector('#productosTable tbody');
  const addProductoBtn = document.getElementById('addProductoBtn');
  const totalVentaSpan = document.getElementById('totalVenta');
  const ventaForm = document.getElementById('ventaForm');
  const ticketSection = document.getElementById('ticketSection');
  const ticketContent = document.getElementById('ticketContent');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });

  // Cargar sucursales para select
  async function cargarSucursales() {
    const res = await fetch(`${SCRIPT_URL}?action=getSucursales`);
    const data = await res.json();
    if (data.success) {
      sucursalSelect.innerHTML = '<option value="" disabled selected>Selecciona sucursal</option>';
      data.sucursales.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        sucursalSelect.appendChild(o);
      });
    }
  }

  cargarSucursales();

  // Productos en venta (lista temporal)
  let productosVenta = [];

  function renderProductos() {
    productosTableBody.innerHTML = '';
    let total = 0;

    productosVenta.forEach((prod, idx) => {
      const tr = document.createElement('tr');
      const totalProd = prod.cantidad * prod.precioUnitario;
      total += totalProd;
      tr.innerHTML = `
        <td>${prod.producto}</td>
        <td>${prod.cantidad} ${prod.unidad}</td>
        <td>$${prod.precioUnitario.toFixed(2)}</td>
        <td>$${totalProd.toFixed(2)}</td>
        <td><button data-index="${idx}" class="btn btn-remove">Quitar</button></td>
      `;
      productosTableBody.appendChild(tr);
    });

    totalVentaSpan.textContent = `$${total.toFixed(2)}`;
    // Controlar eventos quitar
    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.onclick = e => {
        const index = parseInt(e.target.dataset.index);
        productosVenta.splice(index, 1);
        renderProductos();
      };
    });
  }

  // Cargar productos de la sucursal seleccionada
  async function cargarProductosSucursal(sucursal) {
    const res = await fetch(`${SCRIPT_URL}?action=getInventario`);
    const data = await res.json();
    if (data.success) {
      const productosSucursal = data.inventario.filter(p => p.sucursal === sucursal);
      return productosSucursal;
    }
    return [];
  }

  // Actualizar tabla productos para venta
  sucursalSelect.onchange = async () => {
    productosVenta = [];
    renderProductos();
    const sucursal = sucursalSelect.value;
    if (!sucursal) return;
    const productos = await cargarProductosSucursal(sucursal);

    const tbody = document.getElementById('productosDisponiblesBody');
    tbody.innerHTML = '';
    productos.forEach(prod => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${prod.producto}</td>
        <td>${prod.unidad}</td>
        <td>$${prod.precioVenta.toFixed(2)}</td>
        <td><input type="number" min="0" max="${prod.cantidad}" step="any" value="0" data-producto="${prod.producto}" data-precio="${prod.precioVenta}" data-unidad="${prod.unidad}" /></td>
      `;
      tbody.appendChild(tr);
    });

    // Inputs para agregar producto
    tbody.querySelectorAll('input[type=number]').forEach(input => {
      input.oninput = () => {
        const val = parseFloat(input.value);
        if (isNaN(val) || val < 0) {
          input.value = 0;
          return;
        }
        const producto = input.dataset.producto;
        const precio = parseFloat(input.dataset.precio);
        const unidad = input.dataset.unidad;

        if (val === 0) {
          productosVenta = productosVenta.filter(p => p.producto !== producto);
        } else {
          const idx = productosVenta.findIndex(p => p.producto === producto);
          if (idx >= 0) {
            productosVenta[idx].cantidad = val;
          } else {
            productosVenta.push({ producto, cantidad: val, precioUnitario: precio, unidad });
          }
        }
        renderProductos();
      };
    });
  };

  // Enviar venta
  ventaForm.onsubmit = async (e) => {
    e.preventDefault();
    const sucursal = sucursalSelect.value;
    if (!sucursal) {
      alert('Selecciona sucursal');
      return;
    }
    if (productosVenta.length === 0) {
      alert('Agrega productos para vender');
      return;
    }
    // Validar cantidades > 0
    if (productosVenta.some(p => p.cantidad <= 0)) {
      alert('Cantidad inválida en productos');
      return;
    }

    // Datos adicionales
    const nombreCliente = document.getElementById('nombreCliente').value.trim();
    const domicilioCliente = document.getElementById('domicilioCliente').value.trim();

    const session = loadSession();

    // Preparar datos para enviar al servidor
    const ventaData = {
      sucursal,
      empleado: session.name,
      fecha: new Date().toISOString(),
      cliente: nombreCliente || '',
      domicilio: domicilioCliente || '',
      productos: productosVenta
    };

    const res = await fetch(`${SCRIPT_URL}?action=registrarVenta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ventaData)
    });
    const data = await res.json();
    if (data.success) {
      alert('Venta registrada correctamente');
      // Mostrar ticket
      mostrarTicket(ventaData);
      // Limpiar venta
      productosVenta = [];
      renderProductos();
      ventaForm.reset();
      sucursalSelect.value = '';
      document.getElementById('productosDisponiblesBody').innerHTML = '';
      totalVentaSpan.textContent = '$0.00';
    } else {
      alert('Error al registrar venta: ' + data.message);
    }
  };

  function mostrarTicket(venta) {
    let fechaHora = new Date(venta.fecha);
    let fechaStr = fechaHora.toLocaleDateString('es-MX');
    let horaStr = fechaHora.toLocaleTimeString('es-MX');

    let total = 0;
    let productosHtml = '';
    venta.productos.forEach(p => {
      const totalProd = p.cantidad * p.precioUnitario;
      total += totalProd;
      productosHtml += `<tr>
        <td>${p.producto}</td>
        <td>${p.cantidad} ${p.unidad}</td>
        <td>$${p.precioUnitario.toFixed(2)}</td>
        <td>$${totalProd.toFixed(2)}</td>
      </tr>`;
    });

    ticketContent.innerHTML = `
      <div class="ticket-header">
        <img src="logo.png" alt="Logo empresa" class="logo" />
        <h3>Nombre Empresa</h3>
        <p>Teléfono: 555-123-4567</p>
        <p>Datos fiscales: RFC XXXXXXXX</p>
      </div>
      <div class="ticket-info">
        <p><strong>Sucursal:</strong> ${venta.sucursal}</p>
        <p><strong>Fecha:</strong> ${fechaStr} ${horaStr}</p>
        <p><strong>Cliente:</strong> ${venta.cliente || '-'}</p>
        <p><strong>Domicilio:</strong> ${venta.domicilio || '-'}</p>
        <p><strong>Empleado:</strong> ${venta.empleado}</p>
      </div>
      <table class="ticket-table">
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unitario</th><th>Total</th></tr></thead>
        <tbody>${productosHtml}</tbody>
      </table>
      <div class="ticket-total"><strong>Total: $${total.toFixed(2)}</strong></div>
      <div class="ticket-footer">Le atendió ${venta.empleado} - ${fechaStr} ${horaStr}</div>
    `;
    ticketSection.style.display = 'block';
  }
}


    </script>
  </body>
</html>
