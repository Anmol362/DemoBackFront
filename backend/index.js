const express = require('express');
require('./db/config');
const User = require("./db/User");
const cors = require('cors');
const { response } = require('express');
const app = express();
const Product = require('./db/Product');
const Jwt = require('jsonwebtoken'); //it is used for securing data of api

const jwtkey = 'e-comm';


app.use(cors());

app.use(express.json());// for controlling the data from api data
app.post("/register", async (req, res) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({ result }, jwtkey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            res.send('Something Went Wrong Please try after Sometime');
        }
        else {
            res.send({ result, auth: token });
        }

    })
});
app.post("/login", async (req, res) => {
    // console.log(req.body.email);
    if (req.body.email && req.body.password) {

        let user = await User.findOne(req.body).select("-password");
        if (user) {                //expirytime 
            Jwt.sign({ user }, jwtkey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    res.send('Something Went Wrong Please try after Sometime');
                }
                res.send({ user, auth: token });
            })

        }
        else {
            res.send({ result: "No Data Found" })
        }
    }
    else {
        res.send({ result: "Email or Password is wrong" });
    }
});

app.post("/addproduct",verifyToken, async (req, res) => {
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result);
});

app.get('/products',verifyToken, async (req, res) => {
    let products = await Product.find();
    if (products.length > 0) {
        res.send(products);
    }
    else {
        res.send(
            {
                result: "No Product Found"
            })
    }
})

app.delete("/product/:id",verifyToken, async (req, res) => {
    // res.send(req.params.id);
    const result = await Product.deleteOne({ _id: req.params.id })
    res.send(result);
});

app.get('/product/:id', async (req, res) => {
    const result = await Product.findOne({ _id: req.params.id });
    if (result) {
        res.send(result);
    } else {
        res.send(
            { result: "No Product Found." }
        )
    }
});
app.put('/product/:id',verifyToken, async (req, res) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        {
            $set: req.body
        }
    )
    res.send(result);
});

app.get("/search/:key", verifyToken, async (req, res) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { price: { $regex: req.params.key } },
        ]
    })
    res.send(result);
});
function verifyToken(req, res, next) {
    let token = req.headers['authentication']
    if (token) {
        token = token.split(' ')[1];
        // console.warn("middle called if", token);
        Jwt.verify(token, jwtkey, (err, valid) => {
            if (err) {
                res.status(401).send({ result: 'Please Provide valid token' });
            }
            else {
                next();
            }
        })
    }
    else {
        res.status(403).send({ result: "Please Add token with header" });
     }

}

app.listen(5000);