const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const session = require("express-session");

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'PObox69Kumba',
    database: 'my_db',
  });
  
  // Connect to the database
  db.connect((err) => {
    if (err) {
      throw err;
    }
    console.log('Connected to the database...');
  });

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
        db.query("SELECT * FROM menu", (err, result)=>{
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

    

    if(req.session.cart){
        var cart = req.session.cart;
        if(!isItemInCart(cart, id)){
            cart.push(menuItem)
        }
     } else {
        req.session.cart = [menuItem];
        var cart = req.session.cart;
       
     }
     
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

    // var con = mysql.createConnection({
    //     host: "localhost",
    //     user: "root",
    //     password: "PObox69Kumba",
    //     database: "my_db"
    // });

    var cart = req.session.cart;
    for(let i=0; i<cart.lenght; i++){
        item_ids = item_ids + " " + cart[i].id;
    }

    db.connect((err)=>{
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

app.get("/register", (req, res)=>{
    res.render("pages/register");
});

app.get('/signinError', (req, res)=>{
    res.render('pages/signinError')
})

app.get('/loggedIn', (req, res)=>{
    var connect = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "PObox69Kumba",
        database: "my_db"
    })

    connect.query("SELECT * FROM menu", (err, result)=>{
        if(req.session.loggedIn) {
            // console.log(result)
            res.render('pages/loggedIn', {username: req.session.username, result: result});
        } else {
            res.redirect('/');
        }
});
});

app.post('/register', (req, res)=>{
    const { username, password } = req.body;
  const user = { username, password };

  db.query('INSERT INTO customers SET ?', user, (err) => {
    if (err) {
      throw err;
    }
    res.redirect('/login');
  });
});

app.post('/login', (req, res)=>{
    const { username, password } = req.body;

  db.query(
    'SELECT * FROM customers WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) {
        throw err;
      }

      if (results.length === 1) {
        req.session.loggedIn = true;
        req.session.username = username;
        res.redirect('/loggedIn');
      } else {
        res.redirect('/signinError');
      }
    }
  );
})




app.listen(3000, ()=>{
    console.log("listening on port 3000...")
})