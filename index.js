const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const session = require("express-session");

mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Oluwababa1",
    database: "my_db"
})

const app = new express();
app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: "secret"}));


function isItemInCart(cart, id) {
    for (let i=0; i<cart.length; i++){
        if(cart[i].id == id){
            return true;
        }
    }
    return false;
}

function calculateTotal(cart, req){
    total = 0;
    for (let i=0; i<cart.length; i++){
        total = total +  (cart[i].price * cart[i].quantity)
    }
    req.session.total = total;
    return total;
}

app.get('/', (req, res)=>{
    var connect = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "Oluwababa1",
        database: "my_db"
    })

    connect.query("SELECT * FROM menu", (err, result)=>{
        res.render("pages/index", {result: result})
    })
   
})

app.post('/addToCart', (req, res, next)=>{
    var id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var quantity = req.body.quantity;
    var image = req.body.image;
    var menuItem = {id:id, name:name, price:price, quantity:quantity, image:image };

    // var cart = new Cart(req.session.cart ? req.session.cart : []);

    if(req.session.cart){
        var cart = req.session.cart;
        if(!isItemInCart(cart, id)){
            cart.push(menuItem)
        }
     } else {
        req.session.cart = [menuItem];
        var cart = req.session.cart;
       // console.log("You visited this page " + req.session.page_views + " times");
     }
 
     //console.log(req.session)

    
    calculateTotal(cart, req);

    res.redirect("/cart");

});


app.get('/cart', (req,res)=>{
    var cart = req.session.cart;
    var total = req.session.total;

    res.render('pages/cart', {cart:cart, total:total});
});


app.post("/remove_item", (req,res)=>{
    var id = req.body.id;
    var cart = req.session.cart;
    for(let i=0; i<cart.length; i++){
        if(cart[i].id == id) {
            cart.splice(cart.indexOf(i), 1);
        }
    }

    calculateTotal(cart, req);
    res.redirect("/cart");

});

app.post("/edit_menu_quantity", (req,res)=>{
    var id = req.body.id;
    var quantity = req.body.quantity;
    var increase_btn = req.body.increase_quantity;
    var decrease_btn = req.body.decrease_quantity;

    var cart = req.session.cart;
    if(increase_btn){
        for (let i=0; i<cart.length; i++){
            if(cart[i].id == id) {
                if(cart[i].quantity > 0){
                    cart[i].quantity = parseInt(cart[i].quantity + 1);
                }
            }
        }
    }

    if(decrease_btn){
        for (let i=0; i<cart.length; i++){
            if(cart[i].id == id) {
                if(cart[i].quantity > 1){
                    cart[i].quantity = parseInt(cart[i].quantity - 1);
                }
            }
        }
    }
    calculateTotal(cart, req);
    res.redirect("/cart");
});

app.get("/checkout", (req, res)=>{
    res.render("pages/checkout")
})

app.post("/place_order", (req, res)=>{
    var fname = req.body.fname;
    var lname = req.body.lname;
    var email = req.body.email;
    var phone = req.body.phone_number;
    var address = req.body.address;
    var address2 = req.body.address2;
    var city = req.body.city;
    var province = req.body.province;
    var postal_code = req.body.postal_code;
    var cost = req.session.total;
    var status = "not paid";
    var date = new Date();
    var item_ids = "";

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "Oluwababa1",
        database: "my_db"
    });

    var cart = req.session.cart;
    for(let i=0; i<cart.lenght; i++){
        item_ids = item_ids + " " + cart[i].id;
    }

    con.connect((err)=>{
        if(err){
            console.log(err);
        } else {
            var query = "INSERT INTO orders(cost, fname, lname, email, status, address, address2, city, province, postal_code, phone, date, item_ids) VALUES?";
            var values = [
                [cost, fname, lname, email, status, address, address2, city, province, postal_code, phone, date, item_ids]
            ];
            con.query(query,[values],(err, result)=>{
                if(err){
                    console.log(err)
                } else {
                    res.redirect("/payment");
                }
                
            })
        }
    })
})

app.get("/payment", (req, res)=>{
    res.render("pages/payment")
})

app.get("/login", (req, res)=>{
    res.render("pages/signin")
})




app.listen(3000, ()=>{
    console.log("listening on port 3000...")
})