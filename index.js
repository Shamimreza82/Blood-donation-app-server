const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const port = process.env.PORT || 5000;

//// middleware

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwkgahw.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("value of token", token);
  if (!token) {
    console.log(err);
    return res.status(401).send({ massage: "not authorize" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ massage: "unauthorize" });
    }
    console.log("value in the token", decoded);
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful



    const dist = client.db("bloodDonationDB").collection("dist");
    const upzila = client.db("bloodDonationDB").collection("upazi");
    const usersCollection = client.db("bloodDonationDB").collection("users");
    const donationRequestCollection = client.db("bloodDonationDB").collection("donationRequest");




    ////////////////////
    app.get("/dist", async (req, res) => {
      const result = await dist.find().toArray();
      res.send(result);
    });
    app.get("/upazi", async (req, res) => {
      const result = await upzila.find().toArray();
      res.send(result);
    });
    ///////////////////

    /////// jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    //   app.post('/api/v1/logout', async(req, res) => {
    //     res.clearCookie('token', {maxAge: 0})
    //     })

    ////// users collections

    app.get('/users', async(req, res) => {
        const result = await usersCollection.find().toArray()
        res.send(result)
    })

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const user = req.params.email;
      console.log(user);
      const query = { email: user };
      const result = await usersCollection.findOne(query);
    //   console.log(result);
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const user = req.params.email;
      const updateProfile = req.body; 
      console.log("rrrrrrrrrrrrrr",user, updateProfile );
      const filter = { email: user };

      const updateDoc = {
        $set: {
          Name: updateProfile.Name, 
          bloodGroup: updateProfile.bloodGroup, 
          district: updateProfile.district,
          upazilia: updateProfile.upazilia
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      console.log(result);
      res.send(result);
    });

    //////// donation requst 

    app.post('/donationRequest', async(req, res) => {
        const donationRequest = req.body 
        const result = await donationRequestCollection.insertOne(donationRequest)
        res.send(result)
    })






    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
