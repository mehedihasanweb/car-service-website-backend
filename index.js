const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT;

// middleware
app.use(cors());
app.use(express.json());

// create token
const createToken = (user) => {
  const token = jwt.sign(
    {
      email: user?.email,
    },
    "secret",
    { expiresIn: 120 }
  );
  return token;
};

// verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const verify = jwt.verify(token, "secret");
  console.log(verify);
  if (!verify?.email) {
    return res.send("You are not Authorized");
  }
  req.email = verify?.email;
  next();
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.n214ykf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const service_collection = client
      .db("serviceDB")
      .collection("service_collection");

    const user_collection = client.db("userDB").collection("user");

    // product
    app.post("/service", async (req, res) => {
      const serviceData = req.body;
      const result = await service_collection.insertOne(serviceData);
      console.log(result);
      res.send(result);
    });

    app.get("/service", async (req, res) => {
      const result = await service_collection.find().toArray();
      res.send(result);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const result = await service_collection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.patch("/service/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const result = await service_collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      res.send(result);
    });

    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const result = await service_collection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // user
    app.post("/user", async (req, res) => {
      const user = req.body;

      const token = createToken(user);

      const existUser = await user_collection.findOne({ email: user?.email });
      if (existUser) {
        return res.send({
          status: "success",
          message: "Login Successfully",
          token,
        });
      }
      await user_collection.insertOne(user);
      res.send({ token });
    });

    app.get("/user/get/:id", async (req, res) => {
      const id = req.params.id;
      const result = await user_collection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;

      const result = await user_collection.findOne({ email });
      res.send(result);
    });

    app.patch("/user/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await user_collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
        { upsert: true }
      );

      res.send(result);
    });

    console.log("successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, () => {
  console.log(`Express app listening on port : ${port}`);
});
