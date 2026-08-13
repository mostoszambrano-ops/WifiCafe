from flask import Flask, render_template, jsonify, request
import sqlite3
import os

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), "wificafe.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            table_number TEXT DEFAULT '',
            status TEXT DEFAULT 'pendiente',
            total INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            item_name TEXT NOT NULL,
            item_price TEXT NOT NULL,
            item_price_num INTEGER DEFAULT 0,
            quantity INTEGER DEFAULT 1,
            section TEXT DEFAULT ''
        )
    """)
    conn.commit()
    conn.close()


@app.route("/")
def menu():
    return render_template("menu.html")


@app.route("/staff")
def staff():
    return render_template("staff.html")


@app.route("/api/orders", methods=["GET"])
def get_orders():
    conn = get_db()
    orders = conn.execute(
        "SELECT * FROM orders ORDER BY created_at DESC"
    ).fetchall()
    result = []
    for order in orders:
        items = conn.execute(
            "SELECT * FROM order_items WHERE order_id = ?", (order["id"],)
        ).fetchall()
        result.append({**dict(order), "items": [dict(i) for i in items]})
    conn.close()
    return jsonify(result)


@app.route("/api/orders", methods=["POST"])
def create_order():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    customer_name = (data.get("customerName") or "").strip()
    items = data.get("items") or []
    if not customer_name:
        return jsonify({"error": "customerName is required"}), 400
    if not items:
        return jsonify({"error": "items cannot be empty"}), 400

    total = sum(
        int(item.get("itemPriceNum", 0)) * int(item.get("quantity", 1))
        for item in items
    )
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO orders (customer_name, table_number, notes, total, status) "
        "VALUES (?, ?, ?, ?, 'pendiente')",
        (customer_name, data.get("tableNumber", ""), data.get("notes", ""), total),
    )
    order_id = cursor.lastrowid
    for item in items:
        conn.execute(
            "INSERT INTO order_items "
            "(order_id, item_name, item_price, item_price_num, quantity, section) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                order_id,
                item.get("itemName", ""),
                item.get("itemPrice", ""),
                int(item.get("itemPriceNum", 0)),
                int(item.get("quantity", 1)),
                item.get("section", ""),
            ),
        )
    conn.commit()
    order = dict(conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone())
    order_items = [
        dict(r)
        for r in conn.execute(
            "SELECT * FROM order_items WHERE order_id = ?", (order_id,)
        ).fetchall()
    ]
    conn.close()
    return jsonify({**order, "items": order_items}), 201


@app.route("/api/orders/<int:order_id>", methods=["PATCH"])
def update_order(order_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    allowed = ("pendiente", "preparando", "listo", "pagado")
    if status not in allowed:
        return jsonify({"error": f"status must be one of {allowed}"}), 400
    conn = get_db()
    conn.execute(
        "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (status, order_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(dict(row))


@app.route("/api/orders/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    conn = get_db()
    conn.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    conn.commit()
    conn.close()
    return "", 204


if __name__ == "__main__":
    init_db()
    print("✅  WifiCafé corriendo en http://localhost:5000")
    print("📋  Panel del personal en http://localhost:5000/staff")
    app.run(debug=True, port=5000)
