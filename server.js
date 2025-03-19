const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const port = process.env.PORT; // 🌟 Sabit port kaldırıldı!

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

console.log("🚀 Sunucu başlatılıyor...");

const db = new sqlite3.Database("./kantin.db", (err) => {
    if (err) {
        console.error("❌ Veritabanı hatası:", err.message);
    } else {
        console.log("✅ Veritabanına başarıyla bağlandı.");
    }
});

// 🌟 Root endpoint eklendi
app.get("/", (req, res) => {
    res.send("✅ Sunucu Çalışıyor!");
});

// Sunucuyu başlat
app.listen(port, () => {
    console.log(`✅ Sunucu ${port} portunda çalışıyor.`);
});


db.serialize(() => {
    db.run("DROP TABLE IF EXISTS students");
    db.run("DROP TABLE IF EXISTS staff");
    db.run("DROP TABLE IF EXISTS admins");
    db.run("DROP TABLE IF EXISTS products");

    db.run(`CREATE TABLE students (
        id TEXT PRIMARY KEY,
        name TEXT,
        password TEXT,
        balance REAL,
        transactions TEXT,
        bannedProducts TEXT,
        parentName TEXT,
        spendingLimit REAL,
        limitType TEXT
    )`);
    db.run(`CREATE TABLE staff (
        id TEXT PRIMARY KEY,
        name TEXT,
        password TEXT
    )`);
    db.run(`CREATE TABLE admins (
        id TEXT PRIMARY KEY,
        name TEXT,
        password TEXT
    )`);
    db.run(`CREATE TABLE products (
        category TEXT,
        name TEXT,
        price REAL,
        stock INTEGER,
        cost REAL,
        PRIMARY KEY (category, name)
    )`);

    const initialStudents = [
        ["1001", "Ali Kaya", "1111", 50, JSON.stringify([]), JSON.stringify([]), "Veli Kaya", null, null],
        ["1002", "Ayşe Kaya", "1112", 30, JSON.stringify([]), JSON.stringify([]), "Zeynep Kaya", null, null],
        ["1003", "Mehmet Kaya", "1113", 20, JSON.stringify([]), JSON.stringify([]), "Ahmet Kaya", null, null],
        ["1004", "Fatma Kaya", "1114", 40, JSON.stringify([]), JSON.stringify([]), "Hülya Kaya", null, null],
        ["1005", "Ahmet Kaya", "1115", 25, JSON.stringify([]), JSON.stringify([]), "Mustafa Kaya", null, null],
        ["1006", "Zeynep Kaya", "1116", 60, JSON.stringify([]), JSON.stringify([]), "Emine Kaya", null, null],
        ["1007", "Ece Kaya", "1117", 35, JSON.stringify([]), JSON.stringify([]), "Osman Kaya", null, null],
        ["1008", "Burak Kaya", "1118", 45, JSON.stringify([]), JSON.stringify([]), "Seda Kaya", null, null],
        ["1009", "Deniz Kaya", "1119", 15, JSON.stringify([]), JSON.stringify([]), "Can Kaya", null, null],
        ["1010", "Selin Kaya", "1110", 55, JSON.stringify([]), JSON.stringify([]), "Gül Kaya", null, null]
    ];

    const initialStaff = [
        ["2001", "Ahmet Koç", "2221"],
        ["2002", "Esra Yılmaz", "2222"],
        ["2003", "Mustafa Erdem", "2223"],
        ["2004", "Elif Aydın", "2224"],
        ["2005", "Kemal Şahin", "2225"]
    ];

    const initialAdmins = [
        ["3001", "Yunus Emre", "3331"],
        ["3002", "Büşra Çelik", "3332"]
    ];

    const initialProducts = {
        tatli: [["Baklava", 10, 40, 7], ["Künefe", 15, 35, 10], ["Sütlaç", 8, 30, 5], ["Cheesecake", 12, 25, 8], ["Tiramisu", 14, 20, 9]],
        atistirmalik: [["Cips", 5, 40, 3], ["Çikolata", 3, 35, 2], ["Çilekli Çikolata", 4, 30, 2.5], ["Kraker", 4, 30, 2.5], ["Bisküvi", 2, 25, 1], ["Kuruyemiş", 7, 20, 4]],
        icecek: [["Kola", 6, 40, 4], ["Su", 2, 35, 1], ["Ayran", 4, 30, 2.5], ["Meyve Suyu", 5, 25, 3], ["Çay", 3, 20, 1.5]]
    };

    initialStudents.forEach(student => db.run("INSERT INTO students (id, name, password, balance, transactions, bannedProducts, parentName, spendingLimit, limitType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", student));
    initialStaff.forEach(staff => db.run("INSERT INTO staff (id, name, password) VALUES (?, ?, ?)", staff));
    initialAdmins.forEach(admin => db.run("INSERT INTO admins (id, name, password) VALUES (?, ?, ?)", admin));
    for (let category in initialProducts) {
        initialProducts[category].forEach(([name, price, stock, cost]) => {
            db.run("INSERT INTO products (category, name, price, stock, cost) VALUES (?, ?, ?, ?, ?)", [category, name, price, stock, cost]);
        });
    }
    console.log("Veritabanı tabloları oluşturuldu ve başlangıç verileri eklendi.");
});

app.post("/login", (req, res) => {
    const { userType, id, password } = req.body;
    console.log(`Login isteği - userType: ${userType}, id: ${id}, password: ${password}`);
    if (userType === "parent") {
        db.get("SELECT * FROM students WHERE id = ? AND password = ?", [id, password], (err, row) => {
            if (err) {
                console.error("Login veritabanı hatası:", err);
                return res.status(500).json({ error: "Veritabanı hatası" });
            }
            if (!row) {
                console.log("Hatalı öğrenci ID veya şifre");
                return res.status(401).json({ error: "Hatalı öğrenci ID veya şifre" });
            }
            row.transactions = JSON.parse(row.transactions || "[]");
            row.bannedProducts = JSON.parse(row.bannedProducts || "[]");
            row.type = "Öğrenci";
            console.log("Başarılı veli girişi:", row);
            res.json({ student: row });
        });
    } else {
        const table = userType === "student" ? "students" : userType === "staff" ? "staff" : "admins";
        db.get(`SELECT * FROM ${table} WHERE id = ? AND password = ?`, [id, password], (err, row) => {
            if (err) {
                console.error("Login veritabanı hatası:", err);
                return res.status(500).json({ error: "Veritabanı hatası" });
            }
            if (!row) {
                console.log(`Hatalı ${userType} ID veya şifre`);
                return res.status(401).json({ error: "Hatalı ID veya şifre" });
            }
            if (userType === "student") {
                row.transactions = JSON.parse(row.transactions || "[]");
                row.bannedProducts = JSON.parse(row.bannedProducts || "[]");
            }
            row.type = userType === "student" ? "Öğrenci" : userType === "staff" ? "Personel" : "Yönetici";
            console.log(`Başarılı ${userType} girişi:`, row);
            res.json(row);
        });
    }
});

app.get("/products", (req, res) => {
    console.log("Ürünler çekiliyor...");
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            console.error("Ürünler çekme hatası:", err);
            return res.status(500).json({ error: err.message });
        }
        const products = {};
        rows.forEach(row => {
            if (!products[row.category]) products[row.category] = [];
            products[row.category].push({ name: row.name, price: row.price, stock: row.stock, cost: row.cost });
        });
        console.log("Ürünler gönderildi:", products);
        res.json(products);
    });
});

app.post("/checkout", (req, res) => {
    const { id, total, cart } = req.body;
    console.log(`Checkout isteği - ID: ${id}, Toplam: ${total}, Sepet:`, cart);

    db.get("SELECT balance, transactions, spendingLimit, limitType FROM students WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            console.error("Checkout - Kullanıcı bulunamadı:", err || "Row yok");
            return res.status(500).json({ error: "Kullanıcı bulunamadı" });
        }

        let transactions = JSON.parse(row.transactions || "[]");
        console.log("Mevcut işlemler:", transactions);

        if (row.balance < total) {
            console.log("Yetersiz bakiye - Balance:", row.balance, "Total:", total);
            return res.status(400).json({ error: "Yetersiz bakiye" });
        }

        if (row.spendingLimit && row.limitType) {
            const now = new Date();
            let periodStart;

            if (row.limitType === "daily") {
                periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (row.limitType === "weekly") {
                const dayOfWeek = now.getDay();
                periodStart = new Date(now);
                periodStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                periodStart.setHours(0, 0, 0, 0);
            } else if (row.limitType === "monthly") {
                periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const periodTotal = transactions
                .filter(t => new Date(t.date) >= periodStart && t.type === "Satın Alma")
                .reduce((sum, t) => sum + t.amount, 0);

            console.log(`${row.limitType} dönem toplamı: ${periodTotal}, Yeni toplam: ${periodTotal + total}, Limit: ${row.spendingLimit}`);

            if (periodTotal + total > row.spendingLimit) {
                const limitTypeText = row.limitType === "daily" ? "Günlük" : row.limitType === "weekly" ? "Haftalık" : "Aylık";
                console.log(`${limitTypeText} limit aşımı`);
                return res.status(400).json({ 
                    error: `${limitTypeText} harcama limiti (${row.spendingLimit} TL) aşıldı. Şu ana kadar harcanan: ${periodTotal} TL`
                });
            }
        }

        const transactionDetails = {
            type: "Satın Alma",
            items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
            amount: total,
            date: new Date().toISOString()
        };
        transactions.push(transactionDetails);
        console.log("Yeni işlem eklendi:", transactionDetails);

        db.run("UPDATE students SET balance = balance - ?, transactions = ? WHERE id = ?", 
            [total, JSON.stringify(transactions), id], (err) => {
                if (err) {
                    console.error("Bakiye güncelleme hatası:", err);
                    return res.status(500).json({ error: "Bakiye güncelleme hatası" });
                }

                cart.forEach(item => {
                    db.run("UPDATE products SET stock = stock - ? WHERE category = ? AND name = ?", 
                        [item.quantity, item.category, item.name], (err) => {
                            if (err) console.error(`Stok güncelleme hatası (${item.name}):`, err);
                        });
                });

                db.get("SELECT * FROM students WHERE id = ?", [id], (err, updatedRow) => {
                    if (err) {
                        console.error("Güncellenmiş kullanıcı alınamadı:", err);
                        return res.status(500).json({ error: "Kullanıcı güncelleme hatası" });
                    }
                    updatedRow.transactions = JSON.parse(updatedRow.transactions);
                    updatedRow.bannedProducts = JSON.parse(updatedRow.bannedProducts || "[]");
                    updatedRow.type = "Öğrenci";
                    console.log("Checkout tamamlandı, güncellenmiş kullanıcı:", updatedRow);
                    res.json(updatedRow);
                });
            });
    });
});

app.post("/transfer", (req, res) => {
    const { id, amount } = req.body;
    console.log(`Transfer isteği - ID: ${id}, Miktar: ${amount}`);
    db.get("SELECT transactions FROM students WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            console.error("Transfer - Kullanıcı bulunamadı:", err || "Row yok");
            return res.status(500).json({ error: "Kullanıcı bulunamadı" });
        }
        let transactions = JSON.parse(row.transactions || "[]");
        transactions.push({
            type: "Para Yükleme",
            details: `${amount} TL yüklendi`,
            amount,
            date: new Date().toISOString()
        });
        db.run("UPDATE students SET balance = balance + ?, transactions = ? WHERE id = ?", 
            [amount, JSON.stringify(transactions), id], (err) => {
                if (err) {
                    console.error("Transfer hatası:", err);
                    return res.status(500).json({ error: "Transfer hatası" });
                }
                db.get("SELECT * FROM students WHERE id = ?", [id], (err, updatedRow) => {
                    updatedRow.transactions = JSON.parse(updatedRow.transactions);
                    updatedRow.bannedProducts = JSON.parse(updatedRow.bannedProducts || "[]");
                    updatedRow.type = "Öğrenci";
                    console.log("Transfer tamamlandı:", updatedRow);
                    res.json(updatedRow);
                });
            });
    });
});

app.post("/individual-profit", (req, res) => {
    const { profits, adminId } = req.body;
    console.log("individual-profit isteği alındı:", { profits, adminId });

    if (!adminId) {
        console.log("Hata: adminId eksik");
        return res.status(401).json({ error: "Admin ID sağlanmadı" });
    }

    db.get("SELECT * FROM admins WHERE id = ?", [adminId], (err, admin) => {
        if (err || !admin) {
            console.log(`Hata: ${adminId} ID'si ile admin bulunamadı`);
            return res.status(401).json({ error: "Bu işlem için yönetici yetkisi gerekiyor" });
        }

        if (!profits || !Array.isArray(profits) || profits.length === 0) {
            console.log("Hata: Geçerli kâr listesi yok");
            return res.status(400).json({ error: "Geçerli bir kâr listesi sağlanmadı" });
        }

        let updateCount = 0;
        profits.forEach(({ category, name, profit }) => {
            db.run("UPDATE products SET price = ROUND(price * (1 + ? / 100)) WHERE category = ? AND name = ?", 
                [profit, category, name], (err) => {
                    if (err) {
                        console.error(`Fiyat güncelleme hatası (${name}):`, err);
                        return res.status(500).json({ error: "Fiyat güncelleme hatası" });
                    }
                    updateCount++;
                    if (updateCount === profits.length) {
                        db.all("SELECT * FROM products", [], (err, rows) => {
                            const updatedProducts = {};
                            rows.forEach(row => {
                                if (!updatedProducts[row.category]) updatedProducts[row.category] = [];
                                updatedProducts[row.category].push({ name: row.name, price: row.price, stock: row.stock, cost: row.cost });
                            });
                            console.log("Kâr oranları uygulandı:", updatedProducts);
                            res.json(updatedProducts);
                        });
                    }
                });
        });
    });
});

app.get("/all-users", (req, res) => {
    console.log("Tüm kullanıcılar çekiliyor...");
    db.all("SELECT * FROM students", [], (err, students) => {
        if (err) {
            console.error("Öğrenciler çekme hatası:", err);
            return res.status(500).json({ error: err.message });
        }
        students.forEach(student => {
            student.transactions = JSON.parse(student.transactions || "[]");
            student.bannedProducts = JSON.parse(student.bannedProducts || "[]");
        });
        db.all("SELECT * FROM staff", [], (err, staff) => {
            if (err) {
                console.error("Personel çekme hatası:", err);
                return res.status(500).json({ error: err.message });
            }
            console.log("Kullanıcılar gönderildi:", { students, staff });
            res.json({ students, staff });
        });
    });
});

app.post("/change-password", (req, res) => {
    const { id, newPassword } = req.body;
    console.log(`Şifre değiştirme isteği - ID: ${id}, Yeni Şifre: ${newPassword}`);
    db.get("SELECT * FROM students WHERE id = ?", [id], (err, student) => {
        if (student) {
            db.run("UPDATE students SET password = ? WHERE id = ?", [newPassword, id], (err) => {
                if (err) {
                    console.error("Şifre güncelleme hatası:", err);
                    return res.status(500).json({ error: "Şifre güncelleme hatası" });
                }
                console.log(`Şifre değiştirildi - ID: ${id}`);
                res.json({ success: true });
            });
        } else {
            db.get("SELECT * FROM staff WHERE id = ?", [id], (err, staff) => {
                if (staff) {
                    db.run("UPDATE staff SET password = ? WHERE id = ?", [newPassword, id], (err) => {
                        if (err) {
                            console.error("Şifre güncelleme hatası:", err);
                            return res.status(500).json({ error: "Şifre güncelleme hatası" });
                        }
                        console.log(`Şifre değiştirildi - ID: ${id}`);
                        res.json({ success: true });
                    });
                } else {
                    console.log("Kullanıcı bulunamadı");
                    res.status(404).json({ error: "Kullanıcı bulunamadı" });
                }
            });
        }
    });
});

app.post("/add-user", (req, res) => {
    const { name, userType, password, parentName } = req.body;
    console.log(`Yeni kullanıcı ekleme - Name: ${name}, Type: ${userType}, Password: ${password}, Parent: ${parentName}`);
    const table = userType === "student" ? "students" : "staff";
    db.all(`SELECT id FROM ${table}`, [], (err, rows) => {
        if (err) {
            console.error("ID alma hatası:", err);
            return res.status(500).json({ error: "ID hatası" });
        }
        const existingIds = rows.map(row => parseInt(row.id));
        const baseId = userType === "student" ? 1000 : 2000;
        let newId = baseId + 1;
        while (existingIds.includes(newId)) newId++;
        const params = userType === "student" ? [newId.toString(), name, password, 0, JSON.stringify([]), JSON.stringify([]), parentName || "Bilinmiyor", null, null] : [newId.toString(), name, password];
        db.run(`INSERT INTO ${table} (id, name, password${userType === "student" ? ", balance, transactions, bannedProducts, parentName, spendingLimit, limitType" : ""}) VALUES (?, ?, ?${userType === "student" ? ", ?, ?, ?, ?, ?, ?" : ""})`, params, (err) => {
            if (err) {
                console.error("Ekleme hatası:", err);
                return res.status(500).json({ error: "Ekleme hatası" });
            }
            console.log(`Kullanıcı eklendi - ID: ${newId}`);
            res.json({ id: newId.toString() });
        });
    });
});

app.post("/remove-user", (req, res) => {
    const { id, password } = req.body;
    console.log(`Kullanıcı silme isteği - ID: ${id}, Password: ${password}`);
    db.get("SELECT * FROM students WHERE id = ? AND password = ?", [id, password], (err, student) => {
        if (student) {
            db.run("DELETE FROM students WHERE id = ?", [id], (err) => {
                if (err) {
                    console.error("Silme hatası:", err);
                    return res.status(500).json({ error: "Silme hatası" });
                }
                console.log(`Kullanıcı silindi - ID: ${id}`);
                res.json({ success: true });
            });
        } else {
            db.get("SELECT * FROM staff WHERE id = ? AND password = ?", [id, password], (err, staff) => {
                if (staff) {
                    db.run("DELETE FROM staff WHERE id = ?", [id], (err) => {
                        if (err) {
                            console.error("Silme hatası:", err);
                            return res.status(500).json({ error: "Silme hatası" });
                        }
                        console.log(`Kullanıcı silindi - ID: ${id}`);
                        res.json({ success: true });
                    });
                } else {
                    console.log("Kullanıcı bulunamadı veya şifre yanlış");
                    res.status(404).json({ error: "Kullanıcı bulunamadı veya şifre yanlış" });
                }
            });
        }
    });
});

app.post("/ban-product", (req, res) => {
    const { id, products } = req.body;
    console.log(`Ürün yasaklama isteği - ID: ${id}, Ürünler:`, products);

    if (!Array.isArray(products) || products.length === 0) {
        console.log("Hata: Ürün listesi boş veya geçersiz");
        return res.status(400).json({ error: "En az bir ürün seçilmeli" });
    }

    db.get("SELECT bannedProducts FROM students WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            console.error("Kullanıcı bulunamadı:", err || "Row yok");
            return res.status(500).json({ error: "Kullanıcı bulunamadı" });
        }

        let bannedProducts = JSON.parse(row.bannedProducts || "[]");
        const newBans = products.filter(product => !bannedProducts.includes(product));

        if (newBans.length === 0) {
            console.log("Hata: Tüm ürünler zaten yasaklanmış");
            return res.status(400).json({ error: "Seçilen tüm ürünler zaten yasaklanmış" });
        }

        bannedProducts = [...bannedProducts, ...newBans];

        db.run("UPDATE students SET bannedProducts = ? WHERE id = ?", 
            [JSON.stringify(bannedProducts), id], (err) => {
                if (err) {
                    console.error("Yasaklama hatası:", err);
                    return res.status(500).json({ error: "Yasaklama hatası" });
                }
                db.get("SELECT * FROM students WHERE id = ?", [id], (err, updatedRow) => {
                    if (err) {
                        console.error("Kullanıcı güncelleme hatası:", err);
                        return res.status(500).json({ error: "Kullanıcı güncelleme hatası" });
                    }
                    updatedRow.transactions = JSON.parse(updatedRow.transactions || "[]");
                    updatedRow.bannedProducts = JSON.parse(updatedRow.bannedProducts);
                    updatedRow.type = "Öğrenci";
                    console.log("Ürünler yasaklandı:", updatedRow);
                    res.json(updatedRow);
                });
            });
    });
});

app.post("/set-limit", (req, res) => {
    const { id, limit, limitType } = req.body;
    console.log(`Limit ayarlama isteği - ID: ${id}, Limit: ${limit}, Tür: ${limitType}`);

    if (isNaN(limit) || limit < 0) {
        console.log("Hata: Geçersiz limit");
        return res.status(400).json({ error: "Geçerli bir limit girin" });
    }
    if (!["daily", "weekly", "monthly"].includes(limitType)) {
        console.log("Hata: Geçersiz limit türü");
        return res.status(400).json({ error: "Geçersiz limit türü" });
    }

    db.run("UPDATE students SET spendingLimit = ?, limitType = ? WHERE id = ?", [limit, limitType, id], (err) => {
        if (err) {
            console.error("Limit güncelleme hatası:", err);
            return res.status(500).json({ error: "Limit güncelleme hatası" });
        }
        db.get("SELECT * FROM students WHERE id = ?", [id], (err, updatedRow) => {
            if (err || !updatedRow) {
                console.error("Kullanıcı bulunamadı:", err || "Row yok");
                return res.status(500).json({ error: "Kullanıcı bulunamadı" });
            }
            updatedRow.transactions = JSON.parse(updatedRow.transactions || "[]");
            updatedRow.bannedProducts = JSON.parse(updatedRow.bannedProducts || "[]");
            updatedRow.type = "Öğrenci";
            console.log("Limit ayarlandı:", updatedRow);
            res.json(updatedRow);
        });
    });
});

app.get("/sales-reports", (req, res) => {
    const { period } = req.query;
    console.log(`Satış raporları isteği - Dönem: ${period}`);

    db.all("SELECT * FROM students", [], (err, students) => {
        if (err) return res.status(500).json({ error: "Veritabanı hatası" });

        let allTransactions = [];
        students.forEach(student => {
            const transactions = JSON.parse(student.transactions || "[]");
            transactions.forEach(t => {
                if (t.type === "Satın Alma") {
                    t.items.forEach(item => {
                        allTransactions.push({
                            userName: student.name,
                            itemName: item.name,
                            quantity: item.quantity,
                            amount: item.price * item.quantity,
                            date: t.date
                        });
                    });
                }
            });
        });

        const now = new Date();
        let filteredTransactions = allTransactions;
        if (period === "daily") {
            filteredTransactions = allTransactions.filter(t => new Date(t.date).toDateString() === now.toDateString());
        } else if (period === "weekly") {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            filteredTransactions = allTransactions.filter(t => new Date(t.date) >= weekStart);
        } else if (period === "monthly") {
            filteredTransactions = allTransactions.filter(t => new Date(t.date).getMonth() === now.getMonth());
        }

        console.log(`Satış raporları gönderildi (${period}):`, filteredTransactions);
        res.json(filteredTransactions);
    });
});

app.get("/performance-indicators", (req, res) => {
    db.all("SELECT * FROM students", [], (err, students) => {
        if (err) return res.status(500).json({ error: "Veritabanı hatası" });

        let productSales = {};
        students.forEach(student => {
            const transactions = JSON.parse(student.transactions || "[]");
            transactions.forEach(t => {
                if (t.type === "Satın Alma") {
                    t.items.forEach(item => {
                        if (!productSales[item.name]) {
                            productSales[item.name] = { totalSold: 0, totalProfit: 0 };
                        }
                        productSales[item.name].totalSold += item.quantity;
                        productSales[item.name].totalProfit += item.price * item.quantity;
                    });
                }
            });
        });

        const topSold = Object.entries(productSales)
            .map(([name, data]) => ({ name, totalSold: data.totalSold }))
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 5);

        const topProfit = Object.entries(productSales)
            .map(([name, data]) => ({ name, totalProfit: data.totalProfit }))
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .slice(0, 5);

        console.log("Performans göstergeleri gönderildi:", { topSold, topProfit });
        res.json({ topSold, topProfit });
    });
});

app.get("/cost-analysis", (req, res) => {
    db.all("SELECT * FROM students", [], (err, students) => {
        if (err) return res.status(500).json({ error: "Veritabanı hatası" });

        let productSales = {};
        let totalRevenue = 0;
        students.forEach(student => {
            const transactions = JSON.parse(student.transactions || "[]");
            transactions.forEach(t => {
                if (t.type === "Satın Alma") {
                    t.items.forEach(item => {
                        if (!productSales[item.name]) {
                            productSales[item.name] = { totalSold: 0, totalRevenue: 0 };
                        }
                        productSales[item.name].totalSold += item.quantity;
                        productSales[item.name].totalRevenue += item.price * item.quantity;
                        totalRevenue += item.price * item.quantity;
                    });
                }
            });
        });

        db.all("SELECT * FROM products", [], (err, products) => {
            if (err) return res.status(500).json({ error: "Veritabanı hatası" });

            const analysis = products.map(product => {
                const sales = productSales[product.name] || { totalSold: 0, totalRevenue: 0 };
                const totalProfit = sales.totalRevenue - (product.cost * sales.totalSold);
                return {
                    name: product.name,
                    cost: product.cost,
                    price: product.price,
                    totalSold: sales.totalSold,
                    totalProfit: totalProfit
                };
            });

            console.log("Maliyet analizi gönderildi:", { totalRevenue, products: analysis });
            res.json({ totalRevenue, products: analysis });
        });
    });
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
