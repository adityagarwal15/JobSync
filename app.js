const express = require("express");
const app = express();
const path = require("path");
const mongoose = require('mongoose');
const User = require("./models/user.js");
const session = require("express-session");
const bcrypt = require("bcrypt");

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/jobSync');
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // true only with HTTPS
  })
);

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

app.get("/user/:id", async (req, res) => {
  if (!req.session.user || req.session.user._id !== req.params.id) {
    return res.status(403).send("Unauthorized");
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    res.render("user.ejs", { user });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save the user with the hashed password
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    req.session.user = newUser;

    res.redirect(`/user/${newUser._id}`);
  } catch (err) {
    res.send(`<script>alert("Account already exists!"); window.location.href = "/login";</script>`);
  }
});




app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.send(`<script>alert("Invalid credentials!"); window.location.href = "/login";</script>`);
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.send(`<script>alert("Invalid credentials!"); window.location.href = "/login";</script>`);
        }

        req.session.user = user;

        res.send(`
            <script>
                localStorage.setItem("username", "${user.name}");
                window.location.href = "/user/${user._id}";
            </script>
        `);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
})

app.listen(8080, () => {
  console.log("Server is listening");
});
