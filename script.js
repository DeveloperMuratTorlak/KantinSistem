// API_URL dinamik olarak ayarlanacak
const API_URL = window.location.origin; // 🌟 Dinamik olarak Render'ın verdiği base URL alınır
let currentUser = null;
let cart = [];

// Bildirim fonksiyonu
function showNotification(message) {
    const container = document.getElementById("notification-container");
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    container.appendChild(notification);

    // Bildirim 4 saniye sonra otomatik olarak silinsin (animasyon süresiyle uyumlu)
    setTimeout(() => {
        notification.remove();
    }, 4000);
}


function login() {
    const userType = document.getElementById("user-type").value;
    const id = document.getElementById("user-id").value;
    const password = document.getElementById("user-password").value;

    fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType, id, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        currentUser = data.student || data;
        document.getElementById("login-container").classList.add("hidden");
        if (userType === "student") {
            document.getElementById("student-container").classList.remove("hidden");
            document.getElementById("student-name").innerText = currentUser.name;
            document.getElementById("student-balance").innerText = currentUser.balance;
            showNotification("Başarıyla giriş yaptınız!");
        } else if (userType === "staff") {
            document.getElementById("staff-container").classList.remove("hidden");
            document.getElementById("staff-name").innerText = currentUser.name;
            showNotification("Başarıyla giriş yaptınız!");
        } else if (userType === "admin") {
            document.getElementById("admin-container").classList.remove("hidden");
            document.getElementById("admin-name").innerText = currentUser.name;
            showNotification("Başarıyla giriş yaptınız!");
        } else if (userType === "parent") {
            document.getElementById("parent-container").classList.remove("hidden");
            document.getElementById("parent-student-name").innerText = currentUser.name;
            document.getElementById("parent-student-balance").innerText = currentUser.balance;
            showNotification("Başarıyla giriş yaptınız!");
        }
    })
    .catch(err => showNotification(`Giriş hatası: ${err.message}`));
}

function logout() {
    currentUser = null;
    cart = [];
    document.getElementById("student-container").classList.add("hidden");
    document.getElementById("staff-container").classList.add("hidden");
    document.getElementById("admin-container").classList.add("hidden");
    document.getElementById("parent-container").classList.add("hidden");
    document.getElementById("login-container").classList.remove("hidden");
    showNotification("Çıkış yapıldı!");
}

function showProducts() {
    document.getElementById("products-display").classList.remove("hidden");
    document.getElementById("cart-section").classList.remove("hidden");
    document.getElementById("student-transactions").classList.add("hidden");
    document.getElementById("student-profile-section").classList.add("hidden");

    fetch(`${API_URL}/products`)
        .then(res => res.json())
        .then(products => {
            const display = document.getElementById("products-display");
            display.innerHTML = "";
            for (let category in products) {
                const categoryDiv = document.createElement("div");
                categoryDiv.innerHTML = `<h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>`;
                const list = document.createElement("div");
                list.className = "product-list";
                products[category].forEach(product => {
                    const banned = currentUser.bannedProducts.includes(product.name);
                    const item = document.createElement("div");
                    item.className = "product-item";
                    item.innerHTML = `
                        ${product.name} - ${product.price} TL (Stok: ${product.stock})
                        ${banned ? "<span>(Yasaklı)</span>" : product.stock > 0 ? `<button onclick="addToCart('${category}', '${product.name}', ${product.price})">Ekle</button>` : "<span>(Stok Yok)</span>"}
                    `;
                    list.appendChild(item);
                });
                categoryDiv.appendChild(list);
                display.appendChild(categoryDiv);
            }
        })
        .catch(err => showNotification(`Ürün yükleme hatası: ${err.message}`));
}

function addToCart(category, name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ category, name, price, quantity: 1 });
    }
    updateCart();
    showNotification(`${name} sepete eklendi!`);
}

function updateCart() {
    const cartItems = document.getElementById("cart-items");
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const div = document.createElement("div");
        div.innerHTML = `${item.name} - ${item.quantity} adet - ${itemTotal} TL <button onclick="removeFromCart('${item.name}')">Çıkar</button>`;
        cartItems.appendChild(div);
    });
    document.getElementById("cart-total").innerText = total;
}

function removeFromCart(name) {
    const index = cart.findIndex(item => item.name === name);
    if (index !== -1) {
        cart[index].quantity--;
        if (cart[index].quantity === 0) cart.splice(index, 1);
        updateCart();
        showNotification(`${name} sepetten çıkarıldı!`);
    }
}

function checkout() {
    if (cart.length === 0) return showNotification("Sepet boş!");
    fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id, total: parseFloat(document.getElementById("cart-total").innerText), cart })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        currentUser = data;
        document.getElementById("student-balance").innerText = currentUser.balance;
        cart = [];
        updateCart();
        showNotification("Satın alma başarılı!");
        showProducts();
    })
    .catch(err => showNotification(`Satın alma hatası: ${err.message}`));
}

function showStudentTransactions() {
    document.getElementById("products-display").classList.add("hidden");
    document.getElementById("cart-section").classList.add("hidden");
    document.getElementById("student-transactions").classList.remove("hidden");
    document.getElementById("student-profile-section").classList.add("hidden");

    const transactionsDiv = document.getElementById("student-transactions");
    transactionsDiv.innerHTML = "<h3>İşlemlerim</h3>";
    if (currentUser.transactions.length === 0) {
        transactionsDiv.innerHTML += "<p>Henüz işlem yok.</p>";
    } else {
        currentUser.transactions.forEach(t => {
            const p = document.createElement("p");
            p.innerText = `${t.type} - ${t.amount} TL - ${new Date(t.date).toLocaleString()} ${t.type === "Satın Alma" ? " (" + t.items.map(i => `${i.name} x${i.quantity}`).join(", ") + ")" : ""}`;
            transactionsDiv.appendChild(p);
        });
    }
}

function showStudentProfile() {
    document.getElementById("products-display").classList.add("hidden");
    document.getElementById("cart-section").classList.add("hidden");
    document.getElementById("student-transactions").classList.add("hidden");
    document.getElementById("student-profile-section").classList.remove("hidden");

    document.getElementById("student-profile-name").innerText = currentUser.name;
    document.getElementById("student-profile-id").innerText = currentUser.id;
    document.getElementById("student-profile-balance").innerText = currentUser.balance;
    document.getElementById("student-profile-parent").innerText = currentUser.parentName;
    document.getElementById("student-profile-banned").innerText = currentUser.bannedProducts.length > 0 ? currentUser.bannedProducts.join(", ") : "Yok";
    document.getElementById("student-profile-limit").innerText = currentUser.spendingLimit ? `${currentUser.spendingLimit} TL (${currentUser.limitType})` : "Yok";
}

function showStock() {
    document.getElementById("stock-display").classList.remove("hidden");
    document.getElementById("staff-sales-reports").classList.add("hidden");
    document.getElementById("staff-profile-section").classList.add("hidden");

    fetch(`${API_URL}/products`)
        .then(res => res.json())
        .then(products => {
            const display = document.getElementById("stock-display");
            display.innerHTML = "<h3>Stok Durumu</h3>";
            for (let category in products) {
                const categoryDiv = document.createElement("div");
                categoryDiv.innerHTML = `<h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>`;
                const list = document.createElement("div");
                list.className = "product-list";
                products[category].forEach(product => {
                    const item = document.createElement("div");
                    item.className = "product-item";
                    item.innerHTML = `${product.name} - ${product.price} TL (Stok: ${product.stock})`;
                    list.appendChild(item);
                });
                categoryDiv.appendChild(list);
                display.appendChild(categoryDiv);
            }
        })
        .catch(err => showNotification(`Stok yükleme hatası: ${err.message}`));
}

function showSalesReports(userType) {
    if (userType === "staff") {
        document.getElementById("staff-sales-reports").classList.remove("hidden");
        document.getElementById("stock-display").classList.add("hidden");
        document.getElementById("staff-profile-section").classList.add("hidden");
    } else if (userType === "admin") {
        document.getElementById("admin-sales-reports").classList.remove("hidden");
        document.getElementById("admin-stock-display").classList.add("hidden");
        document.getElementById("individual-profit-section").classList.add("hidden");
        document.getElementById("user-details-section").classList.add("hidden");
        document.getElementById("add-remove-user-section").classList.add("hidden");
        document.getElementById("performance-indicators").classList.add("hidden");
        document.getElementById("cost-analysis").classList.add("hidden");
        document.getElementById("admin-profile-section").classList.add("hidden");
        document.getElementById("change-password-section").classList.add("hidden");
    }
}

function loadSalesReports(userType) {
    const period = document.getElementById(`${userType}-report-period`).value;
    fetch(`${API_URL}/sales-reports?period=${period}`)
        .then(res => res.json())
        .then(data => {
            const tableBody = document.getElementById(`${userType}-sales-table-body`);
            tableBody.innerHTML = "";
            if (data.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='5'>Kayıt bulunamadı.</td></tr>";
            } else {
                data.forEach(report => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${report.userName}</td>
                        <td>${report.itemName}</td>
                        <td>${report.quantity}</td>
                        <td>${report.amount} TL</td>
                        <td>${new Date(report.date).toLocaleString()}</td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
        })
        .catch(err => showNotification(`Hata: ${err.message}`));
}

function showStaffProfile() {
    document.getElementById("stock-display").classList.add("hidden");
    document.getElementById("staff-sales-reports").classList.add("hidden");
    document.getElementById("staff-profile-section").classList.remove("hidden");

    document.getElementById("staff-profile-name").innerText = currentUser.name;
    document.getElementById("staff-profile-id").innerText = currentUser.id;
}

function showAdminStock() {
    document.getElementById("admin-stock-display").classList.remove("hidden");
    document.getElementById("individual-profit-section").classList.add("hidden");
    document.getElementById("user-details-section").classList.add("hidden");
    document.getElementById("add-remove-user-section").classList.add("hidden");
    document.getElementById("performance-indicators").classList.add("hidden");
    document.getElementById("admin-sales-reports").classList.add("hidden");
    document.getElementById("cost-analysis").classList.add("hidden");
    document.getElementById("admin-profile-section").classList.add("hidden");
    document.getElementById("change-password-section").classList.add("hidden");

    fetch(`${API_URL}/products`)
        .then(res => res.json())
        .then(products => {
            const display = document.getElementById("admin-stock-display");
            display.innerHTML = "<h3>Stok Durumu</h3>";
            for (let category in products) {
                const categoryDiv = document.createElement("div");
                categoryDiv.innerHTML = `<h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>`;
                const list = document.createElement("div");
                list.className = "product-list";
                products[category].forEach(product => {
                    const item = document.createElement("div");
                    item.className = "product-item";
                    item.innerHTML = `${product.name} - ${product.price} TL (Stok: ${product.stock})`;
                    list.appendChild(item);
                });
                categoryDiv.appendChild(list);
                display.appendChild(categoryDiv);
            }
        })
        .catch(err => showNotification(`Stok yükleme hatası: ${err.message}`));
}

function showIndividualProfitSection() {
    document.getElementById("admin-stock-display").classList.add("hidden");
    document.getElementById("individual-profit-section").classList.remove("hidden");
    document.getElementById("user-details-section").classList.add("hidden");
    document.getElementById("add-remove-user-section").classList.add("hidden");
    document.getElementById("performance-indicators").classList.add("hidden");
    document.getElementById("admin-sales-reports").classList.add("hidden");
    document.getElementById("cost-analysis").classList.add("hidden");
    document.getElementById("admin-profile-section").classList.add("hidden");
    document.getElementById("change-password-section").classList.add("hidden");

    fetch(`${API_URL}/products`)
        .then(res => res.json())
        .then(products => {
            const profitInputs = document.getElementById("profit-inputs");
            profitInputs.innerHTML = "";
            for (let category in products) {
                const categoryDiv = document.createElement("div");
                categoryDiv.innerHTML = `<h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>`;
                products[category].forEach(product => {
                    const div = document.createElement("div");
                    div.innerHTML = `${product.name} - ${product.price} TL: <input type="number" id="profit-${category}-${product.name}" placeholder="Kâr oranı (%)">`;
                    categoryDiv.appendChild(div);
                });
                profitInputs.appendChild(categoryDiv);
            }
        })
        .catch(err => showNotification(`Ürün yükleme hatası: ${err.message}`));
}

function applyIndividualProfit() {
    const profits = [];
    document.querySelectorAll("[id^='profit-']").forEach(input => {
        const [_, category, name] = input.id.split("-");
        const profit = parseFloat(input.value);
        if (!isNaN(profit) && profit !== 0) {
            profits.push({ category, name, profit });
        }
    });

    fetch(`${API_URL}/individual-profit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profits, adminId: currentUser.id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        showNotification("Kâr oranları uygulandı!");
        showAdminStock();
    })
    .catch(err => showNotification(`Kâr uygulama hatası: ${err.message}`));
}

function showUserDetailsSection() {
    document.getElementById("admin-stock-display").classList.add("hidden");
    document.getElementById("individual-profit-section").classList.add("hidden");
    document.getElementById("user-details-section").classList.remove("hidden");
    document.getElementById("add-remove-user-section").classList.add("hidden");
    document.getElementById("performance-indicators").classList.add("hidden");
    document.getElementById("admin-sales-reports").classList.add("hidden");
    document.getElementById("cost-analysis").classList.add("hidden");
    document.getElementById("admin-profile-section").classList.add("hidden");
    document.getElementById("change-password-section").classList.add("hidden");

    fetch(`${API_URL}/all-users`)
        .then(res => res.json())
        .then(data => {
            const userButtons = document.getElementById("user-buttons");
            userButtons.innerHTML = "";

            const studentHeader = document.createElement("h4");
            studentHeader.innerText = "Öğrenciler";
            userButtons.appendChild(studentHeader);
            data.students.forEach(student => {
                const button = document.createElement("button");
                button.innerText = `${student.name} (${student.id})`;
                button.onclick = () => showUserDetails(student, "student");
                userButtons.appendChild(button);
            });

            const staffHeader = document.createElement("h4");
            staffHeader.innerText = "Personel";
            userButtons.appendChild(staffHeader);
            data.staff.forEach(staff => {
                const button = document.createElement("button");
                button.innerText = `${staff.name} (${staff.id})`;
                button.onclick = () => showUserDetails(staff, "staff");
                userButtons.appendChild(button);
            });
        })
        .catch(err => showNotification(`Hata: ${err.message}`));
}

function showUserDetails(user, userType) {
    const userDetails = document.getElementById("user-details");
    userDetails.innerHTML = "";
    userDetails.classList.remove("hidden");

    const info = [
        `Ad: ${user.name}`,
        `Tip: ${userType === "student" ? "Öğrenci" : "Personel"}`,
        `ID: ${user.id}`,
        `Şifre: ${user.password}`
    ];
    if (userType === "student") {
        info.push(`Bakiye: ${user.balance} TL`);
        info.push(`Veli: ${user.parentName}`);
        info.push(`Limit: ${user.spendingLimit || "Yok"} TL (${user.limitType || "Tanımlı değil"})`);
        info.push(`Yasaklı Ürünler: ${user.bannedProducts.length > 0 ? user.bannedProducts.join(", ") : "Yok"}`);
        info.push(`İşlem Sayısı: ${user.transactions.length}`);
    }

    info.forEach(item => {
        const div = document.createElement("div");
        div.className = "user-item";
        div.innerHTML = item;
        userDetails.appendChild(div);
    });
}

function showAddRemoveUserSection() {
    document.getElementById("admin-stock-display").classList.add("hidden");
    document.getElementById("individual-profit-section").classList.add("hidden");
    document.getElementById("user-details-section").classList.add("hidden");
    document.getElementById("add-remove-user-section").classList.remove("hidden");
    document.getElementById("performance-indicators").classList.add("hidden");
    document.getElementById("admin-sales-reports").classList.add("hidden");
    document.getElementById("cost-analysis").classList.add("hidden");
    document.getElementById("admin-profile-section").classList.add("hidden");
    document.getElementById("change-password-section").classList.add("hidden");

    const userTypeSelect = document.getElementById("new-user-type");
    const parentInput = document.getElementById("new-user-parent");
    userTypeSelect.onchange = () => {
        parentInput.classList.toggle("hidden", userTypeSelect.value !== "student");
    };
    parentInput.classList.toggle("hidden", userTypeSelect.value !== "student");
}

function addNewUser() {
    const name = document.getElementById("new-user-name").value;
    const userType = document.getElementById("new-user-type").value;
    const password = document.getElementById("new-user-password").value;
    const parentName = userType === "student" ? document.getElementById("new-user-parent").value : null;

    fetch(`${API_URL}/add-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userType, password, parentName })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        showNotification(`Kullanıcı eklendi! Yeni ID: ${data.id}`);
        document.getElementById("new-user-name").value = "";
        document.getElementById("new-user-password").value = "";
        document.getElementById("new-user-parent").value = "";
    })
    .catch(err => showNotification(`Ekleme hatası: ${err.message}`));
}

function removeUser() {
    const id = document.getElementById("remove-user-id").value;
    const password = document.getElementById("remove-user-password").value;

    fetch(`${API_URL}/remove-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        showNotification("Kullanıcı silindi!");
        document.getElementById("remove-user-id").value = "";
        document.getElementById("remove-user-password").value = "";
    })
    .catch(err => showNotification(`Silme hatası: ${err.message}`));
}

function showPerformanceIndicators() {
    document.getElementById("admin-stock-display").classList.add("hidden");
    document.getElementById("individual-profit-section").classList.add("hidden");
    document.getElementById("user-details-section").classList.add("hidden");
    document.getElementById("add-remove-user-section").classList.add("hidden");
    document.getElementById("performance-indicators").classList.remove("hidden");
    document.getElementById("admin-sales-reports").classList.add("hidden");
    document.getElementById("cost-analysis").classList.add("hidden");
    document.getElementById("admin-profile-section").classList.add("hidden");
    document.getElementById("change-password-section").classList.add("hidden");

    fetch(`${API_URL}/performance-indicators`)
        .then(res => res.json())
        .then(data => {
            const topProducts = document.getElementById("top-products");
            topProducts.innerHTML = "<h4>En Çok Satılan Ürünler</h4>";
            data.topSold.forEach(item => {
                topProducts.innerHTML += `<p>${item.name}: ${item.totalSold} adet</p>`;
            });

            const topProfit = document.getElementById("top-profit");
            topProfit.innerHTML = "<h4>En Çok Kâr Ettiren Ürünler</h4>";
            data.topProfit.forEach(item => {
                topProfit.innerHTML += `<p>${item.name}: ${item.totalProfit} TL</p>`;
            });
        })
        .catch(err => showNotification(`Hata: ${err.message}`));
}

function showCostAnalysis() {
    document.getElementById("admin-stock-display").classList.add("hidden");
    document.getElementById("individual-profit-section").classList.add("hidden");
    document.getElementById("user-details-section").classList.add("hidden");
    document.getElementById("add-remove-user-section").classList.add("hidden");
    document.getElementById("performance-indicators").classList.add("hidden");
    document.getElementById("admin-sales-reports").classList.add("hidden");
    document.getElementById("cost-analysis").classList.remove("hidden");
    document.getElementById("admin-profile-section").classList.add("hidden");
    document.getElementById("change-password-section").classList.add("hidden");

    fetch(`${API_URL}/cost-analysis`)
        .then(res => res.json())
        .then(data => {
            const totalRevenue = document.getElementById("total-revenue");
            totalRevenue.innerHTML = `<h4>Toplam Ciro: ${data.totalRevenue} TL</h4>`;

            const tableBody = document.getElementById("cost-table-body");
            tableBody.innerHTML = "";
            data.products.forEach(product => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.cost} TL</td>
                    <td>${product.price} TL</td>
                    <td>${product.totalSold}</td>
                    <td>${product.totalProfit} TL</td>
                `;
                tableBody.appendChild(tr);
            });
        })
        .catch(err => showNotification(`Hata: ${err.message}`));
}

function showAdminProfile() {
    document.getElementById("admin-stock-display").classList.add("hidden");
    document.getElementById("individual-profit-section").classList.add("hidden");
    document.getElementById("user-details-section").classList.add("hidden");
    document.getElementById("add-remove-user-section").classList.add("hidden");
    document.getElementById("performance-indicators").classList.add("hidden");
    document.getElementById("admin-sales-reports").classList.add("hidden");
    document.getElementById("cost-analysis").classList.add("hidden");
    document.getElementById("admin-profile-section").classList.remove("hidden");
    document.getElementById("change-password-section").classList.add("hidden");

    document.getElementById("admin-profile-name").innerText = currentUser.name;
    document.getElementById("admin-profile-id").innerText = currentUser.id;
}

function showChangePasswordSection() {
    document.getElementById("admin-stock-display").classList.add("hidden");
    document.getElementById("individual-profit-section").classList.add("hidden");
    document.getElementById("user-details-section").classList.add("hidden");
    document.getElementById("add-remove-user-section").classList.add("hidden");
    document.getElementById("performance-indicators").classList.add("hidden");
    document.getElementById("admin-sales-reports").classList.add("hidden");
    document.getElementById("cost-analysis").classList.add("hidden");
    document.getElementById("admin-profile-section").classList.add("hidden");
    document.getElementById("change-password-section").classList.remove("hidden");
}

function changePassword() {
    const newPassword = document.getElementById("new-password").value;
    fetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id, newPassword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        showNotification("Şifre değiştirildi!");
        document.getElementById("new-password").value = "";
    })
    .catch(err => showNotification(`Şifre değiştirme hatası: ${err.message}`));
}

function showParentTransactions() {
    document.getElementById("parent-transactions").classList.remove("hidden");
    document.getElementById("transfer-section").classList.add("hidden");
    document.getElementById("ban-product-section").classList.add("hidden");
    document.getElementById("limit-section").classList.add("hidden");

    const transactionsDiv = document.getElementById("parent-transactions");
    transactionsDiv.innerHTML = "<h3>İşlemler</h3>";
    if (currentUser.transactions.length === 0) {
        transactionsDiv.innerHTML += "<p>Henüz işlem yok.</p>";
    } else {
        currentUser.transactions.forEach(t => {
            const p = document.createElement("p");
            p.innerText = `${t.type} - ${t.amount} TL - ${new Date(t.date).toLocaleString()} ${t.type === "Satın Alma" ? " (" + t.items.map(i => `${i.name} x${i.quantity}`).join(", ") + ")" : ""}`;
            transactionsDiv.appendChild(p);
        });
    }
}

function showTransferSection() {
    document.getElementById("parent-transactions").classList.add("hidden");
    document.getElementById("transfer-section").classList.remove("hidden");
    document.getElementById("ban-product-section").classList.add("hidden");
    document.getElementById("limit-section").classList.add("hidden");
}

function transfer() {
    const amount = parseFloat(document.getElementById("transfer-amount").value);
    if (isNaN(amount) || amount <= 0) return showNotification("Geçerli bir miktar girin!");
    fetch(`${API_URL}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id, amount })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        currentUser = data;
        document.getElementById("parent-student-balance").innerText = currentUser.balance;
        document.getElementById("transfer-amount").value = "";
        showNotification("Para yüklendi!");
        showParentTransactions();
    })
    .catch(err => showNotification(`Transfer hatası: ${err.message}`));
}

function showBanProductSection() {
    document.getElementById("parent-transactions").classList.add("hidden");
    document.getElementById("transfer-section").classList.add("hidden");
    document.getElementById("ban-product-section").classList.remove("hidden");
    document.getElementById("limit-section").classList.add("hidden");

    fetch(`${API_URL}/products`)
        .then(res => res.json())
        .then(products => {
            const banList = document.getElementById("ban-product-list");
            banList.innerHTML = "";
            for (let category in products) {
                const categoryDiv = document.createElement("div");
                categoryDiv.innerHTML = `<h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>`;
                products[category].forEach(product => {
                    const div = document.createElement("div");
                    div.innerHTML = `<input type="checkbox" id="ban-${product.name}" value="${product.name}" ${currentUser.bannedProducts.includes(product.name) ? "checked disabled" : ""}> ${product.name}`;
                    categoryDiv.appendChild(div);
                });
                banList.appendChild(categoryDiv);
            }
        })
        .catch(err => showNotification(`Ürün yükleme hatası: ${err.message}`));
}

function banProducts() {
    const products = Array.from(document.querySelectorAll("[id^='ban-']:not(:disabled):checked")).map(input => input.value);
    fetch(`${API_URL}/ban-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id, products })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        currentUser = data;
        showNotification("Ürünler yasaklandı!");
        showBanProductSection();
    })
    .catch(err => showNotification(`Yasaklama hatası: ${err.message}`));
}

function showLimitSection() {
    document.getElementById("parent-transactions").classList.add("hidden");
    document.getElementById("transfer-section").classList.add("hidden");
    document.getElementById("ban-product-section").classList.add("hidden");
    document.getElementById("limit-section").classList.remove("hidden");
}

function setLimit() {
    const limit = parseFloat(document.getElementById("limit-amount").value);
    const limitType = document.getElementById("limit-type").value;
    fetch(`${API_URL}/set-limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id, limit, limitType })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        currentUser = data;
        showNotification("Limit belirlendi!");
        document.getElementById("limit-amount").value = "";
    })
    .catch(err => showNotification(`Limit hatası: ${err.message}`));
}
