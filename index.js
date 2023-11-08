

const express = require('express');
const cors = require('cors');


const jwt = require('jsonwebtoken');
const cookieparser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin:[
      'http://localhost:5174'
    ],
    credentials: true
  }));
  app.use(express.json()); 
  app.use(cookieparser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nprvrf8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = (req, res,next) => {
    console.log( 'log: info', req.method, req.url);
    next();
  }
  
  const verifyToken = (req, res, next) => {
    const Token = req?.cookies?.Token;
    console.log('token in the middleware', Token);
    if(!Token){
      return res.status(401).send({message: 'unothorized'})
    }
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if(err){
        return res.send({message : 'unauthorized access'})
      }
      req.user = decoded;
    })
    next();
  }

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodCollection = client.db('ResturentDB').collection('allfoods');
    const userCollection = client.db('ResturentDB').collection('user');
    const PurchaseCollection = client.db("ResturentDB").collection("userStore");


    app.post('/jwt', async(req, res)=> {
        const user = req.body;
        console.log('user for token', user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h' });
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        })
        .send({ success: true });
      });

       app.post('/logout', async(req, res) => {
        const user = req.body;
        console.log('logging out', user);
        res.clearCookie('token', {maxAge: 0}).send({success: true});
       })

    app.post('/user', async(req, res)=> {
        const user = req.body;
        console.log(user);
        const result = await userCollection.insertOne(user);
        res.send(result);
      })
  
      app.get('/user/:email', async(req, res) => {
        const email = req.params.email;
        const queary = {email: email}
        const result = await userCollection.findOne(queary);
        res.send(result);
      })

      app.post('/userStore', async(req, res)=> {
        const store = req.body;
        console.log(store);
        const result = await PurchaseCollection.insertOne(store);
        res.send(result);
      })
  
      app.get('/userStore/:email', async(req, res) => {
        const email = req.params.email;
        const queary = {email: email};
        const result = await PurchaseCollection.find(queary).toArray();
        res.send(result);
      })

      app.delete('/userStore/:id', async(req, res) => {
        const id = req.params.id;
        const queary = {_id: new ObjectId(id)}
        const result = await PurchaseCollection.deleteOne(queary);
        res.send(result);
    })

    app.get('/allfoods', async(req, res) => {
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);

        const result = await foodCollection.find()
        .skip(page * size)
        .limit(size)
        .toArray();
        res.send(result);
    })

    // app.post("/allfoods", async (req, res) => {
    //     const newCard = req.body;
    //     const result = await foodCollection.insertOne(newCard);
    //     res.send(result);
    //   });

      app.post('/allfoods', async(req, res)=> {
        const store = req.body;
        console.log(store);
        const result = await foodCollection.insertOne(store);
        res.send(result);
      })

      app.get('/allfoods/:email', async(req, res) => {
        const email = req.params.email;
        const queary = {email: email};
        const result = await foodCollection.find(queary).toArray();
        res.send(result);
      })


    app.get('/productsCount', async(req, res) => {
        const count = await foodCollection.estimatedDocumentCount();
        res.send({count});
      })

      app.get('/allfoods/details/:id', async(req, res) => {
        const id = req.params.id;
        const queary = {_id:  new ObjectId(id)}
        const result = await foodCollection.findOne(queary);
        res.send(result);
      })

      app.put('/allfoods/:id', async(req, res) => {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const options = {upsert: true};
        const UpdateCart = req.body;
        const carte = {
          $set: {
          names:  UpdateCart.Food_Name,
          image:  UpdateCart.Food_Image,
          Brand:  UpdateCart.Food_Category,
          Origin: UpdateCart.Food_Origin,
          Quantity: UpdateCart.Quantity,
          Price:  UpdateCart.Price, 
          Description:  UpdateCart.Description,
          }
        }
        const result = await foodCollection.updateOne(filter, carte, options)
        res.send(result);
      })
  





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) =>{
    res.send('john is busy shopping')
})

app.listen(port, () =>{
    console.log(`ema john server is running on port: ${port}`);
})

