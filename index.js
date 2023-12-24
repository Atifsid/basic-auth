const express = require("express");
const jwt = require("jsonwebtoken");
const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const jwtPassword = "123456";
const app = express();

app.use(express.json());

// add your mongoose connect url
mongoose.connect("")

const userSchema = new Schema({ name: String, email: String, password: String })

const User = mongoose.model('user', userSchema);

async function userExists(username, password) {
    const foundUser = await User.findOne({ email: username })
    if (foundUser && foundUser.password === password) {
        return foundUser;
    } else {
        console.log(`error in userExists: user not found! `);
    }
}

function createUser(name, email, password) {
    const newUser = new User({ name: name, email: email, password: password });
    try {
        const savedUser = newUser.save()
        return savedUser;
    } catch (error) {
        console.log(`error in createUser: ${error} `);
    }
}

app.post("/signin", async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        userExists(username, password)
            .then(userFound => {
                if (userFound) {
                    let token = jwt.sign({ username: username }, jwtPassword);
                    return res.json({
                        token,
                    });
                } else {
                    return res.status(403).json({
                        msg: "User doesnt exist in our in memory db",
                    });
                }
            })
    } else {
        return res.status(400).json({
            msg: "Invalid request.",
        });
    }
});

app.post("/signup", async function (req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    if (name && email && password) {
        userExists(email, password)
            .then(userFound => {
                if (!userFound) {
                    createUser(name, email, password).
                        then((isUserCreated) => {
                            if (isUserCreated) {
                                let token = jwt.sign({ username: email }, jwtPassword);
                                return res.status(200).json({
                                    token: token
                                })
                            } else {
                                return res.status(500).json({
                                    msg: "Something went wrong, please try again later.",
                                });
                            }
                        })
                } else {
                    return res.status(409).json({
                        msg: "User already exists.",
                    });
                }
            })
    } else {
        return res.status(400).json({
            msg: "Invalid request.",
        });
    }
});

app.get("/users", function (req, res) {
    const token = req.headers.authorization;
    jwt.verify(token.replace('Bearer ', ''), jwtPassword, (err, decoded) => {
        if (decoded) {
            User.find({ email: { $ne: decoded.username } })
                .then((doc) => {
                    if (doc) {
                        let userData = []
                        doc.forEach(user => {
                            userData.push({
                                id: user._id,
                                name: user.name,
                                email: user.email,
                            })
                        })
                        return res.status(200).json({
                            data: userData
                        });
                    }
                });
        } else {
            return res.status(403).json({
                msg: "Invalid token",
            });
        }
    });
});

app.listen(3000, () => {
    console.log('server started at port 3000');
});